'use client';
import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface BookingForm {
  client_name: string;
  client_phone: string;
  client_email: string;
  preferred_date: string;
  message: string;
}

function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function BookingFormClient({ writerId, writerName }: { writerId: number; writerName: string }) {
  const [form, setForm] = useState<BookingForm>({
    client_name: '', client_phone: '', client_email: '', preferred_date: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/dolil-writers/${writerId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const first = body?.errors ? Object.values(body.errors as Record<string, string[]>)[0]?.[0] : null;
        setError(first ?? body?.message ?? 'Failed to send appointment request.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="font-semibold text-gray-800">Book an Appointment</h2>
        <p className="text-sm text-gray-500 mt-0.5">Send a request to meet with {writerName}</p>
      </div>
      <div className="px-6 py-6">
        {success ? (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium text-green-800">Appointment request sent!</p>
              <p className="text-sm text-green-700 mt-0.5">{writerName} will review your request and get back to you.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" required maxLength={100} value={form.client_name}
                  onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                <input type="tel" required maxLength={20} value={form.client_phone}
                  onChange={(e) => setForm((f) => ({ ...f, client_phone: e.target.value }))}
                  placeholder="Your phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" maxLength={100} value={form.client_email}
                  onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
                  placeholder="Your email (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date <span className="text-red-500">*</span></label>
                <input type="date" required min={tomorrowDate()} value={form.preferred_date}
                  onChange={(e) => setForm((f) => ({ ...f, preferred_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea rows={3} maxLength={500} value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Briefly describe your legal matter (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {submitting ? 'Sending...' : 'Send Appointment Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
