<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'client_name'    => $this->client_name,
            'client_phone'   => $this->client_phone,
            'client_email'   => $this->client_email,
            'preferred_date' => $this->preferred_date?->format('Y-m-d'),
            'message'        => $this->message,
            'status'         => $this->status,
            'created_at'     => $this->created_at,
            'dolil_writer'    => $this->whenLoaded('dolilWriter', fn () => [
                'id'   => $this->dolilWriter->id,
                'name' => $this->dolilWriter->name,
            ]),
            'client'         => $this->whenLoaded('client', fn () => $this->client ? [
                'id'   => $this->client->id,
                'name' => $this->client->name,
            ] : null),
        ];
    }
}
