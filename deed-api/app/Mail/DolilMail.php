<?php
namespace App\Mail;

use App\Models\Dolil;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class DolilMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $recipientName,
        public readonly string $subject,
        public readonly string $message,
        public readonly string $dolilTitle,
        public readonly string $dolilUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.dolil_event');
    }

    /**
     * Send an email to a user about a dolil event. Silently ignores failures.
     */
    public static function sendTo(User $recipient, string $subject, string $message, Dolil $dolil): void
    {
        try {
            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
            $dolilUrl    = $frontendUrl . '/dashboard/dolils/' . $dolil->id;

            Mail::to($recipient->email)->send(new self(
                recipientName: $recipient->name,
                subject:       $subject,
                message:       $message,
                dolilTitle:    $dolil->title,
                dolilUrl:      $dolilUrl,
            ));
        } catch (\Throwable $e) {
            \Log::error('DolilMail failed: ' . $e->getMessage());
        }
    }
}
