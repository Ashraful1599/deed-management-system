'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/auth';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser } from '@/lib/store/slices/userSlice';
import { toast } from 'react-toastify';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user' as 'user' | 'deed_writer',
    registration_number: '',
    office_name: '',
    district: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      };
      if (form.role === 'deed_writer') {
        payload.registration_number = form.registration_number;
        payload.office_name = form.office_name;
        payload.district = form.district;
      }
      const { user } = await register(payload);
      dispatch(setUser(user));
      router.push('/dashboard');
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

  const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <input type="text" value={form.office_name} onChange={(e) => set('office_name', e.target.value)} required className={inputCls} placeholder="e.g. Smith Legal Services" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input type="text" value={form.district} onChange={(e) => set('district', e.target.value)} required className={inputCls} placeholder="e.g. Northern District" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
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
