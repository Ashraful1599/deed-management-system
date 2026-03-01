<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('deeds', function (Blueprint $table) {
            $table->decimal('agreement_amount', 12, 2)->nullable()->after('notes');
            $table->enum('payment_status', ['pending', 'partial', 'completed', 'overdue'])->default('pending')->after('agreement_amount');
        });
    }

    public function down(): void
    {
        Schema::table('deeds', function (Blueprint $table) {
            $table->dropColumn(['agreement_amount', 'payment_status']);
        });
    }
};
