<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Property extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'parcel_number', 'address', 'city', 'state', 'county',
        'zip_code', 'legal_description', 'acreage', 'notes', 'created_by',
    ];

    protected $casts = [
        'acreage' => 'decimal:4',
    ];

    public function dolils()
    {
        return $this->hasMany(Dolil::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
