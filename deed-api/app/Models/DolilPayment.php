<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DolilPayment extends Model
{
    protected $table = 'dolil_payments';

    protected $fillable = ['dolil_id', 'recorded_by', 'amount', 'paid_at', 'notes'];

    protected $casts = [
        'amount'  => 'decimal:2',
        'paid_at' => 'date',
    ];

    public function dolil()
    {
        return $this->belongsTo(Dolil::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
