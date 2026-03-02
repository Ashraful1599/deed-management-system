<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class DocumentResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'                => $this->id,
            'dolil_id'          => $this->dolil_id,
            'original_filename' => $this->original_filename,
            'file_size'         => $this->file_size,
            'mime_type'         => $this->mime_type,
            'label'             => $this->label,
            'uploaded_by'       => $this->uploaded_by,
            'download_url'      => env('R2_PUBLIC_URL') . '/' . $this->disk_path,
            'created_at'        => $this->created_at,
        ];
    }
}
