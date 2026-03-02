<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dolil_party', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dolil_id')->constrained('dolils')->cascadeOnDelete();
            $table->foreignId('party_id')->constrained('parties')->cascadeOnDelete();
            $table->enum('role', ['grantor', 'grantee']);
            $table->tinyInteger('sort_order')->default(0);

            $table->unique(['dolil_id', 'party_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dolil_party');
    }
};
