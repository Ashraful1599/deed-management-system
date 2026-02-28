<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bd_districts', function (Blueprint $table) {
            $table->smallIncrements('id');
            $table->string('division', 50);
            $table->string('name', 100);
            $table->string('bn_name', 100)->default('');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bd_districts');
    }
};
