'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth';
import api from '@/lib/api';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser } from '@/lib/store/slices/userSlice';
import { toast } from 'react-toastify';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedData, setUnverifiedData] = useState<{ email: string; phone: string; verify_token: string } | null>(null);
  const [resending, setResending] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      toast.success('Email verified! You can now sign in.');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Auto-prepend +88 for phone numbers
    const normalized = !loginField.includes('@') && !loginField.startsWith('+')
      ? '+88' + loginField
      : loginField;
    setLoginField(normalized);
    setLoading(true);
    try {
      const { user } = await login(normalized, password);
      dispatch(setUser(user));
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; email_verified?: boolean; email?: string; phone?: string; verify_token?: string }; status?: number } })?.response;
      if (res?.status === 403 && res?.data?.email_verified === false) {
        setUnverifiedData({ email: res.data?.email ?? '', phone: res.data?.phone ?? '', verify_token: res.data?.verify_token ?? '' });
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
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-gray-900">Dolil<span className="text-blue-600">BD</span></h1>
            <p className="text-xs text-gray-500 mt-0.5">Legal Document System</p>
          </Link>
        </div>
      <div className="bg-white rounded-lg shadow p-8 w-full">
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
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

        {/* Unverified account notice */}
        {unverifiedData && (
          <div className="mt-4 border border-yellow-300 bg-yellow-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-yellow-800">Account not verified</p>
            <p className="text-xs text-yellow-700">Verify your email or phone number to sign in.</p>

            {/* Email option */}
            <button
              onClick={async () => {
                setResending(true);
                try {
                  await api.post('/email/verify/resend-by-email', { email: unverifiedData.email });
                  toast.success('Verification email resent!');
                } catch {
                  toast.error('Could not resend. Please try again.');
                } finally { setResending(false); }
              }}
              disabled={resending}
              className="w-full flex items-center gap-2 text-xs bg-white border border-yellow-300 text-yellow-800 rounded-md px-3 py-2 hover:bg-yellow-100 disabled:opacity-50 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              {resending ? 'Sending...' : `Resend email to ${unverifiedData.email}`}
            </button>

            {/* Phone option */}
            {unverifiedData.phone && !otpSent && (
              <button
                onClick={async () => {
                  setOtpSending(true);
                  try {
                    await api.post('/phone/send-otp', {}, { headers: { Authorization: `Bearer ${unverifiedData.verify_token}` } });
                    setOtpSent(true);
                    toast.success('OTP sent to your phone!');
                  } catch {
                    toast.error('Could not send OTP. Please try again.');
                  } finally { setOtpSending(false); }
                }}
                disabled={otpSending}
                className="w-full flex items-center gap-2 text-xs bg-white border border-yellow-300 text-yellow-800 rounded-md px-3 py-2 hover:bg-yellow-100 disabled:opacity-50 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
                </svg>
                {otpSending ? 'Sending OTP...' : `Verify phone ${unverifiedData.phone}`}
              </button>
            )}

            {/* OTP input after phone OTP sent */}
            {otpSent && (
              <div className="space-y-2">
                <p className="text-xs text-yellow-700">Enter the 4-digit OTP sent to {unverifiedData.phone}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="0000"
                    className="w-24 border border-yellow-300 rounded-md px-3 py-1.5 text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      setOtpVerifying(true);
                      try {
                        await api.post('/phone/verify', { code: otp }, { headers: { Authorization: `Bearer ${unverifiedData.verify_token}` } });
                        toast.success('Phone verified! Signing you in...');
                        // Re-attempt login
                        const { user } = await login(loginField, password);
                        dispatch(setUser(user));
                        router.push(user.role === 'admin' ? '/admin' : '/dashboard');
                      } catch {
                        toast.error('Invalid OTP. Please try again.');
                      } finally { setOtpVerifying(false); }
                    }}
                    disabled={otp.length !== 4 || otpVerifying}
                    className="flex-1 bg-yellow-700 text-white text-xs rounded-md px-3 py-1.5 font-medium hover:bg-yellow-800 disabled:opacity-50 cursor-pointer"
                  >
                    {otpVerifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Demo credentials */}
        <div className="mt-6 border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Demo Credentials</p>
          <div className="space-y-2">
            {[
              { role: 'Admin', email: 'admin@deed.com' },
              { role: 'User', email: 'user@deed.com' },
              { role: 'Dolil Writer', email: 'writer@deed.com' },
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
    </div>
  );
}
