<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Deed extends Model
{
    use HasFactory, SoftDeletes;

    const STATUSES = ['draft', 'under_review', 'completed', 'archived'];

    protected $fillable = [
        'deed_number', 'title', 'description', 'created_by', 'assigned_to', 'status', 'notes',
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
        return $this->hasMany(DeedReview::class);
    }

    public function activities()
    {
        return $this->hasMany(DeedActivity::class);
    }

    /**
     * Check if a user can access this deed.
     */
    public function canAccess(User $user): bool
    {
        return $user->isAdmin()
            || $this->created_by === $user->id
            || $this->assigned_to === $user->id;
    }

    /**
     * Check if a user can change the status.
     */
    public function canChangeStatus(User $user): bool
    {
        return $user->isAdmin()
            || $this->assigned_to === $user->id
            || $this->created_by  === $user->id;
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

        if ($user->isAdmin()) return $all;

        // Assigned deed writer can mark under_review → completed
        if ($this->assigned_to === $user->id) {
            return array_values(array_intersect(['completed'], $all));
        }

        // Creator can submit draft for review
        if ($this->created_by === $user->id) {
            return array_values(array_intersect(['under_review'], $all));
        }

        return [];
    }
}
