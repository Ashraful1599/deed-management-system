<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->unique()->after('email');
            $table->enum('role', ['user', 'deed_writer', 'admin'])->default('user')->after('phone');
            $table->enum('status', ['active', 'pending', 'suspended'])->default('active')->after('role');
            // Deed Writer professional fields
            $table->string('registration_number')->nullable()->after('status');
            $table->string('office_name')->nullable()->after('registration_number');
            $table->string('district')->nullable()->after('office_name');
            $table->string('avatar')->nullable()->after('district');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone', 'role', 'status',
                'registration_number', 'office_name', 'district', 'avatar',
            ]);
        });
    }
};
