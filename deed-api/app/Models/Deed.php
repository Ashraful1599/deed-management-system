<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Deed extends Model
{
    use HasFactory, SoftDeletes;

    const STATUSES = ['draft', 'pending', 'completed', 'recorded'];

    protected $fillable = [
        'title', 'description', 'created_by', 'assigned_to', 'status', 'notes',
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
        return $user->isAdmin() || $this->assigned_to === $user->id;
    }
}
