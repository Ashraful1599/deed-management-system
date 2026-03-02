<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DolilActivity extends Model
{
    protected $table = 'dolil_activities';

    protected $fillable = ['dolil_id', 'user_id', 'action', 'description', 'meta'];

    protected $casts = ['meta' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function dolil()
    {
        return $this->belongsTo(Dolil::class);
    }

    public static function log(int $dolilId, ?int $userId, string $action, string $description, array $meta = []): void
    {
        self::create([
            'dolil_id'    => $dolilId,
            'user_id'     => $userId,
            'action'      => $action,
            'description' => $description,
            'meta'        => empty($meta) ? null : $meta,
        ]);
    }
}
