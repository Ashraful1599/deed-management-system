'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { showConfirm } from '@/lib/confirm';
import { useAppSelector } from '@/lib/store/hooks';

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

interface Appointment {
  id: number;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  preferred_date: string;
  message: string | null;
  status: AppointmentStatus;
  created_at: string;
  dolil_writer: { id: number; name: string } | null;
  client: { id: number; name: string } | null;
}

interface Paginated {
  data: Appointment[];
  current_page: number;
  last_page: number;
  total: number;
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function statusBadge(status: AppointmentStatus) {
  const map: Record<AppointmentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AppointmentsPage() {
  const user = useAppSelector((s) => s.user.currentUser);
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchAppointments = useCallback(async (status: string, pg: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: pg };
      if (status) params.status = status;
      const r = await api.get('/appointments', { params });
      setResult(r.data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments(tab, page);
  }, [tab, page, fetchAppointments]);

  function changeTab(value: string) {
    setTab(value);
    setPage(1);
  }

  async function updateStatus(id: number, status: 'confirmed' | 'cancelled') {
    if (status === 'cancelled') {
      const ok = await showConfirm('Cancel this appointment? The client will be notified.', {
        title: 'Cancel Appointment',
        confirmLabel: 'Yes, Cancel',
      });
      if (!ok) return;
    }
    setUpdating(id);
    try {
      const r = await api.patch(`/appointments/${id}`, { status });
      setResult((prev) => prev ? {
        ...prev,
        data: prev.data.map((a) => a.id === id ? { ...a, status: r.data.data?.status ?? r.data.status } : a),
      } : prev);
    } catch {
      // silently ignore
    } finally {
      setUpdating(null);
    }
  }

  const canManage = user?.role === 'admin' || user?.role === 'dolil_writer';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.role === 'admin' ? 'All appointment requests across dolil writers' : 'Incoming appointment requests from clients'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => changeTab(t.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              tab === t.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !result || result.data.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 text-sm">No appointments{tab ? ` with status "${tab}"` : ''} found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {result.data.map((appt) => (
            <div key={appt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Client info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{appt.client_name}</span>
                    {statusBadge(appt.status)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>
                      <span className="font-medium text-gray-700">Phone: </span>{appt.client_phone}
                    </span>
                    {appt.client_email && (
                      <span>
                        <span className="font-medium text-gray-700">Email: </span>{appt.client_email}
                      </span>
                    )}
                    <span>
                      <span className="font-medium text-gray-700">Date: </span>{formatDate(appt.preferred_date)}
                    </span>
                  </div>
                  {user?.role === 'admin' && appt.dolil_writer && (
                    <p className="text-xs text-gray-400">
                      Writer: <span className="text-gray-600 font-medium">{appt.dolil_writer.name}</span>
                    </p>
                  )}
                  {appt.message && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      {appt.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 pt-1">
                    Requested {formatDate(appt.created_at)}
                  </p>
                </div>

                {/* Actions */}
                {canManage && appt.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateStatus(appt.id, 'confirmed')}
                      disabled={updating === appt.id}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {updating === appt.id ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => updateStatus(appt.id, 'cancelled')}
                      disabled={updating === appt.id}
                      className="px-3 py-1.5 bg-white text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {updating === appt.id ? '...' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {result.last_page > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                Page {result.current_page} of {result.last_page} &middot; {result.total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={result.current_page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(result.last_page, p + 1))}
                  disabled={result.current_page === result.last_page}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
