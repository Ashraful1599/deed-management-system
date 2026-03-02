<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DolilPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'amount'      => $this->amount,
            'paid_at'     => $this->paid_at?->toDateString(),
            'notes'       => $this->notes,
            'recorded_by' => $this->recorder ? ['id' => $this->recorder->id, 'name' => $this->recorder->name] : null,
            'created_at'  => $this->created_at,
        ];
    }
}
