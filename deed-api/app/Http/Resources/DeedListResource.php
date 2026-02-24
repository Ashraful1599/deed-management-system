<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class DeedListResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'                   => $this->id,
            'property_id'          => $this->property_id,
            'property'             => new PropertyResource($this->whenLoaded('property')),
            'deed_type'            => $this->deed_type,
            'status'               => $this->status,
            'effective_date'       => $this->effective_date,
            'recording_date'       => $this->recording_date,
            'consideration_amount' => $this->consideration_amount,
            'instrument_number'    => $this->instrument_number,
            'county_recorded'      => $this->county_recorded,
            'grantors'             => PartyResource::collection($this->whenLoaded('grantors')),
            'grantees'             => PartyResource::collection($this->whenLoaded('grantees')),
            'documents_count'      => $this->whenCounted('documents'),
            'created_at'           => $this->created_at,
            'updated_at'           => $this->updated_at,
        ];
    }
}
