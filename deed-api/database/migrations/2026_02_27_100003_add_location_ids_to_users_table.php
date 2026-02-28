<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('district_id')->nullable()->after('district');
            $table->unsignedSmallInteger('upazila_id')->nullable()->after('district_id');
            $table->unsignedSmallInteger('union_id')->nullable()->after('upazila_id');
            $table->foreign('district_id')->references('id')->on('bd_districts')->nullOnDelete();
            $table->foreign('upazila_id')->references('id')->on('bd_upazilas')->nullOnDelete();
            $table->foreign('union_id')->references('id')->on('bd_unions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['district_id']);
            $table->dropForeign(['upazila_id']);
            $table->dropForeign(['union_id']);
            $table->dropColumn(['district_id', 'upazila_id', 'union_id']);
        });
    }
};
