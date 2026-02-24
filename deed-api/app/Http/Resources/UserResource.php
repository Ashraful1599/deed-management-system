<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'name'                => $this->name,
            'email'               => $this->email,
            'phone'               => $this->phone,
            'role'                => $this->role,
            'status'              => $this->status,
            'registration_number' => $this->registration_number,
            'office_name'         => $this->office_name,
            'district'            => $this->district,
            'avatar'              => $this->avatar,
            'created_at'          => $this->created_at,
        ];
    }
}
