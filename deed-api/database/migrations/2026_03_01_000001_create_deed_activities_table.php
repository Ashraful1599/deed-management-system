<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('dolil_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dolil_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');        // dolil_created, status_changed, dolil_assigned, comment_added, etc.
            $table->string('description');   // Human-readable sentence
            $table->json('meta')->nullable(); // Extra context (old/new status, filename, etc.)
            $table->timestamps();

            $table->index(['dolil_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dolil_activities');
    }
};
