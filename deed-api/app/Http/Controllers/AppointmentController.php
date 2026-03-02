<?php

namespace App\Http\Controllers;

use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    /**
     * Public — anyone can book an appointment with a dolil writer.
     */
    public function store(Request $request, User $user)
    {
        if ($user->role !== 'dolil_writer' || $user->status !== 'active') {
            abort(404, 'Dolil writer not found.');
        }

        $data = $request->validate([
            'client_name'    => 'required|string|max:100',
            'client_phone'   => 'required|string|max:20',
            'client_email'   => 'nullable|email|max:100',
            'preferred_date' => 'required|date|after:today',
            'message'        => 'nullable|string|max:500',
        ]);

        $data['dolil_writer_id'] = $user->id;
        $data['client_id']      = auth('sanctum')->id();

        $appointment = Appointment::create($data);

        Notification::create([
            'user_id' => $user->id,
            'type'    => 'appointment_requested',
            'data'    => [
                'appointment_id' => $appointment->id,
                'client_name'    => $appointment->client_name,
                'client_phone'   => $appointment->client_phone,
                'preferred_date' => $appointment->preferred_date->format('Y-m-d'),
                'note'           => $appointment->message,
                'message'        => ($appointment->client_name . ' has requested an appointment on ' . $appointment->preferred_date->format('M d, Y') . '.'),
            ],
        ]);

        return response()->json(['message' => 'Appointment request sent.'], 201);
    }

    /**
     * Auth required — list appointments.
     */
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Appointment::with(['dolilWriter', 'client'])->latest();

        if ($user->role === 'admin') {
            // Admin sees all
        } elseif ($user->role === 'dolil_writer') {
            $query->where('dolil_writer_id', $user->id);
        } else {
            // Regular user sees their own bookings
            $query->where('client_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return AppointmentResource::collection($query->paginate(20));
    }

    /**
     * Auth required — confirm or cancel an appointment.
     */
    public function update(Request $request, Appointment $appointment)
    {
        $user = $request->user();

        if (!$user->isAdmin() && !($user->role === 'dolil_writer' && $appointment->dolil_writer_id === $user->id)) {
            abort(403, 'Access denied.');
        }

        $data = $request->validate([
            'status' => 'required|in:confirmed,cancelled',
        ]);

        $appointment->update($data);
        $appointment->load(['dolilWriter', 'client']);

        // Notify client if logged in
        if ($appointment->client_id) {
            Notification::create([
                'user_id' => $appointment->client_id,
                'type'    => 'appointment_updated',
                'data'    => [
                    'appointment_id'  => $appointment->id,
                    'dolil_writer_name' => $appointment->dolilWriter->name,
                    'status'          => $appointment->status,
                    'preferred_date'  => $appointment->preferred_date->format('Y-m-d'),
                    'message'         => 'Your appointment on ' . $appointment->preferred_date->format('M d, Y') . ' has been ' . $appointment->status . ' by ' . $appointment->dolilWriter->name . '.',
                ],
            ]);
        }

        return new AppointmentResource($appointment);
    }
}
