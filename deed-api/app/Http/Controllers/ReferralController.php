<?php

namespace App\Http\Controllers;

use App\Models\Referral;
use App\Models\User;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Generate referral code for existing users that predate the referral system
        if (!$user->referral_code) {
            do {
                $code = strtoupper(\Illuminate\Support\Str::random(8));
            } while (User::where('referral_code', $code)->exists());
            $user->update(['referral_code' => $code]);
            $user->refresh();
        }

        $referrals = Referral::where('referrer_id', $user->id)
            ->with('referred:id,name,phone,created_at,phone_verified_at,email_verified_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($r) => [
                'id'          => $r->id,
                'name'        => $r->referred->name,
                'phone'       => $r->referred->phone,
                'joined_at'   => $r->created_at,
                'credited'    => !is_null($r->credited_at),
                'credited_at' => $r->credited_at,
            ]);

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        return response()->json([
            'referral_code' => $user->referral_code,
            'referral_url'  => $frontendUrl . '/register?ref=' . $user->referral_code,
            'credits'       => $user->credits ?? 0,
            'total_referred' => $referrals->count(),
            'total_credited' => $referrals->where('credited', true)->count(),
            'referrals'     => $referrals,
        ]);
    }
}
