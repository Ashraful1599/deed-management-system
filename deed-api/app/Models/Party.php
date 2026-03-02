<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Party extends Model
{
    use HasFactory;

    protected $fillable = [
        'type', 'name', 'email', 'phone', 'address',
        'city', 'state', 'zip_code', 'notes',
    ];

    public function dolils()
    {
        return $this->belongsToMany(Dolil::class, 'dolil_party')
            ->withPivot('role', 'sort_order');
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where('name', 'like', "%{$term}%")
            ->orWhere('email', 'like', "%{$term}%");
    }
}
