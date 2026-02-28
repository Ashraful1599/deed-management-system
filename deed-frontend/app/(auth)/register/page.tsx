'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { register, resendVerificationEmail } from '@/lib/auth';
import { toast } from 'react-toastify';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Division { id: number; name: string; }
interface District { id: number; division_id: number; name: string; }
interface Upazila  { id: number; district_id: number; name: string; }

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user' as 'user' | 'deed_writer',
    registration_number: '',
    office_name: '',
    division_id: null as number | null,
    district_id: null as number | null,
    upazila_id: null as number | null,
  });

  // Location data
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Fetch divisions when deed_writer role selected
  useEffect(() => {
    if (form.role !== 'deed_writer' || divisions.length > 0) return;
    fetch(`${API}/locations/divisions`)
      .then((r) => r.json())
      .then(setDivisions)
      .catch(() => {});
  }, [form.role]);

  // Fetch districts when division changes
  useEffect(() => {
    setDistricts([]);
    setUpazilas([]);
    setForm((prev) => ({ ...prev, district_id: null, upazila_id: null }));
    if (!form.division_id) return;
    fetch(`${API}/locations/divisions/${form.division_id}/districts`)
      .then((r) => r.json())
      .then(setDistricts)
      .catch(() => {});
  }, [form.division_id]);

  // Fetch upazilas when district changes
  useEffect(() => {
    setUpazilas([]);
    setForm((prev) => ({ ...prev, upazila_id: null }));
    if (!form.district_id) return;
    fetch(`${API}/locations/districts/${form.district_id}/upazilas`)
      .then((r) => r.json())
      .then(setUpazilas)
      .catch(() => {});
  }, [form.district_id]);

  function set(field: string, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Parameters<typeof register>[0] = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        avatarFile: avatarFile ?? undefined,
      };
      if (form.role === 'deed_writer') {
        payload.registration_number = form.registration_number;
        payload.office_name = form.office_name;
        payload.division_id = form.division_id;
        payload.district_id = form.district_id;
        payload.upazila_id = form.upazila_id;
      }
      const { token: tok } = await register(payload);
      setRegisteredEmail(form.email);
      setToken(tok);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      if (errData?.errors) {
        const firstError = Object.values(errData.errors)[0]?.[0];
        toast.error(firstError || 'Registration failed');
      } else {
        toast.error(errData?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!token) return;
    setResending(true);
    try {
      await resendVerificationEmail(token);
      toast.success('Verification email resent!');
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectCls = 'w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  // Show verify email screen after registration
  if (registeredEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 mb-1">
            We sent a verification link to
          </p>
          <p className="text-sm font-semibold text-gray-800 mb-6">{registeredEmail}</p>
          <p className="text-xs text-gray-400 mb-6">
            Click the link in the email to verify your account, then sign in.
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 mb-3"
          >
            {resending ? 'Sending...' : 'Resend verification email'}
          </button>
          <Link href="/login" className="block text-sm text-blue-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar picker */}
          <div className="flex justify-center mb-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden bg-blue-100 border-2 border-dashed border-blue-300 flex items-center justify-center hover:bg-blue-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                )}
              </button>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 -mt-2">Profile photo (optional)</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} required placeholder="+1234567890" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} className={inputCls} />
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${form.role === 'user' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="role" value="user" checked={form.role === 'user'} onChange={() => set('role', 'user')} className="sr-only" />
                <div className="font-medium text-sm text-gray-900">Regular User</div>
                <div className="text-xs text-gray-500 mt-1">Create and track deeds</div>
              </label>
              <label className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${form.role === 'deed_writer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="role" value="deed_writer" checked={form.role === 'deed_writer'} onChange={() => set('role', 'deed_writer')} className="sr-only" />
                <div className="font-medium text-sm text-gray-900">Deed Writer</div>
                <div className="text-xs text-gray-500 mt-1">Licensed professional</div>
              </label>
            </div>
          </div>

          {/* Deed Writer extra fields */}
          {form.role === 'deed_writer' && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
              <p className="text-sm font-medium text-blue-800">Professional Details</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input type="text" value={form.registration_number} onChange={(e) => set('registration_number', e.target.value)} required className={inputCls} placeholder="e.g. DW-2024-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Name</label>
                <input type="text" value={form.office_name} onChange={(e) => set('office_name', e.target.value)} required className={inputCls} placeholder="e.g. Dhaka Legal Services" />
              </div>

              <p className="text-sm font-medium text-blue-800 pt-1">Location</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                <select
                  value={form.division_id ?? ''}
                  onChange={(e) => set('division_id', e.target.value ? Number(e.target.value) : null)}
                  className={selectCls}
                >
                  <option value="">Select Division</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select
                  value={form.district_id ?? ''}
                  onChange={(e) => set('district_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={!form.division_id || districts.length === 0}
                  className={`${selectCls} disabled:bg-gray-100 disabled:text-gray-400`}
                >
                  <option value="">{form.division_id && districts.length === 0 ? 'Loading...' : 'Select District'}</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upazila / Thana</label>
                <select
                  value={form.upazila_id ?? ''}
                  onChange={(e) => set('upazila_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={!form.district_id || upazilas.length === 0}
                  className={`${selectCls} disabled:bg-gray-100 disabled:text-gray-400`}
                >
                  <option value="">{form.district_id && upazilas.length === 0 ? 'Loading...' : 'Select Upazila'}</option>
                  {upazilas.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
