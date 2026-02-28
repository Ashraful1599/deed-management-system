<?php
namespace App\Http\Controllers;
use App\Http\Resources\DeedResource;
use App\Http\Resources\UserResource;
use App\Models\Deed;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller {
    public function users(Request $request) {
        $query = User::query();
        if ($request->filled('role'))   { $query->where('role', $request->role); }
        if ($request->filled('status')) { $query->where('status', $request->status); }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(fn($q2) => $q2->where('name', 'like', "%$q%")->orWhere('email', 'like', "%$q%"));
        }
        return UserResource::collection($query->orderByDesc('created_at')->paginate(20));
    }

    public function updateUser(Request $request, User $user) {
        $data = $request->validate([
            'status' => ['sometimes', 'in:active,pending,suspended'],
            'role'   => ['sometimes', 'in:user,deed_writer,admin'],
        ]);
        $user->update($data);
        return new UserResource($user->fresh());
    }

    public function deeds(Request $request) {
        $query = Deed::with(['creator', 'assignee'])->withCount(['comments', 'documents']);
        if ($request->filled('status'))    { $query->where('status', $request->status); }
        if ($request->filled('date_from')) { $query->whereDate('created_at', '>=', $request->date_from); }
        if ($request->filled('date_to'))   { $query->whereDate('created_at', '<=', $request->date_to); }
        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                  ->orWhere('deed_number', 'like', $term)
                  ->orWhereHas('creator',  fn($u) => $u->where('name', 'like', $term)->orWhere('email', 'like', $term))
                  ->orWhereHas('assignee', fn($u) => $u->where('name', 'like', $term)->orWhere('email', 'like', $term));
            });
        }
        return DeedResource::collection($query->orderByDesc('created_at')->paginate(50));
    }

    public function stats() {
        return response()->json([
            'users_total'         => User::count(),
            'users_by_role'       => User::selectRaw('role, count(*) as count')->groupBy('role')->pluck('count', 'role'),
            'users_by_status'     => User::selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
            'users_new_today'     => User::whereDate('created_at', today())->count(),
            'users_new_this_week' => User::where('created_at', '>=', now()->startOfWeek())->count(),
            'deeds_total'         => Deed::count(),
            'deeds_by_status'     => Deed::selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
            'deeds_new_today'     => Deed::whereDate('created_at', today())->count(),
            'deeds_new_this_week' => Deed::where('created_at', '>=', now()->startOfWeek())->count(),
            'recent_users'        => User::orderByDesc('created_at')->limit(6)->get()->map(fn($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => $u->role,
                'status'     => $u->status,
                'created_at' => $u->created_at,
            ]),
            'recent_deeds'        => Deed::with(['creator', 'assignee'])->orderByDesc('created_at')->limit(6)->get()->map(fn($d) => [
                'id'          => $d->id,
                'title'       => $d->title,
                'status'      => $d->status,
                'created_by'  => $d->creator?->name,
                'assigned_to' => $d->assignee?->name,
                'created_at'  => $d->created_at,
            ]),
        ]);
    }
}
