<?php
namespace App\Http\Controllers;
use App\Http\Resources\DocumentResource;
use App\Models\Deed;
use App\Models\Document;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller {
    public function index(Request $request, Deed $deed) {
        if (!$deed->canAccess($request->user())) { abort(403); }
        return DocumentResource::collection($deed->documents()->orderByDesc('created_at')->get());
    }

    public function store(Request $request, Deed $deed) {
        if (!$deed->canAccess($request->user())) { abort(403); }
        $request->validate([
            'file'  => ['required', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:20480'],
            'label' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('file');
        $storedName = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('deeds/' . $deed->id, $storedName, 'public');

        $document = $deed->documents()->create([
            'uploaded_by'       => $request->user()->id,
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename'   => $storedName,
            'disk_path'         => $path,
            'file_size'         => $file->getSize(),
            'mime_type'         => $file->getMimeType(),
            'label'             => $request->label,
        ]);

        // Notify other party
        $targets = collect([$deed->created_by, $deed->assigned_to])
            ->filter(fn($id) => $id && $id !== $request->user()->id)->unique();
        foreach ($targets as $userId) {
            Notification::create([
                'user_id' => $userId,
                'type'    => 'document_uploaded',
                'data'    => [
                    'deed_id'    => $deed->id,
                    'deed_title' => $deed->title,
                    'actor_name' => $request->user()->name,
                    'message'    => $request->user()->name . ' uploaded a document on: ' . $deed->title,
                ],
            ]);
        }

        return new DocumentResource($document);
    }

    public function destroy(Request $request, Document $document) {
        $deed = $document->deed;
        if (!$deed->canAccess($request->user())) { abort(403); }
        Storage::disk('public')->delete($document->disk_path);
        $document->delete();
        return response()->json(['message' => 'Document deleted']);
    }

    public function download(Request $request, Document $document) {
        $deed = $document->deed;
        if (!$deed->canAccess($request->user())) { abort(403); }
        if (!Storage::disk('public')->exists($document->disk_path)) { abort(404); }
        return Storage::disk('public')->download($document->disk_path, $document->original_filename);
    }
}
