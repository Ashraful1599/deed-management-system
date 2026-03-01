<?php
namespace App\Http\Controllers;

use App\Models\PhoneOtpVerification;
use App\Services\SmsService;
use Illuminate\Http\Request;

class PhoneVerificationController extends Controller
{
    public function __construct(private SmsService $sms) {}

    /**
     * Generate and send an OTP to the authenticated user's phone.
     * Rate-limited via route middleware (3 per 60 min).
     */
    public function send(Request $request)
    {
        $user = $request->user();

        if (!$user->phone) {
            return response()->json(['message' => 'Please add a phone number to your profile first.'], 422);
        }

        if ($user->phone_verified_at) {
            return response()->json(['message' => 'Phone number is already verified.'], 422);
        }

        // Invalidate any previous unexpired OTPs for this user
        PhoneOtpVerification::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->update(['expires_at' => now()]);

        // Generate 4-digit OTP
        $otp  = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        $hash = hash('sha256', $otp);

        PhoneOtpVerification::create([
            'user_id'    => $user->id,
            'phone'      => $user->phone,
            'code'       => $hash,
            'expires_at' => now()->addMinutes(15),
        ]);

        $sent = $this->sms->send(
            $user->phone,
            "Your DolilBD OTP is {$otp}. Valid for 15 minutes."
        );

        if (!$sent) {
            return response()->json(['message' => 'Failed to send OTP. Please try again.'], 500);
        }

        return response()->json(['message' => 'OTP sent successfully.', 'expires_in' => 900]);
    }

    /**
     * Verify the OTP submitted by the user.
     */
    public function verify(Request $request)
    {
        $request->validate(['code' => 'required|string|size:4']);

        $user = $request->user();

        if ($user->phone_verified_at) {
            return response()->json(['message' => 'Phone number is already verified.'], 422);
        }

        $record = PhoneOtpVerification::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$record) {
            return response()->json(['message' => 'OTP expired or not found. Please request a new one.'], 422);
        }

        if (!hash_equals($record->code, hash('sha256', $request->code))) {
            return response()->json(['message' => 'Invalid OTP. Please check and try again.'], 422);
        }

        // Mark OTP as used
        $record->update(['verified_at' => now()]);

        // Mark user's phone as verified
        $user->update(['phone_verified_at' => now()]);
        $user->refresh();

        // Credit referrer if not yet credited
        (new \App\Http\Controllers\AuthController())->creditReferrer($user);

        $user->load(['districtRel', 'upazila']);

        return response()->json([
            'message' => 'Phone number verified successfully.',
            'user'    => (new \App\Http\Resources\UserResource($user))->resolve(),
        ]);
    }
}
