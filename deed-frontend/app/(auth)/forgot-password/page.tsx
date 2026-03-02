'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

type Step = 'lookup' | 'choose' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep]             = useState<Step>('lookup');
  const [identifier, setIdentifier] = useState('');
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountPhone, setAccountPhone] = useState<string | null>(null);
  const [method, setMethod]         = useState<'email' | 'phone'>('email');
  const [otp, setOtp]               = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);

  // Auto-prepend +88 for phone numbers
  function normalizeIdentifier(value: string): string {
    const trimmed = value.trim();
    if (!trimmed.includes('@') && !trimmed.startsWith('+')) {
      return '+88' + trimmed;
    }
    return trimmed;
  }

  // Step 1 — look up account by email or phone
  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeIdentifier(identifier);
    setIdentifier(normalized);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/lookup-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ identifier: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Account not found.');
        return;
      }
      setAccountEmail(data.email);
      setAccountPhone(data.phone);
      setMethod(data.email ? 'email' : 'phone');
      setStep('choose');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2 — send OTP to chosen method
  async function handleSendOtp() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/send-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ identifier, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to send OTP.');
        return;
      }
      setOtp('');
      setStep('otp');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Step 3 — verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch(`${API}/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ identifier, method, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Invalid OTP.');
        return;
      }
      setResetToken(data.reset_token);
      setStep('password');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Step 4 — reset password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, password, password_confirmation: confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Reset failed. Please try again.');
        return;
      }
      toast.success('Password reset successfully!');
      router.push('/login');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

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

          {/* Step 1 — Enter email or phone to find account */}
          {step === 'lookup' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Forgot password?</h2>
                <p className="text-sm text-gray-500 mt-1">Enter your registered email or phone number.</p>
              </div>
              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email or Phone</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="email@example.com or +8801XXXXXXXXX"
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                  {loading ? 'Looking up...' : 'Continue'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">Sign In</Link>
              </p>
            </>
          )}

          {/* Step 2 — Choose OTP method */}
          {step === 'choose' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">How would you like to receive your OTP?</h2>
                <p className="text-sm text-gray-500 mt-1">We'll send a 4-digit code to verify it's you.</p>
              </div>
              <div className="space-y-3 mb-6">
                {accountEmail && (
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`w-full flex items-center gap-3 border-2 rounded-lg p-4 text-left transition-colors cursor-pointer ${
                      method === 'email' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${method === 'email' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${method === 'email' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Send to Email</p>
                      <p className="text-sm text-gray-500">{accountEmail}</p>
                    </div>
                    {method === 'email' && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                  </button>
                )}
                {accountPhone && (
                  <button
                    type="button"
                    onClick={() => setMethod('phone')}
                    className={`w-full flex items-center gap-3 border-2 rounded-lg p-4 text-left transition-colors cursor-pointer ${
                      method === 'phone' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${method === 'phone' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${method === 'phone' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Send to Phone (SMS)</p>
                      <p className="text-sm text-gray-500">{accountPhone}</p>
                    </div>
                    {method === 'phone' && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
              <button
                type="button"
                onClick={() => setStep('lookup')}
                className="w-full mt-2 border border-gray-300 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer"
              >
                Back
              </button>
            </>
          )}

          {/* Step 3 — Enter OTP */}
          {step === 'otp' && (
            <>
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Enter OTP</h2>
                <p className="text-sm text-gray-500">
                  We sent a 4-digit code to your {method === 'phone' ? 'phone' : 'email'}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  {method === 'email' ? accountEmail : accountPhone}
                </p>
              </div>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  className="w-32 mx-auto block border border-gray-300 rounded-lg px-3 py-2.5 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={otp.length !== 4 || loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full border border-gray-300 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </form>
            </>
          )}

          {/* Step 4 — New password */}
          {step === 'password' && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
                <p className="text-sm text-gray-500 mt-1">Enter your new password below.</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Repeat your new password"
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
