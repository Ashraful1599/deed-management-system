<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bd_divisions', function (Blueprint $table) {
            $table->tinyIncrements('id');
            $table->string('name', 50);
            $table->string('bn_name', 50)->default('');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bd_divisions');
    }
};
