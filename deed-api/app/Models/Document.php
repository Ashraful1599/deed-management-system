<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'dolil_id', 'uploaded_by', 'original_filename',
        'stored_filename', 'disk_path', 'file_size', 'mime_type', 'label',
    ];

    public function dolil()
    {
        return $this->belongsTo(Dolil::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
