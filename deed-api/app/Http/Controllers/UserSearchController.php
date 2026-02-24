<?php
namespace App\Http\Controllers;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserSearchController extends Controller {
    public function search(Request $request) {
        $request->validate(['q' => ['required', 'string', 'min:2']]);
        $q = $request->q;
        $users = User::where(function ($query) use ($q) {
                $query->where('email', 'like', "%$q%")
                      ->orWhere('phone', 'like', "%$q%")
                      ->orWhere('name', 'like', "%$q%");
            })
            ->where('id', '!=', $request->user()->id)
            ->where('status', 'active')
            ->limit(10)
            ->get();
        return UserResource::collection($users);
    }
}
