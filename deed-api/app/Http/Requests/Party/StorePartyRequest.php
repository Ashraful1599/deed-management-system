<?php
namespace App\Http\Requests\Party;
use Illuminate\Foundation\Http\FormRequest;
class StorePartyRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'type'     => ['required', 'in:individual,entity'],
            'name'     => ['required', 'string', 'max:255'],
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
