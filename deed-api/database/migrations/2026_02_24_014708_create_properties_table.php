<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('parcel_number')->unique();
            $table->string('address');
            $table->string('city');
            $table->string('state', 2);
            $table->string('county')->nullable();
            $table->string('zip_code', 10)->nullable();
            $table->text('legal_description')->nullable();
            $table->decimal('acreage', 12, 4)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
