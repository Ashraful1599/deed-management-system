'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setUser } from '@/lib/store/slices/userSlice';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Avatar({ name, size = 96 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.user.currentUser);

  // Profile form
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', office_name: '', district: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [passwords, setPasswords] = useState({ password: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone ?? '',
        office_name: currentUser.office_name ?? '',
        district: currentUser.district ?? '',
      });
    } else {
      api.get('/user').then((r) => {
        const u = r.data.data ?? r.data;
        dispatch(setUser(u));
        setProfile({
          name: u.name,
          email: u.email,
          phone: u.phone ?? '',
          office_name: u.office_name ?? '',
          district: u.district ?? '',
        });
      }).catch(() => {});
    }
  }, [currentUser]);

  function setP(field: string, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload: Record<string, string> = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      };
      if (currentUser?.role === 'deed_writer') {
        payload.office_name = profile.office_name;
        payload.district = profile.district;
      }
      const res = await api.put('/profile', payload);
      dispatch(setUser(res.data.user ?? res.data));
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      if (errData?.errors) {
        const msg = Object.values(errData.errors)[0]?.[0];
        toast.error(msg || 'Update failed');
      } else {
        toast.error(errData?.message || 'Update failed');
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.password !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwords.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/profile', { password: passwords.password });
      setPasswords({ password: '', confirm: '' });
      toast.success('Password changed successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Password change failed');
    } finally {
      setSavingPassword(false);
    }
  }

  if (!currentUser) return <div className="text-gray-400 py-8">Loading...</div>;

  const roleBadgeColor =
    currentUser.role === 'admin' ? 'bg-red-100 text-red-700' :
    currentUser.role === 'deed_writer' ? 'bg-purple-100 text-purple-700' :
    'bg-gray-100 text-gray-600';

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>

      {/* Avatar / summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-5">
        <Avatar name={currentUser.name} size={72} />
        <div>
          <p className="text-xl font-semibold text-gray-900">{currentUser.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{currentUser.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${roleBadgeColor}`}>
              {currentUser.role.replace('_', ' ')}
            </span>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              currentUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {currentUser.status}
            </span>
          </div>
          {currentUser.role === 'deed_writer' && currentUser.registration_number && (
            <p className="text-xs text-gray-400 mt-1">Reg: {currentUser.registration_number}</p>
          )}
        </div>
      </div>

      {/* Edit profile */}
      <Section title="Personal Information">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <input type="text" value={profile.name} onChange={(e) => setP('name', e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input type="tel" value={profile.phone} onChange={(e) => setP('phone', e.target.value)} className={inputCls} placeholder="+1234567890" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={profile.email} onChange={(e) => setP('email', e.target.value)} required className={inputCls} />
          </div>

          {currentUser.role === 'deed_writer' && (
            <>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Professional Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Office Name</label>
                    <input type="text" value={profile.office_name} onChange={(e) => setP('office_name', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>District</label>
                    <input type="text" value={profile.district} onChange={(e) => setP('district', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
              {currentUser.registration_number && (
                <div>
                  <label className={labelCls}>Registration Number</label>
                  <input type="text" value={currentUser.registration_number} readOnly className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`} />
                  <p className="text-xs text-gray-400 mt-1">Registration number cannot be changed. Contact admin if needed.</p>
                </div>
              )}
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Section>

      {/* Change password */}
      <Section title="Change Password">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className={labelCls}>New Password</label>
            <input
              type="password"
              value={passwords.password}
              onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              required
              minLength={8}
              placeholder="Repeat new password"
              className={inputCls}
            />
            {passwords.confirm && passwords.password !== passwords.confirm && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword || passwords.password !== passwords.confirm || passwords.password.length < 8}
              className="bg-gray-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {savingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
}
