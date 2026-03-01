<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeedPayment extends Model
{
    protected $fillable = ['deed_id', 'recorded_by', 'amount', 'paid_at', 'notes'];

    protected $casts = [
        'amount'  => 'decimal:2',
        'paid_at' => 'date',
    ];

    public function deed()
    {
        return $this->belongsTo(Deed::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
