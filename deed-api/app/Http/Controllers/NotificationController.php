<?php
namespace App\Http\Controllers;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotificationController extends Controller {
    public function index(Request $request) {
        $notifications = $request->user()->notifications()->latest()->paginate(20);
        return NotificationResource::collection($notifications);
    }

    public function unreadCount(Request $request) {
        $count = $request->user()->notifications()->whereNull('read_at')->count();
        return response()->json(['count' => $count]);
    }

    public function markRead(Request $request, Notification $notification) {
        if ($notification->user_id !== $request->user()->id) { abort(403); }
        $notification->update(['read_at' => now()]);
        return new NotificationResource($notification);
    }

    public function markAllRead(Request $request) {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * SSE stream — push new notifications to client in real time.
     * Auth via ?token= query param (EventSource cannot set headers).
     */
    public function stream(Request $request): StreamedResponse
    {
        $tokenStr = $request->query('token');
        $pat = PersonalAccessToken::findToken($tokenStr);
        if (!$pat) {
            abort(401, 'Unauthorized');
        }
        $user = $pat->tokenable;

        return response()->stream(function () use ($user) {
            // Allow the SSE connection to stay open indefinitely
            set_time_limit(0);
            ini_set('output_buffering', 'off');

            // Start from the current latest notification id so we only push future ones
            $lastId = $user->notifications()->max('id') ?? 0;
            $heartbeatTick = 0;

            while (true) {
                if (connection_aborted()) {
                    break;
                }

                // Push any new notifications
                $newNotifications = $user->notifications()
                    ->where('id', '>', $lastId)
                    ->orderBy('id')
                    ->get();

                foreach ($newNotifications as $notif) {
                    echo "id: {$notif->id}\n";
                    echo 'data: ' . json_encode([
                        'id'         => $notif->id,
                        'type'       => $notif->type,
                        'data'       => $notif->data,
                        'read_at'    => $notif->read_at?->toISOString(),
                        'created_at' => $notif->created_at->toISOString(),
                    ]) . "\n\n";
                    $lastId = $notif->id;
                }

                // Send keepalive comment every 30 seconds to prevent proxy timeouts
                if ($heartbeatTick % 15 === 0) {
                    echo ": heartbeat\n\n";
                }
                $heartbeatTick++;

                ob_flush();
                flush();
                sleep(2);
            }
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection'        => 'keep-alive',
        ]);
    }
}
