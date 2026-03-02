<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Rename tables (skip if already renamed)
        if (Schema::hasTable('deeds') && !Schema::hasTable('dolils')) {
            Schema::rename('deeds', 'dolils');
        }
        if (Schema::hasTable('deed_activities') && !Schema::hasTable('dolil_activities')) {
            Schema::rename('deed_activities', 'dolil_activities');
        }
        if (Schema::hasTable('deed_payments') && !Schema::hasTable('dolil_payments')) {
            Schema::rename('deed_payments', 'dolil_payments');
        }
        if (Schema::hasTable('deed_reviews') && !Schema::hasTable('dolil_reviews')) {
            Schema::rename('deed_reviews', 'dolil_reviews');
        }

        // Rename deed_id foreign key columns (skip if already renamed)
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

        // Expand ENUM to allow both values, update data, then remove old value
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user','deed_writer','dolil_writer','admin') DEFAULT 'user'");
        DB::statement("UPDATE users SET role = 'dolil_writer' WHERE role = 'deed_writer'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user','dolil_writer','admin') DEFAULT 'user'");

        // Update activity action values
        DB::statement("UPDATE dolil_activities SET action = 'dolil_created' WHERE action = 'deed_created'");
        DB::statement("UPDATE dolil_activities SET action = 'dolil_assigned' WHERE action = 'deed_assigned'");
    }

    public function down(): void
    {
        if (Schema::hasTable('dolils') && !Schema::hasTable('deeds')) {
            Schema::rename('dolils', 'deeds');
        }
        if (Schema::hasTable('dolil_activities') && !Schema::hasTable('deed_activities')) {
            Schema::rename('dolil_activities', 'deed_activities');
        }
        if (Schema::hasTable('dolil_payments') && !Schema::hasTable('deed_payments')) {
            Schema::rename('dolil_payments', 'deed_payments');
        }
        if (Schema::hasTable('dolil_reviews') && !Schema::hasTable('deed_reviews')) {
            Schema::rename('dolil_reviews', 'deed_reviews');
        }
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user','deed_writer','dolil_writer','admin') DEFAULT 'user'");
        DB::statement("UPDATE users SET role = 'deed_writer' WHERE role = 'dolil_writer'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user','deed_writer','admin') DEFAULT 'user'");
    }
};
