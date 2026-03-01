'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout, getToken } from '@/lib/auth';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setUser } from '@/lib/store/slices/userSlice';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { IconDashboard, IconDocument, IconBell, IconShield, IconUsers, IconCalendar } from '@/components/ui/Icons';
import { ReactNode } from 'react';

interface NavItem { href: string; label: string; icon: ReactNode; }
interface Notification {
  id: number;
  type: string;
  data: { message?: string; deed_id?: number; deed_title?: string };
  read: boolean;
  created_at: string;
}

const userNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { href: '/dashboard/deeds', label: 'Deeds', icon: <IconDocument /> },
  { href: '/dashboard/appointments', label: 'Appointments', icon: <IconCalendar /> },
  { href: '/dashboard/notifications', label: 'Notifications', icon: <IconBell /> },
];

const deedWriterNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { href: '/dashboard/deeds', label: 'Deeds', icon: <IconDocument /> },
  { href: '/dashboard/appointments', label: 'Appointments', icon: <IconCalendar /> },
  { href: '/dashboard/notifications', label: 'Notifications', icon: <IconBell /> },
];

const adminNavItems: NavItem[] = [
  { href: '/admin', label: 'Admin Dashboard', icon: <IconShield /> },
  { href: '/admin/users', label: 'Manage Users', icon: <IconUsers /> },
  { href: '/admin/deeds', label: 'Manage Deeds', icon: <IconDocument /> },
  { href: '/dashboard/appointments', label: 'Appointments', icon: <IconCalendar /> },
  { href: '/admin/notifications', label: 'Notifications', icon: <IconBell /> },
];

const typeLabels: Record<string, string> = {
  deed_assigned: 'Deed Assigned',
  deed_created: 'Deed Created',
  status_changed: 'Status Changed',
  comment_added: 'New Comment',
  document_uploaded: 'Document Uploaded',
  appointment_requested: 'Appointment Request',
  appointment_updated: 'Appointment Update',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ name, src, size = 'md' }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizeMap[size]} rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0`}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.user.currentUser);

  // Notification dropdown state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile dropdown state
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const esRef = useRef<EventSource | null>(null);

  // Fetch current user — redirect to login if unauthenticated
  useEffect(() => {
    if (!user) {
      api.get('/user')
        .then((r) => dispatch(setUser(r.data.data ?? r.data)))
        .catch((err) => {
          if (err?.response?.status === 401) {
            window.location.href = '/login';
          }
        });
    }
  }, []);

  // Initial unread count
  useEffect(() => {
    api.get('/notifications/unread-count')
      .then((r) => setUnreadCount(r.data.count))
      .catch(() => {});
  }, []);

  // SSE real-time
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
    const es = new EventSource(`${apiUrl}/notifications/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setUnreadCount((prev) => prev + 1);
        setNotifications((prev) => [{
          id: data.id, type: data.type, data: data.data, read: false, created_at: data.created_at,
        }, ...prev].slice(0, 10));
        if (data.data?.message) toast.info(data.data.message, { autoClose: 5000 });
      } catch {}
    };
    es.onerror = () => { es.close(); };
    return () => { es.close(); };
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const openNotif = useCallback(() => {
    setNotifOpen((prev) => {
      if (!prev) {
        setLoadingNotifs(true);
        api.get('/notifications', { params: { per_page: 8 } })
          .then((r) => setNotifications(r.data.data))
          .catch(() => {})
          .finally(() => setLoadingNotifs(false));
      }
      return !prev;
    });
    setProfileOpen(false);
  }, []);

  const openProfile = useCallback(() => {
    setProfileOpen((prev) => !prev);
    setNotifOpen(false);
  }, []);

  async function markAllRead() {
    await api.post('/notifications/mark-all-read').catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: number) {
    await api.post(`/notifications/${id}/read`).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  const visibleNav = user?.role === 'admin' ? adminNavItems
    : user?.role === 'deed_writer' ? deedWriterNavItems
    : userNavItems;
  const roleLabel = user?.role?.replace(/_/g, ' ') ?? '';
  const roleBadgeColor = user?.role === 'admin'
    ? 'bg-red-100 text-red-700'
    : user?.role === 'deed_writer'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-gray-100 text-gray-600';

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Dolil<span className="text-blue-300">BD</span></h1>
          <p className="text-xs text-gray-400 mt-1">Legal Document System</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleNav.map((item) => {
            const exactMatch = ['/dashboard', '/admin'];
            const active = pathname === item.href || (!exactMatch.includes(item.href) && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
                {item.href === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end gap-3 flex-shrink-0">

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={openNotif}
              className="relative p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <IconBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {loadingNotifs ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <IconBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${!n.read ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                        <div className="flex-shrink-0 mt-2">
                          <div className={`w-2 h-2 rounded-full ${!n.read ? 'bg-blue-500' : 'bg-gray-200'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                            {typeLabels[n.type] ?? n.type}
                          </p>
                          <p className="text-sm text-gray-800 leading-snug">{n.data.message}</p>
                          {n.data.deed_id && (
                            <Link
                              href={`/dashboard/deeds/${n.data.deed_id}`}
                              onClick={() => { markRead(n.id); setNotifOpen(false); }}
                              className="text-xs text-blue-600 hover:underline mt-0.5 inline-block cursor-pointer"
                            >
                              {n.data.deed_title ?? `Deed #${n.data.deed_id}`} →
                            </Link>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="flex-shrink-0 text-xs text-gray-300 hover:text-blue-500 mt-1 cursor-pointer"
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-100 px-4 py-2.5">
                  <Link
                    href={user?.role === 'admin' ? '/admin/notifications' : '/dashboard/notifications'}
                    onClick={() => setNotifOpen(false)}
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Profile dropdown */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={openProfile}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Profile menu"
              >
                <Avatar name={user.name} src={user.avatar ?? undefined} size="sm" />
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize leading-tight">{roleLabel}</p>
                </div>
                {/* Chevron */}
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  {/* User info block */}
                  <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Avatar name={user.name} src={user.avatar ?? undefined} size="lg" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${roleBadgeColor}`}>
                        {roleLabel}
                      </span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Edit Profile
                    </Link>

                    {user.role === 'deed_writer' && (
                      <div className="px-4 py-2.5 border-t border-gray-100">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Professional Info</p>
                        {user.registration_number && (
                          <p className="text-xs text-gray-600">Reg: {user.registration_number}</p>
                        )}
                        {user.office_name && (
                          <p className="text-xs text-gray-600">{user.office_name}</p>
                        )}
                        {(user.district_name || user.upazila_name || user.district) && (
                          <p className="text-xs text-gray-600">
                            {[user.upazila_name, user.district_name].filter(Boolean).join(', ') || user.district}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-gray-100 py-1.5">
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
