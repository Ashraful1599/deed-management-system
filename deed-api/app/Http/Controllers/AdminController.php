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
        if ($request->filled('status')) { $query->where('status', $request->status); }
        if ($request->filled('search')) { $query->where('title', 'like', '%' . $request->search . '%'); }
        return DeedResource::collection($query->orderByDesc('created_at')->paginate(20));
    }

    public function stats() {
        return response()->json([
            'users_total'        => User::count(),
            'users_by_role'      => User::selectRaw('role, count(*) as count')->groupBy('role')->pluck('count', 'role'),
            'users_by_status'    => User::selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
            'deeds_total'        => Deed::count(),
            'deeds_by_status'    => Deed::selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
        ]);
    }
}
