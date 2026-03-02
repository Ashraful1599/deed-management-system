<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DolilReview extends Model
{
    use HasFactory;

    protected $table = 'dolil_reviews';

    protected $fillable = ['dolil_id', 'reviewer_id', 'rating', 'body'];

    public function dolil()
    {
        return $this->belongsTo(Dolil::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
