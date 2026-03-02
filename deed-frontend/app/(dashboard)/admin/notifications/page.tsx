'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { fmtDateTime } from '@/lib/date';
import { toast } from 'react-toastify';
import Link from 'next/link';

interface Notification {
  id: number;
  type: string;
  data: { message?: string; dolil_id?: number; dolil_title?: string; actor_name?: string };
  read: boolean;
  read_at: string | null;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  dolil_assigned: 'Dolil Assigned',
  dolil_created: 'Dolil Created',
  status_changed: 'Status Changed',
  comment_added: 'New Comment',
  document_uploaded: 'Document Uploaded',
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get('/notifications')
      .then((r) => setNotifications(r.data.data))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  }

  async function markRead(id: number) {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {}
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {notifications.length === 0 && (
            <p className="px-6 py-10 text-center text-gray-400">No notifications</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50' : ''}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />}
                {n.read && <div className="w-2 h-2 rounded-full bg-gray-200 mt-1.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {typeLabels[n.type] ?? n.type}
                  </span>
                </div>
                <p className="text-sm text-gray-900">{n.data.message}</p>
                {n.data.dolil_id && (
                  <Link href={`/dashboard/dolils/${n.data.dolil_id}`} className="text-xs text-blue-600 hover:underline mt-0.5 block">
                    View dolil: {n.data.dolil_title}
                  </Link>
                )}
                <p className="text-xs text-gray-400 mt-1">{fmtDateTime(n.created_at)}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
