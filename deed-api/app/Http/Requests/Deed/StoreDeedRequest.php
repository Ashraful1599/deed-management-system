<?php
namespace App\Http\Requests\Deed;
use Illuminate\Foundation\Http\FormRequest;
class StoreDeedRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'deed_number' => ['nullable', 'string', 'max:100'],
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'status'           => ['sometimes', 'in:draft,under_review,completed,archived'],
            'notes'            => ['nullable', 'string'],
            'agreement_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_status'   => ['sometimes', 'in:pending,partial,completed,overdue'],
        ];
    }
}
