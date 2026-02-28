<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BdUnion extends Model
{
    public $timestamps = false;
    protected $table = 'bd_unions';

    public function upazila()
    {
        return $this->belongsTo(BdUpazila::class, 'upazila_id');
    }
}
