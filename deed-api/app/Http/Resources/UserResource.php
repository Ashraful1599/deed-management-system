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
            'division_id'         => $this->division_id,
            'division_name'       => $this->divisionRel?->name,
            'district_id'         => $this->district_id,
            'upazila_id'          => $this->upazila_id,
            'district_name'       => $this->districtRel?->name,
            'upazila_name'        => $this->upazila?->name,
            'avatar'              => $this->avatar,
            'phone_verified_at'   => $this->phone_verified_at,
            'created_at'          => $this->created_at,
            'reviews_avg_rating'  => $this->whenNotNull($this->received_reviews_avg_rating),
            'reviews_count'       => $this->whenNotNull($this->received_reviews_count),
            'referral_code'       => $this->referral_code,
            'credits'             => $this->credits ?? 0,
        ];
    }
}
