/**
 * Module-level auth cache for public pages.
 * Auth is fetched once per browser session and reused across navigations —
 * so the header never flashes on client-side page transitions.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

let _user: PublicUser | null = null;
let _checked = false;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

export async function initPublicAuth(): Promise<void> {
  if (_checked) { notify(); return; }
  const token = typeof window !== 'undefined' ? localStorage.getItem('deed_token') : null;
  if (!token) {
    _checked = true;
    notify();
    return;
  }
  try {
    const res = await fetch(`${API}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      _user = data.data ?? data;
    }
  } catch {
    // token invalid or network error — treat as guest
  }
  _checked = true;
  notify();
}

export function getPublicAuth() {
  return { user: _user, checked: _checked };
}

export function subscribePublicAuth(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/** Call this after a successful login/logout to reset the cache. */
export function resetPublicAuth() {
  _user = null;
  _checked = false;
}
