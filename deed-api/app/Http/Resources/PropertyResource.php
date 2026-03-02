<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class PropertyResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'                => $this->id,
            'parcel_number'     => $this->parcel_number,
            'address'           => $this->address,
            'city'              => $this->city,
            'state'             => $this->state,
            'county'            => $this->county,
            'zip_code'          => $this->zip_code,
            'legal_description' => $this->legal_description,
            'acreage'           => $this->acreage,
            'notes'             => $this->notes,
            'created_by'        => $this->created_by,
            'dolils_count'      => $this->whenCounted('dolils'),
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,
        ];
    }
}
