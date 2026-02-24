<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old deed-related tables that are no longer needed
        Schema::dropIfExists('documents');
        Schema::dropIfExists('deed_party');
        Schema::dropIfExists('deeds');
        Schema::dropIfExists('parties');
        Schema::dropIfExists('properties');

        // New deeds table
        Schema::create('deeds', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['draft', 'pending', 'completed', 'recorded'])->default('draft');
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('created_by');
            $table->index('assigned_to');
            $table->index('status');
        });

        // Documents linked to new deeds
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deed_id')->constrained('deeds')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->string('original_filename');
            $table->string('stored_filename');
            $table->string('disk_path');
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('mime_type')->nullable();
            $table->string('label')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
        Schema::dropIfExists('deeds');
    }
};
