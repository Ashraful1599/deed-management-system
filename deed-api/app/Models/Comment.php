<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $fillable = [
        'deed_id', 'user_id', 'body',
        'attachment_path', 'attachment_name', 'attachment_mime',
    ];

    public function deed()
    {
        return $this->belongsTo(Deed::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
