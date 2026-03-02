<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Dolil extends Model
{
    use HasFactory, SoftDeletes;

    const STATUSES = ['draft', 'under_review', 'completed', 'archived'];

    protected $table = 'dolils';

    protected $fillable = [
        'deed_number', 'title', 'description', 'created_by', 'assigned_to', 'status', 'notes',
        'agreement_amount', 'payment_status',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->orderBy('created_at');
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function reviews()
    {
        return $this->hasMany(DolilReview::class);
    }

    public function activities()
    {
        return $this->hasMany(DolilActivity::class);
    }

    public function payments()
    {
        return $this->hasMany(DolilPayment::class);
    }

    /**
     * Check if a user can access this dolil.
     */
    public function canAccess(User $user): bool
    {
        return $user->isAdmin()
            || $user->role === 'dolil_writer'
            || $this->created_by == $user->id
            || $this->assigned_to == $user->id;
    }

    /**
     * Check if a user can change the status.
     */
    public function canChangeStatus(User $user): bool
    {
        return $user->isAdmin()
            || $user->role === 'dolil_writer'
            || $this->assigned_to == $user->id
            || $this->created_by  == $user->id;
    }

    /**
     * Return the status values this user is allowed to transition to from the current status.
     */
    public function allowedTransitions(User $user): array
    {
        $map = [
            'draft'        => ['under_review'],
            'under_review' => ['completed', 'draft'],
            'completed'    => ['archived'],
            'archived'     => ['completed'],
        ];

        $all = $map[$this->status] ?? [];

        // Admin and dolil_writer can set any status
        if ($user->isAdmin() || $user->role === 'dolil_writer') {
            return array_values(array_diff(array_keys($map), [$this->status]));
        }

        // Creator (regular user) can submit draft for review
        if ($this->created_by === $user->id) {
            return array_values(array_intersect(['under_review'], $all));
        }

        return [];
    }
}
