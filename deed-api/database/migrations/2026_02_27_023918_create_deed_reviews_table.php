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
        Schema::create('dolil_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dolil_id')->constrained('dolils')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users');
            $table->tinyInteger('rating');
            $table->text('body')->nullable();
            $table->timestamps();
            $table->unique(['dolil_id', 'reviewer_id']);
            $table->index('dolil_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dolil_reviews');
    }
};
