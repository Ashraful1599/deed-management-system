<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('deed_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deed_id')->constrained('deeds')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users');
            $table->tinyInteger('rating');
            $table->text('body')->nullable();
            $table->timestamps();
            $table->unique(['deed_id', 'reviewer_id']);
            $table->index('deed_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deed_reviews');
    }
};
