<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class CommentResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'              => $this->id,
            'dolil_id'        => $this->dolil_id,
            'user'            => new UserResource($this->whenLoaded('user')),
            'body'            => $this->body,
            'attachment_name' => $this->attachment_name,
            'attachment_mime' => $this->attachment_mime,
            'has_attachment'  => !is_null($this->attachment_path),
            'download_url'    => $this->attachment_path
                ? env('R2_PUBLIC_URL') . '/' . $this->attachment_path
                : null,
            'created_at'      => $this->created_at,
        ];
    }
}
