<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'deed_id', 'uploaded_by', 'original_filename',
        'stored_filename', 'disk_path', 'file_size', 'mime_type', 'label',
    ];

    public function deed()
    {
        return $this->belongsTo(Deed::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
