<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('address_type', 50)->nullable()->after('division_id');
            $table->string('bd_union_id', 20)->nullable()->after('address_type');
            $table->string('bd_municipality_id', 20)->nullable()->after('bd_union_id');
            $table->string('bd_city_corporation_id', 20)->nullable()->after('bd_municipality_id');
            $table->string('bd_post_office_id', 20)->nullable()->after('bd_city_corporation_id');
            $table->string('bd_ward', 10)->nullable()->after('bd_post_office_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'address_type', 'bd_union_id', 'bd_municipality_id',
                'bd_city_corporation_id', 'bd_post_office_id', 'bd_ward',
            ]);
        });
    }
};
