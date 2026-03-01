<?php
namespace App\Http\Controllers;
use App\Http\Resources\CommentResource;
use App\Mail\DeedMail;
use App\Models\Comment;
use App\Models\Deed;
use App\Models\DeedActivity;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CommentController extends Controller {
    public function index(Request $request, Deed $deed) {
        if (!$deed->canAccess($request->user())) { abort(403); }
        $comments = $deed->comments()->with('user')->get();
        return CommentResource::collection($comments);
    }

    public function store(Request $request, Deed $deed) {
        if (!$deed->canAccess($request->user())) { abort(403); }
        $data = $request->validate([
            'body'       => ['nullable', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:20480'],
        ]);

        // Must have at least a body or an attachment
        if (empty($data['body']) && !$request->hasFile('attachment')) {
            return response()->json(['message' => 'A comment body or attachment is required.'], 422);
        }

        $comment = new Comment([
            'deed_id' => $deed->id,
            'user_id' => $request->user()->id,
            'body'    => $data['body'],
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $stored = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('comments/' . $deed->id, $stored, 'r2');
            $comment->attachment_path = $path;
            $comment->attachment_name = $file->getClientOriginalName();
            $comment->attachment_mime = $file->getMimeType();
        }

        $comment->save();
        $comment->load('user');

        $isAttachmentOnly = $comment->attachment_path && empty($data['body']);
        $msgText = $request->user()->name . ($isAttachmentOnly ? ' attached a file on: ' : ' commented on: ') . $deed->title;

        // Activity log
        DeedActivity::log($deed->id, $request->user()->id,
            $isAttachmentOnly ? 'file_attached' : 'comment_added',
            $request->user()->name . ($isAttachmentOnly ? ' attached a file.' : ' added a comment.'),
            $isAttachmentOnly ? ['filename' => $comment->attachment_name] : []);

        // Notify + email other parties
        $targets = collect([$deed->created_by, $deed->assigned_to])
            ->filter(fn($id) => $id && $id !== $request->user()->id)->unique();
        foreach ($targets as $userId) {
            Notification::create([
                'user_id' => $userId,
                'type'    => 'comment_added',
                'data'    => ['deed_id' => $deed->id, 'deed_title' => $deed->title, 'actor_name' => $request->user()->name, 'message' => $msgText],
            ]);
            if ($recipient = User::find($userId)) {
                DeedMail::sendTo($recipient, 'New Comment: ' . $deed->title, $msgText, $deed);
            }
        }

        return new CommentResource($comment);
    }

    public function destroy(Request $request, Comment $comment) {
        if ($comment->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            abort(403);
        }
        if ($comment->attachment_path) {
            Storage::disk('r2')->delete($comment->attachment_path);
        }
        $comment->delete();
        return response()->json(['message' => 'Comment deleted']);
    }

    public function attachment(Request $request, Comment $comment) {
        $deed = $comment->deed;
        if (!$deed->canAccess($request->user())) { abort(403); }
        if (!$comment->attachment_path || !Storage::disk('r2')->exists($comment->attachment_path)) {
            abort(404);
        }
        return Storage::disk('r2')->download($comment->attachment_path, $comment->attachment_name);
    }
}
