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
            'role'                => ['required', 'in:user,deed_writer'],
            // Deed Writer only fields
            'registration_number' => ['required_if:role,deed_writer', 'nullable', 'string'],
            'office_name'         => ['required_if:role,deed_writer', 'nullable', 'string'],
            'district'            => ['required_if:role,deed_writer', 'nullable', 'string'],
        ];
    }
}
