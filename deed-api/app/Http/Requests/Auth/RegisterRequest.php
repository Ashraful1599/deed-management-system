<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                => ['required', 'string', 'max:255'],
            'email'               => ['required', 'email', 'unique:users,email'],
            'phone'               => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password'            => ['required', 'string', 'min:8'],
            'role'                => ['required', 'in:user,dolil_writer'],
            // Dolil Writer only fields
            'registration_number' => ['required_if:role,dolil_writer', 'nullable', 'string'],
            'office_name'         => ['required_if:role,dolil_writer', 'nullable', 'string'],
            'district'            => ['nullable', 'string'],
            'division_id'         => ['nullable', 'integer', 'exists:bd_divisions,id'],
            'district_id'         => ['nullable', 'integer', 'exists:bd_districts,id'],
            'upazila_id'          => ['nullable', 'integer', 'exists:bd_upazilas,id'],
            'avatar'              => ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:2048'],
            'referral_code'       => ['nullable', 'string', 'max:10'],
        ];
    }
}
