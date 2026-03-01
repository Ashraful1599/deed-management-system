<?php

namespace App\Http\Controllers;

use App\Http\Resources\DeedPaymentResource;
use App\Models\Deed;
use App\Models\DeedActivity;
use App\Models\DeedPayment;
use Illuminate\Http\Request;

class DeedPaymentController extends Controller
{
    public function index(Request $request, Deed $deed)
    {
        if (!$deed->canAccess($request->user())) {
            abort(403, 'Access denied');
        }

        $payments = $deed->payments()->with('recorder')->orderBy('paid_at')->get();

        return DeedPaymentResource::collection($payments);
    }

    public function store(Request $request, Deed $deed)
    {
        $user = $request->user();

        $isAssigned = $deed->assigned_to === $user->id;
        $isCreator  = $deed->created_by === $user->id && $user->role === 'deed_writer';

        if (!$user->isAdmin() && !$isAssigned && !$isCreator) {
            abort(403, 'Only admins, the assigned writer, or the deed\'s creator can record payments.');
        }

        $data = $request->validate([
            'amount'  => ['required', 'numeric', 'min:0.01'],
            'paid_at' => ['required', 'date'],
            'notes'   => ['nullable', 'string'],
        ]);

        $payment = $deed->payments()->create([
            'recorded_by' => $user->id,
            'amount'      => $data['amount'],
            'paid_at'     => $data['paid_at'],
            'notes'       => $data['notes'] ?? null,
        ]);

        $payment->load('recorder');

        DeedActivity::log(
            $deed->id,
            $user->id,
            'payment_recorded',
            $user->name . ' recorded a payment of ৳' . number_format($data['amount'], 2) . '.'
        );

        return new DeedPaymentResource($payment);
    }

    public function update(Request $request, DeedPayment $payment)
    {
        $user = $request->user();
        $deed = $payment->deed;

        $isAssigned = $deed->assigned_to === $user->id;
        $isCreator  = $deed->created_by === $user->id && $user->role === 'deed_writer';

        if (!$user->isAdmin() && !$isAssigned && !$isCreator) {
            abort(403, 'Only admins, the assigned writer, or the deed\'s creator can edit payments.');
        }

        $data = $request->validate([
            'amount'  => ['required', 'numeric', 'min:0.01'],
            'paid_at' => ['required', 'date'],
            'notes'   => ['nullable', 'string'],
        ]);

        $oldAmount = $payment->amount;
        $payment->update($data);
        $payment->load('recorder');

        DeedActivity::log(
            $deed->id,
            $user->id,
            'payment_updated',
            $user->name . ' updated a payment from ৳' . number_format($oldAmount, 2) . ' to ৳' . number_format($data['amount'], 2) . '.'
        );

        return new DeedPaymentResource($payment);
    }

    public function destroy(Request $request, DeedPayment $payment)
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Only admins can delete payments.');
        }

        $deed = $payment->deed;
        $amount = $payment->amount;
        $payment->delete();

        DeedActivity::log(
            $deed->id,
            $request->user()->id,
            'payment_deleted',
            $request->user()->name . ' deleted a payment of ৳' . number_format($amount, 2) . '.'
        );

        return response()->json(['message' => 'Payment deleted']);
    }
}
