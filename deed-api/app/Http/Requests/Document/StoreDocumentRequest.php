<?php
namespace App\Http\Requests\Document;
use Illuminate\Foundation\Http\FormRequest;
class StoreDocumentRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'file'  => ['required', 'file', 'mimes:pdf', 'max:20480'],
            'label' => ['nullable', 'string', 'max:255'],
        ];
    }
}
