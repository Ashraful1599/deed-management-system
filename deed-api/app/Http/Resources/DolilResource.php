<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class DolilResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'          => $this->id,
            'deed_number' => $this->deed_number,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'notes'       => $this->notes,
            'created_by'  => new UserResource($this->whenLoaded('creator')),
            'assigned_to' => new UserResource($this->whenLoaded('assignee')),
            'documents'   => DocumentResource::collection($this->whenLoaded('documents')),
            'comments_count'     => $this->whenCounted('comments'),
            'documents_count'    => $this->whenCounted('documents'),
            'reviews_count'      => $this->whenCounted('reviews'),
            'reviews_avg_rating' => $this->reviews_avg_rating !== null ? round((float) $this->reviews_avg_rating, 1) : null,
            'agreement_amount' => $this->agreement_amount,
            'payment_status'   => $this->payment_status,
            'amount_paid'      => $this->payments_sum_amount !== null ? (float) $this->payments_sum_amount : null,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
