<?php
namespace App\Http\Requests\Deed;
use Illuminate\Foundation\Http\FormRequest;
class UpdateDeedRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'title'       => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'status'      => ['sometimes', 'in:draft,pending,completed,recorded'],
            'notes'       => ['nullable', 'string'],
        ];
    }
}
