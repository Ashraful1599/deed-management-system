<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $verified = now();

        // Admin
        User::updateOrCreate(
            ['email' => 'admin@deed.com'],
            [
                'name'              => 'Admin User',
                'phone'             => '0000000000',
                'password'          => Hash::make('12345678'),
                'role'              => 'admin',
                'status'            => 'active',
                'email_verified_at' => $verified,
            ]
        );

        // Sample User
        User::updateOrCreate(
            ['email' => 'user@deed.com'],
            [
                'name'              => 'John User',
                'phone'             => '1111111111',
                'password'          => Hash::make('12345678'),
                'role'              => 'user',
                'status'            => 'active',
                'email_verified_at' => $verified,
            ]
        );

        // Sample Deed Writer — district_id=18 (Dhaka), upazila_id=149 (Savar), union_id=13 (Savar Union)
        User::updateOrCreate(
            ['email' => 'writer@deed.com'],
            [
                'name'                => 'Jane Writer',
                'phone'               => '2222222222',
                'password'            => Hash::make('12345678'),
                'role'                => 'deed_writer',
                'status'              => 'active',
                'email_verified_at'   => $verified,
                'registration_number' => 'DW-2024-001',
                'office_name'         => 'City Law Office',
                'district'            => 'Dhaka',
                'district_id'         => 18,
                'upazila_id'          => 149,
                'union_id'            => 13,
            ]
        );
    }
}
