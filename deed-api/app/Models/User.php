<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name', 'email', 'phone', 'password',
        'role', 'status',
        'registration_number', 'office_name', 'district', 'avatar',
        'district_id', 'upazila_id', 'union_id', 'division_id',
        'phone_verified_at', 'referral_code', 'credits', 'referred_by',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($user) {
            do {
                $code = strtoupper(\Illuminate\Support\Str::random(8));
            } while (static::where('referral_code', $code)->exists());
            $user->referral_code = $code;
        });
    }

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // Location relationships
    public function divisionRel()
    {
        return $this->belongsTo(BdDivision::class, 'division_id');
    }

    public function districtRel()
    {
        return $this->belongsTo(BdDistrict::class, 'district_id');
    }

    public function upazila()
    {
        return $this->belongsTo(BdUpazila::class, 'upazila_id');
    }

    public function union()
    {
        return $this->belongsTo(BdUnion::class, 'union_id');
    }

    // Reviews received (as dolil writer) — through dolils assigned to this user
    public function receivedReviews()
    {
        return $this->hasManyThrough(DolilReview::class, Dolil::class, 'assigned_to', 'dolil_id');
    }

    // Relationships
    public function dolilsCreated()
    {
        return $this->hasMany(Dolil::class, 'created_by');
    }

    public function dolilsAssigned()
    {
        return $this->hasMany(Dolil::class, 'assigned_to');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class)->orderByDesc('created_at');
    }

    // Referral relationships
    public function referrals()
    {
        return $this->hasMany(Referral::class, 'referrer_id');
    }

    public function referredBy()
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    // Helpers
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isDolilWriter(): bool
    {
        return $this->role === 'dolil_writer';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
