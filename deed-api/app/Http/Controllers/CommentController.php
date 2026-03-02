<?php
namespace App\Http\Controllers;
use App\Http\Resources\CommentResource;
use App\Mail\DolilMail;
use App\Models\Comment;
use App\Models\Dolil;
use App\Models\DolilActivity;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CommentController extends Controller {
    public function index(Request $request, Dolil $dolil) {
        if (!$dolil->canAccess($request->user())) { abort(403); }
        $comments = $dolil->comments()->with('user')->get();
        return CommentResource::collection($comments);
    }

    public function store(Request $request, Dolil $dolil) {
        if (!$dolil->canAccess($request->user())) { abort(403); }
        $data = $request->validate([
            'body'       => ['nullable', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:20480'],
        ]);

        // Must have at least a body or an attachment
        if (empty($data['body']) && !$request->hasFile('attachment')) {
            return response()->json(['message' => 'A comment body or attachment is required.'], 422);
        }

        $comment = new Comment([
            'dolil_id' => $dolil->id,
            'user_id'  => $request->user()->id,
            'body'     => $data['body'],
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $stored = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('comments/' . $dolil->id, $stored, 'r2');
            $comment->attachment_path = $path;
            $comment->attachment_name = $file->getClientOriginalName();
            $comment->attachment_mime = $file->getMimeType();
        }

        $comment->save();
        $comment->load('user');

        $isAttachmentOnly = $comment->attachment_path && empty($data['body']);
        $msgText = $request->user()->name . ($isAttachmentOnly ? ' attached a file on: ' : ' commented on: ') . $dolil->title;

        // Activity log
        DolilActivity::log($dolil->id, $request->user()->id,
            $isAttachmentOnly ? 'file_attached' : 'comment_added',
            $request->user()->name . ($isAttachmentOnly ? ' attached a file.' : ' added a comment.'),
            $isAttachmentOnly ? ['filename' => $comment->attachment_name] : []);

        // Notify + email other parties
        $targets = collect([$dolil->created_by, $dolil->assigned_to])
            ->filter(fn($id) => $id && $id !== $request->user()->id)->unique();
        foreach ($targets as $userId) {
            Notification::create([
                'user_id' => $userId,
                'type'    => 'comment_added',
                'data'    => ['dolil_id' => $dolil->id, 'dolil_title' => $dolil->title, 'actor_name' => $request->user()->name, 'message' => $msgText],
            ]);
            if ($recipient = User::find($userId)) {
                DolilMail::sendTo($recipient, 'New Comment: ' . $dolil->title, $msgText, $dolil);
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
        $dolil = $comment->dolil;
        if (!$dolil->canAccess($request->user())) { abort(403); }
        if (!$comment->attachment_path || !Storage::disk('r2')->exists($comment->attachment_path)) {
            abort(404);
        }
        return Storage::disk('r2')->download($comment->attachment_path, $comment->attachment_name);
    }
}
