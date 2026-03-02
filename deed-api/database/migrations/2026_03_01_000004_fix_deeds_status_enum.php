<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rename any leftover old values just in case
        DB::table('dolils')->where('status', 'pending')->update(['status' => 'under_review']);
        DB::table('dolils')->where('status', 'recorded')->update(['status' => 'archived']);

        DB::statement("ALTER TABLE dolils MODIFY COLUMN status ENUM('draft','under_review','completed','archived') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        DB::table('dolils')->where('status', 'under_review')->update(['status' => 'pending']);
        DB::table('dolils')->where('status', 'archived')->update(['status' => 'recorded']);

        DB::statement("ALTER TABLE dolils MODIFY COLUMN status ENUM('draft','pending','completed','recorded') NOT NULL DEFAULT 'draft'");
    }
};
