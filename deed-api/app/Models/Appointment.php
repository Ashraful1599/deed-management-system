<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'dolil_writer_id',
        'client_id',
        'client_name',
        'client_phone',
        'client_email',
        'preferred_date',
        'message',
        'status',
    ];

    protected $casts = [
        'preferred_date' => 'date',
    ];

    public function dolilWriter()
    {
        return $this->belongsTo(User::class, 'dolil_writer_id');
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }
}
