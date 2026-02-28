<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BdLocationsSeeder extends Seeder
{
    // Maps nuhil division_id (string) to [id, name, bn_name]
    private array $divisionMap = [
        '1' => ['id' => 1, 'name' => 'Chittagong',  'bn_name' => 'চট্টগ্রাম'],
        '2' => ['id' => 2, 'name' => 'Rajshahi',    'bn_name' => 'রাজশাহী'],
        '3' => ['id' => 3, 'name' => 'Khulna',      'bn_name' => 'খুলনা'],
        '4' => ['id' => 4, 'name' => 'Barisal',     'bn_name' => 'বরিশাল'],
        '5' => ['id' => 5, 'name' => 'Sylhet',      'bn_name' => 'সিলেট'],
        '6' => ['id' => 6, 'name' => 'Dhaka',       'bn_name' => 'ঢাকা'],
        '7' => ['id' => 7, 'name' => 'Rangpur',     'bn_name' => 'রংপুর'],
        '8' => ['id' => 8, 'name' => 'Mymensingh',  'bn_name' => 'ময়মনসিংহ'],
    ];

    public function run(): void
    {
        $dataPath  = database_path('data');
        $districts = $this->loadJson("{$dataPath}/bd_districts.json");
        $upazilas  = $this->loadJson("{$dataPath}/bd_upazilas.json");
        $unions    = $this->loadJson("{$dataPath}/bd_unions.json");

        if (!$districts || !$upazilas || !$unions) {
            $this->command->error('Could not load location JSON files from database/data/');
            return;
        }

        $cityThanas = $this->loadSimpleJson("{$dataPath}/bd_city_thanas.json") ?? [];

        $this->command->info('Seeding divisions, ' . count($districts) . ' districts, ' . count($upazilas) . ' upazilas + ' . count($cityThanas) . ' city thanas, ' . count($unions) . ' unions...');

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Null out user location FKs to avoid constraint violations on truncate
        DB::table('users')->update(['district_id' => null, 'upazila_id' => null, 'union_id' => null, 'division_id' => null]);

        DB::table('bd_unions')->truncate();
        DB::table('bd_upazilas')->truncate();
        DB::table('bd_districts')->truncate();
        DB::table('bd_divisions')->truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // Divisions
        $divisionRows = array_map(fn($d) => [
            'id'      => $d['id'],
            'name'    => $d['name'],
            'bn_name' => $d['bn_name'],
        ], array_values($this->divisionMap));
        DB::table('bd_divisions')->insert($divisionRows);

        // Districts (with division_id FK)
        $rows = array_map(fn($d) => [
            'id'          => (int) $d['id'],
            'division_id' => (int) $d['division_id'],
            'division'    => $this->divisionMap[$d['division_id']]['name'] ?? 'Unknown',
            'name'        => $d['name'],
            'bn_name'     => $d['bn_name'] ?? '',
        ], $districts);
        foreach (array_chunk($rows, 64) as $chunk) {
            DB::table('bd_districts')->insert($chunk);
        }

        // Upazilas (rural)
        $rows = array_map(fn($u) => [
            'id'          => (int) $u['id'],
            'district_id' => (int) $u['district_id'],
            'name'        => $u['name'],
            'bn_name'     => $u['bn_name'] ?? '',
        ], $upazilas);
        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('bd_upazilas')->insert($chunk);
        }

        // City corporation thanas (IDs 500+)
        if (!empty($cityThanas)) {
            $rows = array_map(fn($t) => [
                'id'          => (int) $t['id'],
                'district_id' => (int) $t['district_id'],
                'name'        => $t['name'],
                'bn_name'     => $t['bn_name'] ?? '',
            ], $cityThanas);
            foreach (array_chunk($rows, 100) as $chunk) {
                DB::table('bd_upazilas')->insert($chunk);
            }
        }

        // Unions (source field: upazilla_id with double-l)
        $rows = array_map(fn($u) => [
            'id'         => (int) $u['id'],
            'upazila_id' => (int) $u['upazilla_id'],
            'name'       => $u['name'],
            'bn_name'    => $u['bn_name'] ?? '',
        ], $unions);
        foreach (array_chunk($rows, 300) as $chunk) {
            DB::table('bd_unions')->insert($chunk);
        }

        // Restore demo writer: Dhaka division (6), Dhaka district (47), Dhanmondi thana (507)
        DB::table('users')->where('email', 'writer@deed.com')->update([
            'division_id' => 6,
            'district_id' => 47,
            'upazila_id'  => 507,
            'union_id'    => null,
        ]);

        $this->command->info('Done! Divisions: ' . DB::table('bd_divisions')->count()
            . ', Districts: ' . DB::table('bd_districts')->count()
            . ', Upazilas: ' . DB::table('bd_upazilas')->count()
            . ', Unions: ' . DB::table('bd_unions')->count());
    }

    /** Load a PHPMyAdmin-export JSON file (wraps data in {type:"table", data:[...]}) */
    private function loadJson(string $path): ?array
    {
        if (!file_exists($path)) return null;
        $raw = json_decode(file_get_contents($path), true);
        if (!is_array($raw)) return null;
        foreach ($raw as $entry) {
            if (isset($entry['type'], $entry['data']) && $entry['type'] === 'table') {
                return $entry['data'];
            }
        }
        return null;
    }

    /** Load a plain JSON array file */
    private function loadSimpleJson(string $path): ?array
    {
        if (!file_exists($path)) return null;
        $raw = json_decode(file_get_contents($path), true);
        return is_array($raw) ? $raw : null;
    }
}
