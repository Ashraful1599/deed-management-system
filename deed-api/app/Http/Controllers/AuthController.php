<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $data = $request->validated();

        $user = User::create([
            'name'                => $data['name'],
            'email'               => $data['email'],
            'phone'               => $data['phone'],
            'password'            => Hash::make($data['password']),
            'role'                => $data['role'],
            'status'              => 'active',
            'registration_number' => $data['registration_number'] ?? null,
            'office_name'         => $data['office_name'] ?? null,
            'district'            => $data['district'] ?? null,
        ]);

        $token = $user->createToken('deed-app')->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $login = $request->login;
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';
        $user  = User::where($field, $login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Invalid credentials.'],
            ]);
        }

        if ($user->status === 'suspended') {
            throw ValidationException::withMessages([
                'login' => ['Your account has been suspended.'],
            ]);
        }

        $token = $user->createToken('deed-app')->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ]);
    }

    public function user(Request $request)
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name'         => ['sometimes', 'string', 'max:255'],
            'phone'        => ['sometimes', 'string', 'unique:users,phone,' . $request->user()->id],
            'email'        => ['sometimes', 'email', 'unique:users,email,' . $request->user()->id],
            'password'     => ['sometimes', 'string', 'min:8'],
            'office_name'  => ['nullable', 'string'],
            'district'     => ['nullable', 'string'],
            'avatar'       => ['nullable', 'string'],
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $request->user()->update($data);
        return new UserResource($request->user()->fresh());
    }
}
