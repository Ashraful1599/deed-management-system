<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Normalize a Bangladeshi phone number to the 880XXXXXXXXXX format.
     * Accepts: 01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX
     */
    private function normalize(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone); // strip non-digits
        if (str_starts_with($phone, '880')) return $phone;
        if (str_starts_with($phone, '0'))   return '88' . $phone;
        return '880' . $phone;
    }

    /**
     * Send an SMS message. Returns true on success.
     * Falls back to logging if API key is not configured (local dev).
     */
    public function send(string $phone, string $message): bool
    {
        $apiKey   = config('services.bulksmsbd.api_key');
        $senderId = config('services.bulksmsbd.sender_id');

        if (!$apiKey) {
            // Dev mode: log the OTP instead of sending
            Log::info('[SmsService DEV] SMS to ' . $phone . ': ' . $message);
            return true;
        }

        $number = $this->normalize($phone);

        $params = [
            'api_key' => $apiKey,
            'number'  => $number,
            'message' => $message,
            'type'    => 'text',
        ];

        if ($senderId) {
            $params['senderid'] = $senderId;
        }

        $response = Http::timeout(10)->get('http://bulksmsbd.net/api/smsapi', $params);

        if (!$response->successful()) {
            Log::error('[SmsService] HTTP error: ' . $response->status());
            return false;
        }

        $code = $response->json('response_code');
        if ($code != 202) {
            Log::error('[SmsService] API error code=' . $code . ' body=' . $response->body() . ' number=' . $number);
            return false;
        }

        return true;
    }
}
