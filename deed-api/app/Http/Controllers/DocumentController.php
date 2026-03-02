<?php
namespace App\Http\Controllers;
use App\Http\Resources\DocumentResource;
use App\Mail\DolilMail;
use App\Models\Dolil;
use App\Models\DolilActivity;
use App\Models\Document;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller {
    public function index(Request $request, Dolil $dolil) {
        if (!$dolil->canAccess($request->user())) { abort(403); }
        return DocumentResource::collection($dolil->documents()->orderByDesc('created_at')->get());
    }

    public function store(Request $request, Dolil $dolil) {
        if (!$dolil->canAccess($request->user())) { abort(403); }
        $request->validate([
            'file'  => ['required', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:20480'],
            'label' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('file');
        $storedName = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('dolils/' . $dolil->id, $storedName, 'r2');

        $document = $dolil->documents()->create([
            'uploaded_by'       => $request->user()->id,
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename'   => $storedName,
            'disk_path'         => $path,
            'file_size'         => $file->getSize(),
            'mime_type'         => $file->getMimeType(),
            'label'             => $request->label,
        ]);

        $msgText = $request->user()->name . ' uploaded a document on: ' . $dolil->title;

        // Activity log
        DolilActivity::log($dolil->id, $request->user()->id, 'document_uploaded',
            $request->user()->name . ' uploaded "' . $document->original_filename . '".',
            ['filename' => $document->original_filename, 'size' => $document->file_size]);

        // Notify + email other parties
        $targets = collect([$dolil->created_by, $dolil->assigned_to])
            ->filter(fn($id) => $id && $id !== $request->user()->id)->unique();
        foreach ($targets as $userId) {
            Notification::create([
                'user_id' => $userId,
                'type'    => 'document_uploaded',
                'data'    => ['dolil_id' => $dolil->id, 'dolil_title' => $dolil->title, 'actor_name' => $request->user()->name, 'message' => $msgText],
            ]);
            if ($recipient = User::find($userId)) {
                DolilMail::sendTo($recipient, 'Document Uploaded: ' . $dolil->title, $msgText, $dolil);
            }
        }

        return new DocumentResource($document);
    }

    public function destroy(Request $request, Document $document) {
        $dolil = $document->dolil;
        if (!$dolil->canAccess($request->user())) { abort(403); }
        $filename = $document->original_filename;
        Storage::disk('r2')->delete($document->disk_path);
        $document->delete();
        DolilActivity::log($dolil->id, $request->user()->id, 'document_deleted',
            $request->user()->name . ' deleted "' . $filename . '".',
            ['filename' => $filename]);
        return response()->json(['message' => 'Document deleted']);
    }

    public function download(Request $request, Document $document) {
        $dolil = $document->dolil;
        if (!$dolil->canAccess($request->user())) { abort(403); }
        if (!Storage::disk('r2')->exists($document->disk_path)) { abort(404); }
        return Storage::disk('r2')->download($document->disk_path, $document->original_filename);
    }
}
