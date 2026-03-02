<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DolilReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'dolil_id'   => $this->dolil_id,
            'reviewer'   => new UserResource($this->whenLoaded('reviewer')),
            'rating'     => $this->rating,
            'body'       => $this->body,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
