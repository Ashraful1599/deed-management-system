<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('deeds')->where('status', 'pending')->update(['status' => 'under_review']);
        DB::table('deeds')->where('status', 'recorded')->update(['status' => 'archived']);
    }

    public function down(): void
    {
        DB::table('deeds')->where('status', 'under_review')->update(['status' => 'pending']);
        DB::table('deeds')->where('status', 'archived')->update(['status' => 'recorded']);
    }
};
