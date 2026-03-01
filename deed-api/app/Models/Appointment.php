<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'deed_writer_id',
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

    public function deedWriter()
    {
        return $this->belongsTo(User::class, 'deed_writer_id');
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }
}
