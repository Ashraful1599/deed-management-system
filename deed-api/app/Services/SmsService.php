<?php
namespace App\Services;

use Illuminate\Support\Facades\Log;
use Twilio\Rest\Client;

class SmsService
{
    /**
     * Send an SMS message via Twilio. Returns true on success.
     * Falls back to logging if credentials are not configured (local dev).
     */
    public function send(string $phone, string $message): bool
    {
        $sid   = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from  = config('services.twilio.from');

        if (!$sid || !$token || !$from) {
            // Dev mode: log the OTP instead of sending
            Log::info('[SmsService DEV] SMS to ' . $phone . ': ' . $message);
            return true;
        }

        try {
            $client = new Client($sid, $token);
            $client->messages->create($phone, [
                'from' => $from,
                'body' => $message,
            ]);
            return true;
        } catch (\Exception $e) {
            Log::error('[SmsService] Twilio error: ' . $e->getMessage());
            return false;
        }
    }
}
