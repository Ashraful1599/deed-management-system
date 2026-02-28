'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth';
import api from '@/lib/api';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser } from '@/lib/store/slices/userSlice';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      toast.success('Email verified! You can now sign in.');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await login(loginField, password);
      dispatch(setUser(user));
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; email_verified?: boolean; email?: string }; status?: number } })?.response;
      if (res?.status === 403 && res?.data?.email_verified === false) {
        setUnverifiedEmail(res.data?.email || loginField);
      } else {
        const message = res?.data?.message || 'Login failed. Check your credentials.';
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
          <p className="text-sm text-gray-500 mt-1">Use your email or phone number</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email or Phone</label>
            <input
              type="text"
              value={loginField}
              onChange={(e) => setLoginField(e.target.value)}
              required
              placeholder="email@example.com or +1234567890"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          No account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>

        {/* Unverified email notice */}
        {unverifiedEmail && (
          <div className="mt-4 border border-yellow-300 bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800 mb-1">Email not verified</p>
            <p className="text-xs text-yellow-700 mb-3">Please check your inbox for <span className="font-semibold">{unverifiedEmail}</span> and click the verification link.</p>
            <button
              onClick={async () => {
                setResending(true);
                try {
                  await api.post('/email/verify/resend-by-email', { email: unverifiedEmail });
                  toast.success('Verification email resent!');
                } catch {
                  toast.error('Could not resend — please try registering again.');
                } finally { setResending(false); }
              }}
              disabled={resending}
              className="text-xs text-yellow-800 font-medium underline disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        )}

        {/* Demo credentials */}
        <div className="mt-6 border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Demo Credentials</p>
          <div className="space-y-2">
            {[
              { role: 'Admin', email: 'admin@deed.com' },
              { role: 'User', email: 'user@deed.com' },
              { role: 'Deed Writer', email: 'writer@deed.com' },
            ].map(({ role, email }) => (
              <button
                key={email}
                type="button"
                onClick={() => { setLoginField(email); setPassword('12345678'); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">{role}</span>
                <span className="text-xs text-gray-400 group-hover:text-blue-500">{email}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">Password: <span className="font-mono font-semibold text-gray-600">12345678</span> · Click a row to fill in</p>
        </div>
      </div>
    </div>
  );
}
