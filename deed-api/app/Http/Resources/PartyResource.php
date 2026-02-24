<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class PartyResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'       => $this->id,
            'type'     => $this->type,
            'name'     => $this->name,
            'email'    => $this->email,
            'phone'    => $this->phone,
            'address'  => $this->address,
            'city'     => $this->city,
            'state'    => $this->state,
            'zip_code' => $this->zip_code,
            'notes'    => $this->notes,
            'role'     => $this->whenPivotLoaded('deed_party', fn() => $this->pivot->role),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
