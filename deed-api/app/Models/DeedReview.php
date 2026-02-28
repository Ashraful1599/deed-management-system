<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeedReview extends Model
{
    use HasFactory;

    protected $fillable = ['deed_id', 'reviewer_id', 'rating', 'body'];

    public function deed()
    {
        return $this->belongsTo(Deed::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
