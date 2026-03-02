<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('dolils')->where('status', 'pending')->update(['status' => 'under_review']);
        DB::table('dolils')->where('status', 'recorded')->update(['status' => 'archived']);
    }

    public function down(): void
    {
        DB::table('dolils')->where('status', 'under_review')->update(['status' => 'pending']);
        DB::table('dolils')->where('status', 'archived')->update(['status' => 'recorded']);
    }
};
