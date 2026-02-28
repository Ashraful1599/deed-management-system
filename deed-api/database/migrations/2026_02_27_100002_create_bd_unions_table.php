<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bd_unions', function (Blueprint $table) {
            $table->unsignedSmallInteger('id');
            $table->primary('id');
            $table->unsignedSmallInteger('upazila_id');
            $table->string('name', 100);
            $table->string('bn_name', 100)->default('');
            $table->foreign('upazila_id')->references('id')->on('bd_upazilas')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bd_unions');
    }
};
