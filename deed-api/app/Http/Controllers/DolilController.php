<?php
namespace App\Http\Controllers;
use App\Http\Requests\Dolil\StoreDolilRequest;
use App\Http\Requests\Dolil\UpdateDolilRequest;
use App\Http\Resources\DolilResource;
use App\Mail\DolilMail;
use App\Models\Dolil;
use App\Models\DolilActivity;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class DolilController extends Controller {
    public function index(Request $request) {
        $user = $request->user();
        $query = Dolil::with(['creator', 'assignee'])
            ->withCount(['comments', 'documents', 'reviews'])
            ->withAvg('reviews', 'rating');

        if (!$user->isAdmin() && $user->role !== 'dolil_writer') {
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhere('assigned_to', $user->id);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('dolils.created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('dolils.created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $isNumeric = is_numeric(trim($request->search));
            $query->where(function ($q) use ($term, $isNumeric, $request) {
                $q->where('title', 'like', $term)
                  ->orWhere('deed_number', 'like', $term)
                  ->orWhere('description', 'like', $term)
                  ->orWhereHas('creator', function ($u) use ($term) {
                      $u->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term)
                        ->orWhere('phone', 'like', $term);
                  })
                  ->orWhereHas('assignee', function ($u) use ($term) {
                      $u->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term)
                        ->orWhere('phone', 'like', $term);
                  });
                if ($isNumeric) {
                    $q->orWhere('id', (int) trim($request->search));
                }
            });
        }

        $allowed  = ['id', 'deed_number', 'title', 'status', 'created_at', 'creator', 'assignee'];
        $sortBy   = in_array($request->sort_by, $allowed) ? $request->sort_by : 'created_at';
        $sortDir  = $request->sort_dir === 'asc' ? 'asc' : 'desc';

        if ($sortBy === 'creator') {
            $query->leftJoin('users as creators', 'creators.id', '=', 'dolils.created_by')
                  ->select('dolils.*')
                  ->orderBy('creators.name', $sortDir);
        } elseif ($sortBy === 'assignee') {
            $query->leftJoin('users as assignees', 'assignees.id', '=', 'dolils.assigned_to')
                  ->select('dolils.*')
                  ->orderBy('assignees.name', $sortDir);
        } else {
            $query->orderBy('dolils.' . $sortBy, $sortDir);
        }

        return DolilResource::collection($query->paginate(20));
    }

    public function store(StoreDolilRequest $request) {
        $dolil = Dolil::create(array_merge(
            $request->validated(),
            ['created_by' => $request->user()->id, 'status' => $request->status ?? 'draft']
        ));
        $dolil->load(['creator', 'assignee']);

        // Activity log
        DolilActivity::log($dolil->id, $request->user()->id, 'dolil_created',
            $request->user()->name . ' created this dolil.');

        // Notify + email assignee
        if ($dolil->assigned_to) {
            $msg = $request->user()->name . ' assigned a dolil to you: ' . $dolil->title;
            Notification::create([
                'user_id' => $dolil->assigned_to,
                'type'    => 'dolil_assigned',
                'data'    => ['dolil_id' => $dolil->id, 'dolil_title' => $dolil->title, 'actor_name' => $request->user()->name, 'message' => $msg],
            ]);
            DolilActivity::log($dolil->id, $request->user()->id, 'dolil_assigned',
                $request->user()->name . ' assigned the dolil to ' . $dolil->assignee->name . '.',
                ['assignee_name' => $dolil->assignee->name]);
            if ($assignee = User::find($dolil->assigned_to)) {
                DolilMail::sendTo($assignee, 'Dolil Assigned: ' . $dolil->title, $msg, $dolil);
            }
        }

        // Notify admins when a non-admin creates a dolil
        if (!$request->user()->isAdmin()) {
            User::where('role', 'admin')->get()->each(function ($admin) use ($dolil, $request) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type'    => 'dolil_created',
                    'data'    => ['dolil_id' => $dolil->id, 'dolil_title' => $dolil->title, 'actor_name' => $request->user()->name,
                        'message' => $request->user()->name . ' created a new dolil: ' . $dolil->title],
                ]);
            });
        }

        return new DolilResource($dolil);
    }

    public function show(Request $request, Dolil $dolil) {
        $this->authorizeAccess($dolil, $request->user());
        $dolil->load(['creator', 'assignee', 'documents']);
        $dolil->loadCount(['comments', 'documents']);
        $dolil->loadSum('payments', 'amount');
        return new DolilResource($dolil);
    }

    public function update(UpdateDolilRequest $request, Dolil $dolil) {
        $this->authorizeAccess($dolil, $request->user());
        $validated = $request->validated();

        // Enforce role-based status transitions
        if (isset($validated['status']) && $validated['status'] !== $dolil->status) {
            $allowed = $dolil->allowedTransitions($request->user());
            if (!in_array($validated['status'], $allowed)) {
                return response()->json(['message' => 'This status transition is not allowed.'], 403);
            }
        }

        // Save originals before update (getOriginal() returns new values after save)
        $oldStatus   = $dolil->status;
        $oldAssignee = $dolil->assigned_to;
        $dolil->update($validated);

        // Notify + log + email on status change
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            $msg = $request->user()->name . ' changed dolil status to "' . $dolil->status . '": ' . $dolil->title;
            $this->notifyParties($dolil, $request->user(), 'status_changed', $msg);
            DolilActivity::log($dolil->id, $request->user()->id, 'status_changed',
                $request->user()->name . ' changed status from "' . $oldStatus . '" to "' . $dolil->status . '".',
                ['from' => $oldStatus, 'to' => $dolil->status]);
            $this->emailParties($dolil, $request->user(), 'Status Changed: ' . $dolil->title, $msg);
        }

        // Notify + log + email on new assignment
        if (isset($validated['assigned_to']) && $validated['assigned_to'] != $oldAssignee) {
            if ($dolil->assigned_to) {
                $msg = $request->user()->name . ' assigned a dolil to you: ' . $dolil->title;
                Notification::create([
                    'user_id' => $dolil->assigned_to,
                    'type'    => 'dolil_assigned',
                    'data'    => ['dolil_id' => $dolil->id, 'dolil_title' => $dolil->title, 'actor_name' => $request->user()->name, 'message' => $msg],
                ]);
                DolilActivity::log($dolil->id, $request->user()->id, 'dolil_assigned',
                    $request->user()->name . ' assigned the dolil to ' . ($dolil->assignee->name ?? ''),
                    ['assignee_name' => $dolil->assignee?->name]);
                if ($assignee = User::find($dolil->assigned_to)) {
                    DolilMail::sendTo($assignee, 'Dolil Assigned: ' . $dolil->title, $msg, $dolil);
                }
            }
        }

        $dolil->load(['creator', 'assignee', 'documents']);
        return new DolilResource($dolil);
    }

    public function destroy(Request $request, Dolil $dolil) {
        $this->authorizeAccess($dolil, $request->user());
        $dolil->delete();
        return response()->json(['message' => 'Dolil deleted']);
    }

    public function activities(Request $request, Dolil $dolil) {
        $this->authorizeAccess($dolil, $request->user());
        $activities = $dolil->activities()->with('user')->orderByDesc('created_at')->get();
        return response()->json($activities->map(fn($a) => [
            'id'          => $a->id,
            'action'      => $a->action,
            'description' => $a->description,
            'meta'        => $a->meta,
            'actor'       => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name] : null,
            'created_at'  => $a->created_at,
        ]));
    }

    private function authorizeAccess(Dolil $dolil, $user) {
        if (!$dolil->canAccess($user)) {
            abort(403, 'Access denied');
        }
    }

    private function emailParties(Dolil $dolil, $actor, string $subject, string $message): void {
        $targets = collect([$dolil->created_by, $dolil->assigned_to])
            ->filter(fn($id) => $id && $id !== $actor->id)->unique();
        foreach ($targets as $userId) {
            if ($recipient = User::find($userId)) {
                DolilMail::sendTo($recipient, $subject, $message, $dolil);
            }
        }
    }

    private function notifyParties(Dolil $dolil, $actor, string $type, string $message) {
        $targets = collect([$dolil->created_by, $dolil->assigned_to])
            ->filter(fn($id) => $id && $id !== $actor->id)
            ->unique();
        foreach ($targets as $userId) {
            Notification::create([
                'user_id' => $userId,
                'type'    => $type,
                'data'    => [
                    'dolil_id'    => $dolil->id,
                    'dolil_title' => $dolil->title,
                    'actor_name'  => $actor->name,
                    'message'     => $message,
                ],
            ]);
        }
    }
}
