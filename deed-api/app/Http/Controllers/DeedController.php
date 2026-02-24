<?php
namespace App\Http\Controllers;
use App\Http\Requests\Deed\StoreDeedRequest;
use App\Http\Requests\Deed\UpdateDeedRequest;
use App\Http\Resources\DeedResource;
use App\Models\Deed;
use App\Models\Notification;
use Illuminate\Http\Request;

class DeedController extends Controller {
    public function index(Request $request) {
        $user = $request->user();
        $query = Deed::with(['creator', 'assignee'])
            ->withCount(['comments', 'documents']);

        if (!$user->isAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhere('assigned_to', $user->id);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        return DeedResource::collection(
            $query->orderByDesc('created_at')->paginate(20)
        );
    }

    public function store(StoreDeedRequest $request) {
        $deed = Deed::create(array_merge(
            $request->validated(),
            ['created_by' => $request->user()->id, 'status' => $request->status ?? 'draft']
        ));
        $deed->load(['creator', 'assignee']);

        // Notify assignee
        if ($deed->assigned_to) {
            Notification::create([
                'user_id' => $deed->assigned_to,
                'type'    => 'deed_assigned',
                'data'    => [
                    'deed_id'    => $deed->id,
                    'deed_title' => $deed->title,
                    'actor_name' => $request->user()->name,
                    'message'    => $request->user()->name . ' assigned a deed to you: ' . $deed->title,
                ],
            ]);
        }

        // Notify admins when a non-admin creates a deed
        if (!$request->user()->isAdmin()) {
            \App\Models\User::where('role', 'admin')->get()->each(function ($admin) use ($deed, $request) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type'    => 'deed_created',
                    'data'    => [
                        'deed_id'    => $deed->id,
                        'deed_title' => $deed->title,
                        'actor_name' => $request->user()->name,
                        'message'    => $request->user()->name . ' created a new deed: ' . $deed->title,
                    ],
                ]);
            });
        }

        return new DeedResource($deed);
    }

    public function show(Request $request, Deed $deed) {
        $this->authorizeAccess($deed, $request->user());
        $deed->load(['creator', 'assignee', 'documents']);
        $deed->loadCount(['comments', 'documents']);
        return new DeedResource($deed);
    }

    public function update(UpdateDeedRequest $request, Deed $deed) {
        $this->authorizeAccess($deed, $request->user());
        $validated = $request->validated();
        // Save originals before update (getOriginal() returns new values after save)
        $oldStatus   = $deed->status;
        $oldAssignee = $deed->assigned_to;
        $deed->update($validated);

        // Notify on status change
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            $this->notifyParties($deed, $request->user(), 'status_changed',
                $request->user()->name . ' changed deed status to "' . $deed->status . '": ' . $deed->title
            );
        }

        // Notify on new assignment
        if (isset($validated['assigned_to']) && $validated['assigned_to'] != $oldAssignee) {
            if ($deed->assigned_to) {
                Notification::create([
                    'user_id' => $deed->assigned_to,
                    'type'    => 'deed_assigned',
                    'data'    => [
                        'deed_id'    => $deed->id,
                        'deed_title' => $deed->title,
                        'actor_name' => $request->user()->name,
                        'message'    => $request->user()->name . ' assigned a deed to you: ' . $deed->title,
                    ],
                ]);
            }
        }

        $deed->load(['creator', 'assignee', 'documents']);
        return new DeedResource($deed);
    }

    public function destroy(Request $request, Deed $deed) {
        $this->authorizeAccess($deed, $request->user());
        $deed->delete();
        return response()->json(['message' => 'Deed deleted']);
    }

    private function authorizeAccess(Deed $deed, $user) {
        if (!$deed->canAccess($user)) {
            abort(403, 'Access denied');
        }
    }

    private function notifyParties(Deed $deed, $actor, string $type, string $message) {
        $targets = collect([$deed->created_by, $deed->assigned_to])
            ->filter(fn($id) => $id && $id !== $actor->id)
            ->unique();
        foreach ($targets as $userId) {
            Notification::create([
                'user_id' => $userId,
                'type'    => $type,
                'data'    => [
                    'deed_id'    => $deed->id,
                    'deed_title' => $deed->title,
                    'actor_name' => $actor->name,
                    'message'    => $message,
                ],
            ]);
        }
    }
}
