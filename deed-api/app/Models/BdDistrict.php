<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BdDistrict extends Model
{
    public $timestamps = false;
    protected $table = 'bd_districts';

    public function division()
    {
        return $this->belongsTo(BdDivision::class, 'division_id');
    }

    public function upazilas()
    {
        return $this->hasMany(BdUpazila::class, 'district_id');
    }
}
