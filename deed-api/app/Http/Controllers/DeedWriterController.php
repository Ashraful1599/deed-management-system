<?php

namespace App\Http\Controllers;

use App\Http\Resources\DeedReviewResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class DeedWriterController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->where('role', 'deed_writer')
            ->where('status', 'active')
            ->with(['divisionRel', 'districtRel', 'upazila'])
            ->withAvg('receivedReviews', 'rating')
            ->withCount('receivedReviews');

        if ($request->filled('division_id')) {
            $query->where('division_id', $request->division_id);
        }

        if ($request->filled('district_id')) {
            $query->where('district_id', $request->district_id);
        }

        if ($request->filled('upazila_id')) {
            $query->where('upazila_id', $request->upazila_id);
        }

        if ($request->filled('search')) {
            $q = '%' . $request->search . '%';
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', $q)
                    ->orWhere('office_name', 'like', $q)
                    ->orWhere('registration_number', 'like', $q);
            });
        }

        $writers = $query->orderBy('name')->paginate(12);

        return UserResource::collection($writers);
    }

    public function show(User $user)
    {
        if ($user->role !== 'deed_writer' || $user->status !== 'active') {
            abort(404);
        }

        $user->load(['divisionRel', 'districtRel', 'upazila'])
             ->loadAvg('receivedReviews', 'rating')
             ->loadCount('receivedReviews');

        // Load reviews with reviewer info (through deeds)
        $reviews = $user->receivedReviews()
            ->with('reviewer')
            ->latest()
            ->take(20)
            ->get();

        return response()->json([
            'writer'  => new UserResource($user),
            'reviews' => DeedReviewResource::collection($reviews),
        ]);
    }
}
