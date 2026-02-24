<?php
namespace App\Http\Requests\Property;
use Illuminate\Foundation\Http\FormRequest;
class UpdatePropertyRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'parcel_number'     => ['sometimes', 'string', 'unique:properties,parcel_number,' . $this->route('property')->id],
            'address'           => ['sometimes', 'string'],
            'city'              => ['sometimes', 'string'],
            'state'             => ['sometimes', 'string', 'size:2'],
            'county'            => ['nullable', 'string'],
            'zip_code'          => ['nullable', 'string', 'max:10'],
            'legal_description' => ['nullable', 'string'],
            'acreage'           => ['nullable', 'numeric', 'min:0'],
            'notes'             => ['nullable', 'string'],
        ];
    }
}
