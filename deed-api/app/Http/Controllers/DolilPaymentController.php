<?php

namespace App\Http\Controllers;

use App\Http\Resources\DolilPaymentResource;
use App\Models\Dolil;
use App\Models\DolilActivity;
use App\Models\DolilPayment;
use Illuminate\Http\Request;

class DolilPaymentController extends Controller
{
    public function index(Request $request, Dolil $dolil)
    {
        if (!$dolil->canAccess($request->user())) {
            abort(403, 'Access denied');
        }

        $payments = $dolil->payments()->with('recorder')->orderBy('paid_at')->get();

        return DolilPaymentResource::collection($payments);
    }

    public function store(Request $request, Dolil $dolil)
    {
        $user = $request->user();

        $isAssigned = $dolil->assigned_to === $user->id;
        $isCreator  = $dolil->created_by === $user->id && $user->role === 'dolil_writer';

        if (!$user->isAdmin() && !$isAssigned && !$isCreator) {
            abort(403, 'Only admins, the assigned writer, or the dolil\'s creator can record payments.');
        }

        $data = $request->validate([
            'amount'  => ['required', 'numeric', 'min:0.01'],
            'paid_at' => ['required', 'date'],
            'notes'   => ['nullable', 'string'],
        ]);

        $payment = $dolil->payments()->create([
            'recorded_by' => $user->id,
            'amount'      => $data['amount'],
            'paid_at'     => $data['paid_at'],
            'notes'       => $data['notes'] ?? null,
        ]);

        $payment->load('recorder');

        DolilActivity::log(
            $dolil->id,
            $user->id,
            'payment_recorded',
            $user->name . ' recorded a payment of ৳' . number_format($data['amount'], 2) . '.'
        );

        return new DolilPaymentResource($payment);
    }

    public function update(Request $request, DolilPayment $payment)
    {
        $user = $request->user();
        $dolil = $payment->dolil;

        $isAssigned = $dolil->assigned_to === $user->id;
        $isCreator  = $dolil->created_by === $user->id && $user->role === 'dolil_writer';

        if (!$user->isAdmin() && !$isAssigned && !$isCreator) {
            abort(403, 'Only admins, the assigned writer, or the dolil\'s creator can edit payments.');
        }

        $data = $request->validate([
            'amount'  => ['required', 'numeric', 'min:0.01'],
            'paid_at' => ['required', 'date'],
            'notes'   => ['nullable', 'string'],
        ]);

        $oldAmount = $payment->amount;
        $payment->update($data);
        $payment->load('recorder');

        DolilActivity::log(
            $dolil->id,
            $user->id,
            'payment_updated',
            $user->name . ' updated a payment from ৳' . number_format($oldAmount, 2) . ' to ৳' . number_format($data['amount'], 2) . '.'
        );

        return new DolilPaymentResource($payment);
    }

    public function destroy(Request $request, DolilPayment $payment)
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Only admins can delete payments.');
        }

        $dolil = $payment->dolil;
        $amount = $payment->amount;
        $payment->delete();

        DolilActivity::log(
            $dolil->id,
            $request->user()->id,
            'payment_deleted',
            $request->user()->name . ' deleted a payment of ৳' . number_format($amount, 2) . '.'
        );

        return response()->json(['message' => 'Payment deleted']);
    }
}
