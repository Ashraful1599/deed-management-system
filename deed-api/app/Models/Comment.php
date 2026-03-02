<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $fillable = [
        'dolil_id', 'user_id', 'body',
        'attachment_path', 'attachment_name', 'attachment_mime',
    ];

    public function dolil()
    {
        return $this->belongsTo(Dolil::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
