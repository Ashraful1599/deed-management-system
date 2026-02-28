<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BdUpazila extends Model
{
    public $timestamps = false;
    protected $table = 'bd_upazilas';

    public function district()
    {
        return $this->belongsTo(BdDistrict::class, 'district_id');
    }

    public function unions()
    {
        return $this->hasMany(BdUnion::class, 'upazila_id');
    }
}
