<?php
namespace App\Http\Requests\Property;
use Illuminate\Foundation\Http\FormRequest;
class StorePropertyRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'parcel_number'     => ['required', 'string', 'unique:properties,parcel_number'],
            'address'           => ['required', 'string'],
            'city'              => ['required', 'string'],
            'state'             => ['required', 'string', 'size:2'],
            'county'            => ['nullable', 'string'],
            'zip_code'          => ['nullable', 'string', 'max:10'],
            'legal_description' => ['nullable', 'string'],
            'acreage'           => ['nullable', 'numeric', 'min:0'],
            'notes'             => ['nullable', 'string'],
        ];
    }
}
