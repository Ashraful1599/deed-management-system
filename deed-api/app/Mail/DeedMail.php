<?php
namespace App\Mail;

use App\Models\Deed;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class DeedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $recipientName,
        public readonly string $subject,
        public readonly string $message,
        public readonly string $deedTitle,
        public readonly string $deedUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.deed_event');
    }

    /**
     * Send an email to a user about a deed event. Silently ignores failures.
     */
    public static function sendTo(User $recipient, string $subject, string $message, Deed $deed): void
    {
        try {
            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
            $deedUrl     = $frontendUrl . '/dashboard/deeds/' . $deed->id;

            Mail::to($recipient->email)->send(new self(
                recipientName: $recipient->name,
                subject:       $subject,
                message:       $message,
                deedTitle:     $deed->title,
                deedUrl:       $deedUrl,
            ));
        } catch (\Throwable $e) {
            \Log::error('DeedMail failed: ' . $e->getMessage());
        }
    }
}
