<?php

namespace App\Http\Controllers;

use App\Http\Resources\DolilReviewResource;
use App\Mail\DolilMail;
use App\Models\Dolil;
use App\Models\DolilActivity;
use App\Models\DolilReview;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class DolilReviewController extends Controller
{
    public function index(Request $request, Dolil $dolil)
    {
        $user = $request->user();
        if (!$dolil->canAccess($user)) {
            abort(403);
        }

        return DolilReviewResource::collection(
            $dolil->reviews()->with('reviewer')->latest()->get()
        );
    }

    public function store(Request $request, Dolil $dolil)
    {
        $user = $request->user();

        if (!$dolil->canAccess($user)) {
            abort(403);
        }

        if (!in_array($dolil->status, ['completed', 'archived'])) {
            abort(403, 'Reviews can only be submitted for completed or archived dolils');
        }

        if ($user->role === 'dolil_writer') {
            abort(403, 'Dolil writers cannot submit reviews');
        }

        if ($dolil->assigned_to === $user->id) {
            abort(403, 'You cannot review your own work');
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body'   => ['nullable', 'string'],
        ]);

        if (DolilReview::where(['dolil_id' => $dolil->id, 'reviewer_id' => $user->id])->exists()) {
            return response()->json(['message' => 'You have already reviewed this dolil'], 422);
        }

        $review = DolilReview::create([
            'dolil_id'    => $dolil->id,
            'reviewer_id' => $user->id,
            'rating'      => $data['rating'],
            'body'        => $data['body'] ?? null,
        ]);

        $review->load('reviewer');

        $msgText = $user->name . ' left a ' . $data['rating'] . '-star review on: ' . $dolil->title;
        DolilActivity::log($dolil->id, $user->id, 'review_added',
            $user->name . ' left a ' . $data['rating'] . '-star review.',
            ['rating' => $data['rating']]);

        if ($dolil->assigned_to) {
            Notification::create([
                'user_id' => $dolil->assigned_to,
                'type'    => 'dolil_reviewed',
                'data'    => ['dolil_id' => $dolil->id, 'dolil_title' => $dolil->title, 'actor_name' => $user->name, 'message' => $msgText],
            ]);
            if ($assignee = User::find($dolil->assigned_to)) {
                DolilMail::sendTo($assignee, 'New Review: ' . $dolil->title, $msgText, $dolil);
            }
        }

        return new DolilReviewResource($review);
    }

    public function update(Request $request, DolilReview $review)
    {
        $user = $request->user();

        if ($review->reviewer_id !== $user->id && !$user->isAdmin()) {
            abort(403);
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body'   => ['nullable', 'string'],
        ]);

        $review->update([
            'rating' => $data['rating'],
            'body'   => $data['body'] ?? null,
        ]);

        $review->load('reviewer');

        $dolil = $review->dolil;
        if ($dolil) {
            DolilActivity::log($dolil->id, $user->id, 'review_updated',
                $user->name . ' updated their review to ' . $data['rating'] . ' stars.',
                ['rating' => $data['rating']]);
            if ($dolil->assigned_to) {
                $msgText = $user->name . ' updated their review on: ' . $dolil->title;
                Notification::create([
                    'user_id' => $dolil->assigned_to,
                    'type'    => 'dolil_reviewed',
                    'data'    => ['dolil_id' => $dolil->id, 'dolil_title' => $dolil->title, 'actor_name' => $user->name, 'message' => $msgText],
                ]);
            }
        }

        return new DolilReviewResource($review);
    }
}
