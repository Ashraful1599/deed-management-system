<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::firstOrCreate(
            ['email' => 'admin@deed.com'],
            [
                'name'     => 'Admin User',
                'phone'    => '0000000000',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
                'status'   => 'active',
            ]
        );

        // Sample User
        User::firstOrCreate(
            ['email' => 'user@deed.com'],
            [
                'name'     => 'John User',
                'phone'    => '1111111111',
                'password' => Hash::make('password123'),
                'role'     => 'user',
                'status'   => 'active',
            ]
        );

        // Sample Deed Writer
        User::firstOrCreate(
            ['email' => 'writer@deed.com'],
            [
                'name'                => 'Jane Writer',
                'phone'               => '2222222222',
                'password'            => Hash::make('password123'),
                'role'                => 'deed_writer',
                'status'              => 'active',
                'registration_number' => 'DW-2024-001',
                'office_name'         => 'City Law Office',
                'district'            => 'Downtown',
            ]
        );
    }
}
