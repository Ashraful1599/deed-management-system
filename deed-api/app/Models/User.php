<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name', 'email', 'phone', 'password',
        'role', 'status',
        'registration_number', 'office_name', 'district', 'avatar',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // Relationships
    public function deedsCreated()
    {
        return $this->hasMany(Deed::class, 'created_by');
    }

    public function deedsAssigned()
    {
        return $this->hasMany(Deed::class, 'assigned_to');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class)->orderByDesc('created_at');
    }

    // Helpers
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isDeedWriter(): bool
    {
        return $this->role === 'deed_writer';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
