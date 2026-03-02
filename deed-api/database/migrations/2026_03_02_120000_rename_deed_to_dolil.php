<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::rename('deeds', 'dolils');
        Schema::rename('deed_activities', 'dolil_activities');
        Schema::rename('deed_payments', 'dolil_payments');
        Schema::rename('deed_reviews', 'dolil_reviews');

        // Rename deed_id foreign key columns
        if (Schema::hasColumn('dolil_activities', 'deed_id')) {
            Schema::table('dolil_activities', function ($table) {
                $table->renameColumn('deed_id', 'dolil_id');
            });
        }
        if (Schema::hasColumn('dolil_payments', 'deed_id')) {
            Schema::table('dolil_payments', function ($table) {
                $table->renameColumn('deed_id', 'dolil_id');
            });
        }
        if (Schema::hasColumn('dolil_reviews', 'deed_id')) {
            Schema::table('dolil_reviews', function ($table) {
                $table->renameColumn('deed_id', 'dolil_id');
            });
        }

        // Update role enum value
        DB::statement("UPDATE users SET role = 'dolil_writer' WHERE role = 'deed_writer'");

        // Update activity action values
        DB::statement("UPDATE dolil_activities SET action = 'dolil_created' WHERE action = 'deed_created'");
        DB::statement("UPDATE dolil_activities SET action = 'dolil_assigned' WHERE action = 'deed_assigned'");
    }

    public function down(): void
    {
        Schema::rename('dolils', 'deeds');
        Schema::rename('dolil_activities', 'deed_activities');
        Schema::rename('dolil_payments', 'deed_payments');
        Schema::rename('dolil_reviews', 'deed_reviews');
        DB::statement("UPDATE users SET role = 'deed_writer' WHERE role = 'dolil_writer'");
    }
};
