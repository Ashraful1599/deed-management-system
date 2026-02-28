<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bd_upazilas', function (Blueprint $table) {
            $table->smallIncrements('id');
            $table->unsignedSmallInteger('district_id');
            $table->string('name', 100);
            $table->string('bn_name', 100)->default('');
            $table->foreign('district_id')->references('id')->on('bd_districts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bd_upazilas');
    }
};
