<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeedActivity extends Model
{
    protected $fillable = ['deed_id', 'user_id', 'action', 'description', 'meta'];

    protected $casts = ['meta' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function deed()
    {
        return $this->belongsTo(Deed::class);
    }

    public static function log(int $deedId, ?int $userId, string $action, string $description, array $meta = []): void
    {
        self::create([
            'deed_id'     => $deedId,
            'user_id'     => $userId,
            'action'      => $action,
            'description' => $description,
            'meta'        => empty($meta) ? null : $meta,
        ]);
    }
}
