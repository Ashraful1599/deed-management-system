<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deeds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->enum('deed_type', [
                'warranty', 'quitclaim', 'grant', 'trust',
                'sheriffs', 'executors', 'special_warranty', 'bargain_and_sale'
            ]);
            $table->enum('status', ['draft', 'pending', 'recorded'])->default('draft');
            $table->date('effective_date')->nullable();
            $table->date('recording_date')->nullable();
            $table->decimal('consideration_amount', 15, 2)->nullable();
            $table->text('legal_description')->nullable();
            $table->string('instrument_number')->nullable()->index();
            $table->string('book')->nullable();
            $table->string('page')->nullable();
            $table->string('county_recorded')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->softDeletes();
            $table->timestamps();

            $table->index(['property_id', 'recording_date']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deeds');
    }
};
