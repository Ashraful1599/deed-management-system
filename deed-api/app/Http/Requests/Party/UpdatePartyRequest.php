<?php
namespace App\Http\Requests\Party;
use Illuminate\Foundation\Http\FormRequest;
class UpdatePartyRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'type'     => ['sometimes', 'in:individual,entity'],
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['nullable', 'email'],
            'phone'    => ['nullable', 'string'],
            'address'  => ['nullable', 'string'],
            'city'     => ['nullable', 'string'],
            'state'    => ['nullable', 'string', 'size:2'],
            'zip_code' => ['nullable', 'string', 'max:10'],
            'notes'    => ['nullable', 'string'],
        ];
    }
}
