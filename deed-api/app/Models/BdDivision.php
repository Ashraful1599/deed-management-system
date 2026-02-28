<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BdDivision extends Model
{
    public $timestamps = false;
    protected $fillable = ['id', 'name', 'bn_name'];

    public function districts()
    {
        return $this->hasMany(BdDistrict::class, 'division_id');
    }
}
