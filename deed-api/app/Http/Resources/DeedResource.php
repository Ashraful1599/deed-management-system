<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class DeedResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'notes'       => $this->notes,
            'created_by'  => new UserResource($this->whenLoaded('creator')),
            'assigned_to' => new UserResource($this->whenLoaded('assignee')),
            'documents'   => DocumentResource::collection($this->whenLoaded('documents')),
            'comments_count' => $this->whenCounted('comments'),
            'documents_count'=> $this->whenCounted('documents'),
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
