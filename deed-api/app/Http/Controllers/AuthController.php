<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $data = $request->validated();

        // Resolve referrer before creating user
        $referrer = null;
        if (!empty($data['referral_code'])) {
            $referrer = User::where('referral_code', $data['referral_code'])->first();
        }

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
            'division_id'         => $data['division_id'] ?? null,
            'district_id'         => $data['district_id'] ?? null,
            'upazila_id'          => $data['upazila_id'] ?? null,
            'referred_by'         => $referrer?->id,
            'credits'             => 20, // signup bonus
        ]);

        // Create referral record if referred
        if ($referrer) {
            Referral::create([
                'referrer_id' => $referrer->id,
                'referred_id' => $user->id,
            ]);
        }

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $path = $file->storeAs('avatars', Str::uuid().'.'.$file->getClientOriginalExtension(), 'r2');
            $user->update(['avatar' => env('R2_PUBLIC_URL').'/'.$path]);
        }

        // Send verification email
        $user->sendEmailVerificationNotification();

        $token = $user->createToken('deed-app')->plainTextToken;

        return response()->json([
            'user'              => new UserResource($user),
            'token'             => $token,
            'email_verified'    => false,
            'message'           => 'Registration successful. Please check your email to verify your account.',
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

        // Allow login if either email or phone is verified
        if (!$user->hasVerifiedEmail() && !$user->phone_verified_at) {
            return response()->json([
                'message'        => 'Please verify your email address or phone number before logging in.',
                'email_verified' => false,
                'email'          => $user->email,
            ], 403);
        }

        $token = $user->createToken('deed-app')->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ]);
    }

    // GET /api/email/verify/{id}/{hash}  (signed URL from email)
    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403, 'Invalid verification link.');
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            $this->creditReferrer($user);
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        return redirect($frontendUrl . '/login?verified=1');
    }

    // POST /api/email/verify/resend  (authenticated)
    public function resendVerification(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification email sent. Please check your inbox.']);
    }

    // POST /api/email/verify/resend-by-email  (public — for users who lost their session)
    public function resendByEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if ($user && !$user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        // Always return success to avoid email enumeration
        return response()->json(['message' => 'If that email is registered and unverified, a new link has been sent.']);
    }

    public function user(Request $request)
    {
        return new UserResource($request->user()->load(['divisionRel', 'districtRel', 'upazila']));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate(['avatar' => 'required|image|mimes:jpg,jpeg,png,gif,webp|max:2048']);
        $user = $request->user();
        $file = $request->file('avatar');
        $path = $file->storeAs('avatars', Str::uuid().'.'.$file->getClientOriginalExtension(), 'r2');
        $user->update(['avatar' => env('R2_PUBLIC_URL').'/'.$path]);
        return new UserResource($user->fresh());
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
            'division_id'  => ['nullable', 'integer', 'exists:bd_divisions,id'],
            'district_id'  => ['nullable', 'integer', 'exists:bd_districts,id'],
            'upazila_id'   => ['nullable', 'integer', 'exists:bd_upazilas,id'],
            'avatar'       => ['nullable', 'string'],
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        // If phone number changed, reset phone verification
        if (isset($data['phone']) && $data['phone'] !== $request->user()->phone) {
            $data['phone_verified_at'] = null;
        }

        $request->user()->update($data);
        return new UserResource($request->user()->fresh()->load(['divisionRel', 'districtRel', 'upazila']));
    }

    public function creditReferrer(User $user): void
    {
        if (!$user->referred_by) return;
        $referral = Referral::where('referred_id', $user->id)
            ->whereNull('credited_at')
            ->first();
        if (!$referral) return;
        $referral->update(['credited_at' => now()]);
        User::where('id', $user->referred_by)->increment('credits', 10);
    }
}
