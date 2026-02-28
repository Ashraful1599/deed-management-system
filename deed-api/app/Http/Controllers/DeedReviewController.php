<?php

namespace App\Http\Controllers;

use App\Http\Resources\DeedReviewResource;
use App\Models\Deed;
use App\Models\DeedReview;
use App\Models\Notification;
use Illuminate\Http\Request;

class DeedReviewController extends Controller
{
    public function index(Request $request, Deed $deed)
    {
        $user = $request->user();
        if (!$deed->canAccess($user)) {
            abort(403);
        }

        return DeedReviewResource::collection(
            $deed->reviews()->with('reviewer')->latest()->get()
        );
    }

    public function store(Request $request, Deed $deed)
    {
        $user = $request->user();

        if (!$deed->canAccess($user)) {
            abort(403);
        }

        if (!in_array($deed->status, ['completed', 'archived'])) {
            abort(403, 'Reviews can only be submitted for completed or archived deeds');
        }

        if ($user->role === 'deed_writer') {
            abort(403, 'Deed writers cannot submit reviews');
        }

        if ($deed->assigned_to === $user->id) {
            abort(403, 'You cannot review your own work');
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body'   => ['nullable', 'string'],
        ]);

        if (DeedReview::where(['deed_id' => $deed->id, 'reviewer_id' => $user->id])->exists()) {
            return response()->json(['message' => 'You have already reviewed this deed'], 422);
        }

        $review = DeedReview::create([
            'deed_id'     => $deed->id,
            'reviewer_id' => $user->id,
            'rating'      => $data['rating'],
            'body'        => $data['body'] ?? null,
        ]);

        $review->load('reviewer');

        if ($deed->assigned_to) {
            Notification::create([
                'user_id' => $deed->assigned_to,
                'type'    => 'deed_reviewed',
                'data'    => [
                    'deed_id'    => $deed->id,
                    'deed_title' => $deed->title,
                    'actor_name' => $user->name,
                    'message'    => $user->name . ' left a ' . $data['rating'] . '-star review on: ' . $deed->title,
                ],
            ]);
        }

        return new DeedReviewResource($review);
    }

    public function update(Request $request, DeedReview $review)
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

        $deed = $review->deed;
        if ($deed && $deed->assigned_to) {
            Notification::create([
                'user_id' => $deed->assigned_to,
                'type'    => 'deed_reviewed',
                'data'    => [
                    'deed_id'    => $deed->id,
                    'deed_title' => $deed->title,
                    'actor_name' => $user->name,
                    'message'    => $user->name . ' updated their review on: ' . $deed->title,
                ],
            ]);
        }

        return new DeedReviewResource($review);
    }
}
