'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Select from 'react-select';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setUser } from '@/lib/store/slices/userSlice';

interface ReferralEntry {
  id: number;
  name: string;
  phone: string;
  joined_at: string;
  credited: boolean;
  credited_at: string | null;
}

interface ReferralData {
  referral_code: string;
  referral_url: string;
  credits: number;
  total_referred: number;
  total_credited: number;
  referrals: ReferralEntry[];
}

type AddressTypeValue = 'Union' | 'Municipality' | 'City Corporation';
type SelectOption = { value: string; label: string };

interface BdDivision { id: string; name_bn: string; name_en: string; }
interface BdDistrict { id: string; name_bn: string; name_en: string; division_id: string; }
interface BdThana { id: string; name_bn: string; name_en: string; district_id: string; }
interface BdUnion { id: string; name_bn: string; name_en: string; thana_id: string; }
interface BdPostOffice { id: string; name_bn: string; name_en: string; code: string; district_id: string; }
interface BdMunicipality { id: string; name_bn: string; name_en: string; district_id: string; }
interface BdCityCorporation { id: string; name_bn: string; name_en: string; district_id: string; }
interface BdWard { value: string; label_bn: string; label_en: string; }
interface BdAddressData {
  divisions: BdDivision[];
  districts: BdDistrict[];
  thanas: BdThana[];
  unions: BdUnion[];
  postOffices: BdPostOffice[];
  municipalities: BdMunicipality[];
  cityCorporations: BdCityCorporation[];
  wards: BdWard[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rsStyles: any = {
  control: (base: any, state: any) => ({
    ...base,
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    minHeight: '38px',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
    '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#d1d5db' },
  }),
  option: (base: any, state: any) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
    color: state.isSelected ? 'white' : '#111827',
    cursor: 'pointer',
  }),
  placeholder: (base: any) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
  menu: (base: any) => ({ ...base, zIndex: 50 }),
  singleValue: (base: any) => ({ ...base, fontSize: '0.875rem' }),
};

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

// Valid BD mobile: 01[3-9]XXXXXXXX (11 digits)
function validateBdPhone(local: string): string {
  if (!local) return '';
  if (!/^\d+$/.test(local)) return 'Only digits are allowed.';
  if (local.length !== 11) return 'Phone number must be 11 digits (e.g. 01XXXXXXXXX).';
  if (!/^01[3-9]\d{8}$/.test(local)) return 'Enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX).';
  return '';
}

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

function Avatar({ name, src, size = 96 }: { name: string; src?: string; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Phone verification widget ──────────────────────────────────────────────
function PhoneVerification({ phone, verifiedAt, onVerified }: {
  phone: string | null;
  verifiedAt: string | null;
  onVerified: (user: unknown) => void;
}) {
  const [step, setStep] = useState<'idle' | 'sending' | 'otp' | 'verifying'>('idle');
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCountdown() {
    setSecondsLeft(15 * 60);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); setStep('idle'); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  function startResendCooldown() {
    setResendCooldown(60);
    resendRef.current = setInterval(() => {
      setResendCooldown((s) => { if (s <= 1) { clearInterval(resendRef.current!); return 0; } return s - 1; });
    }, 1000);
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (resendRef.current) clearInterval(resendRef.current);
  }, []);

  async function handleSend() {
    setStep('sending');
    try {
      await api.post('/phone/send-otp');
      setOtp('');
      setStep('otp');
      startCountdown();
      startResendCooldown();
      toast.success('OTP sent to ' + phone);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to send OTP');
      setStep('idle');
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setStep('verifying');
    try {
      const res = await api.post('/phone/verify', { code: otp });
      toast.success('Phone verified!');
      if (timerRef.current) clearInterval(timerRef.current);
      onVerified(res.data.user);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Invalid OTP');
      setStep('otp');
    }
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  if (!phone) return (
    <p className="text-sm text-gray-400">Add a phone number above and save before verifying.</p>
  );

  if (verifiedAt) return (
    <div className="flex items-center gap-2 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span className="text-green-700 font-medium">{phone} — Verified</span>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span><span className="font-medium">{phone}</span> — Not verified</span>
      </div>

      {step === 'idle' && (
        <button onClick={handleSend}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
          Send OTP
        </button>
      )}

      {step === 'sending' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Sending OTP…
        </div>
      )}

      {(step === 'otp' || step === 'verifying') && (
        <form onSubmit={handleVerify} className="space-y-3">
          <p className="text-xs text-gray-500">
            Enter the 6-digit code sent to <span className="font-medium">{phone}</span>.
            Expires in <span className="font-semibold text-gray-700">{fmt(secondsLeft)}</span>.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="000000"
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={otp.length !== 4 || step === 'verifying'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {step === 'verifying' ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={resendCooldown > 0 || step === 'verifying'}
              className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.user.currentUser);

  // Profile form
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', office_name: '',
    address_type: 'Union' as AddressTypeValue,
    bd_division_id: null as string | null,
    bd_district_id: null as string | null,
    bd_thana_id: null as string | null,
    bd_union_id: null as string | null,
    bd_municipality_id: null as string | null,
    bd_city_corporation_id: null as string | null,
    bd_post_office_id: null as string | null,
    bd_ward: null as string | null,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Password form
  const [passwords, setPasswords] = useState({ password: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Referral data
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loadingReferral, setLoadingReferral] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Address JSON data
  const [addressData, setAddressData] = useState<BdAddressData | null>(null);

  // Load address JSON when user is a dolil_writer
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'dolil_writer' || addressData) return;
    fetch('/bangladesh_address_data.json')
      .then(r => r.json())
      .then(setAddressData)
      .catch(() => {});
  }, [currentUser, addressData]);

  // Memoized option lists
  const divisionOptions = useMemo<SelectOption[]>(() =>
    (addressData?.divisions ?? []).map(d => ({ value: d.id, label: `${d.name_bn} (${d.name_en})` })),
    [addressData]);

  const districtOptions = useMemo<SelectOption[]>(() =>
    (addressData?.districts ?? [])
      .filter(d => d.division_id === profile.bd_division_id)
      .map(d => ({ value: d.id, label: `${d.name_bn} (${d.name_en})` })),
    [addressData, profile.bd_division_id]);

  const thanaOptions = useMemo<SelectOption[]>(() =>
    (addressData?.thanas ?? [])
      .filter(t => t.district_id === profile.bd_district_id)
      .map(t => ({ value: t.id, label: `${t.name_bn} (${t.name_en})` })),
    [addressData, profile.bd_district_id]);

  const unionOptions = useMemo<SelectOption[]>(() =>
    (addressData?.unions ?? [])
      .filter(u => u.thana_id === profile.bd_thana_id)
      .map(u => ({ value: u.id, label: `${u.name_bn} (${u.name_en})` })),
    [addressData, profile.bd_thana_id]);

  const postOfficeOptions = useMemo<SelectOption[]>(() =>
    (addressData?.postOffices ?? [])
      .filter(p => p.district_id === profile.bd_district_id)
      .map(p => ({ value: p.id, label: `${p.name_bn} (${p.code}) ${p.name_en} (${p.code})` })),
    [addressData, profile.bd_district_id]);

  const municipalityOptions = useMemo<SelectOption[]>(() =>
    (addressData?.municipalities ?? [])
      .filter(m => m.district_id === profile.bd_district_id)
      .map(m => ({ value: m.id, label: `${m.name_bn} (${m.name_en})` })),
    [addressData, profile.bd_district_id]);

  const cityCorporationOptions = useMemo<SelectOption[]>(() =>
    (addressData?.cityCorporations ?? [])
      .filter(c => c.district_id === profile.bd_district_id)
      .map(c => ({ value: c.id, label: `${c.name_bn} (${c.name_en})` })),
    [addressData, profile.bd_district_id]);

  const wardOptions = useMemo<SelectOption[]>(() =>
    (addressData?.wards ?? []).map(w => ({ value: w.value, label: `${w.label_bn} (${w.label_en})` })),
    [addressData]);

  function findOpt(opts: SelectOption[], val: string | null): SelectOption | null {
    return opts.find(o => o.value === val) ?? null;
  }

  // Cascade reset handlers
  const addressTypeOptions: SelectOption[] = [
    { value: 'Union', label: 'ইউনিয়ন (Union)' },
    { value: 'Municipality', label: 'পৌরসভা (Municipality)' },
    { value: 'City Corporation', label: 'সিটি কর্পোরেশন (City Corporation)' },
  ];

  function onAddressTypeChange(opt: SelectOption | null) {
    setProfile(prev => ({
      ...prev,
      address_type: (opt?.value as AddressTypeValue) ?? 'Union',
      bd_district_id: null, bd_thana_id: null,
      bd_union_id: null, bd_municipality_id: null,
      bd_city_corporation_id: null, bd_post_office_id: null, bd_ward: null,
    }));
  }

  function onDivisionChange(opt: SelectOption | null) {
    setProfile(prev => ({
      ...prev,
      bd_division_id: opt?.value ?? null,
      bd_district_id: null, bd_thana_id: null,
      bd_union_id: null, bd_municipality_id: null,
      bd_city_corporation_id: null, bd_post_office_id: null,
    }));
  }

  function onDistrictChange(opt: SelectOption | null) {
    setProfile(prev => ({
      ...prev,
      bd_district_id: opt?.value ?? null,
      bd_thana_id: null, bd_union_id: null,
      bd_municipality_id: null, bd_city_corporation_id: null,
      bd_post_office_id: null,
    }));
  }

  function onThanaChange(opt: SelectOption | null) {
    setProfile(prev => ({ ...prev, bd_thana_id: opt?.value ?? null, bd_union_id: null }));
  }

  function setAddr(field: string, value: string | null) {
    setProfile(prev => ({ ...prev, [field]: value }));
  }

  // Address type-specific field
  let specificLabel = 'ইউনিয়ন';
  let specificOptions: SelectOption[] = unionOptions;
  let specificValue: SelectOption | null = findOpt(unionOptions, profile.bd_union_id);
  function onSpecificChange(opt: SelectOption | null) {
    if (profile.address_type === 'Union') setAddr('bd_union_id', opt?.value ?? null);
    else if (profile.address_type === 'Municipality') setAddr('bd_municipality_id', opt?.value ?? null);
    else setAddr('bd_city_corporation_id', opt?.value ?? null);
  }
  if (profile.address_type === 'Municipality') {
    specificLabel = 'পৌরসভা';
    specificOptions = municipalityOptions;
    specificValue = findOpt(municipalityOptions, profile.bd_municipality_id);
  } else if (profile.address_type === 'City Corporation') {
    specificLabel = 'সিটি কর্পোরেশন';
    specificOptions = cityCorporationOptions;
    specificValue = findOpt(cityCorporationOptions, profile.bd_city_corporation_id);
  }

  // Fetch referral data on mount
  useEffect(() => {
    setLoadingReferral(true);
    api.get('/referrals')
      .then((r) => setReferralData(r.data))
      .catch(() => {})
      .finally(() => setLoadingReferral(false));
  }, []);

  function copyReferralLink() {
    if (!referralData) return;
    navigator.clipboard.writeText(referralData.referral_url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('avatar', file);
    await toast.promise(
      api.post('/profile/avatar', fd).then((res) => {
        dispatch(setUser(res.data.data ?? res.data));
      }),
      {
        pending: 'Uploading photo...',
        success: 'Profile photo updated',
        error: 'Failed to upload photo',
      }
    ).finally(() => {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    });
  }

  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.name ?? '',
        email: currentUser.email ?? '',
        phone: currentUser.phone ?? '',
        office_name: currentUser.office_name ?? '',
        address_type: (currentUser.address_type as AddressTypeValue) ?? 'Union',
        bd_division_id: currentUser.division_id ? String(currentUser.division_id) : null,
        bd_district_id: currentUser.district_id ? String(currentUser.district_id) : null,
        bd_thana_id: currentUser.upazila_id ? String(currentUser.upazila_id) : null,
        bd_union_id: currentUser.bd_union_id ?? null,
        bd_municipality_id: currentUser.bd_municipality_id ?? null,
        bd_city_corporation_id: currentUser.bd_city_corporation_id ?? null,
        bd_post_office_id: currentUser.bd_post_office_id ?? null,
        bd_ward: currentUser.bd_ward ?? null,
      });
    } else {
      api.get('/user').then((r) => {
        const u = r.data.data ?? r.data;
        dispatch(setUser(u));
        setProfile({
          name: u.name ?? '',
          email: u.email ?? '',
          phone: u.phone ?? '',
          office_name: u.office_name ?? '',
          address_type: (u.address_type as AddressTypeValue) ?? 'Union',
          bd_division_id: u.division_id ? String(u.division_id) : null,
          bd_district_id: u.district_id ? String(u.district_id) : null,
          bd_thana_id: u.upazila_id ? String(u.upazila_id) : null,
          bd_union_id: u.bd_union_id ?? null,
          bd_municipality_id: u.bd_municipality_id ?? null,
          bd_city_corporation_id: u.bd_city_corporation_id ?? null,
          bd_post_office_id: u.bd_post_office_id ?? null,
          bd_ward: u.bd_ward ?? null,
        });
      }).catch(() => {});
    }
  }, [currentUser]);

  function setP(field: string, value: string | number | null) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    const localPhone = profile.phone.replace(/^\+88/, '');
    if (localPhone) {
      const err = validateBdPhone(localPhone);
      if (err) { setPhoneError(err); return; }
    }
    setSavingProfile(true);
    try {
      const payload: Record<string, string | number | null> = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      };
      if (currentUser?.role === 'dolil_writer') {
        payload.office_name = profile.office_name;
        payload.division_id = profile.bd_division_id ? Number(profile.bd_division_id) : null;
        payload.district_id = profile.bd_district_id ? Number(profile.bd_district_id) : null;
        payload.upazila_id = profile.bd_thana_id ? Number(profile.bd_thana_id) : null;
        payload.address_type = profile.address_type;
        payload.bd_union_id = profile.bd_union_id;
        payload.bd_municipality_id = profile.bd_municipality_id;
        payload.bd_city_corporation_id = profile.bd_city_corporation_id;
        payload.bd_post_office_id = profile.bd_post_office_id;
        payload.bd_ward = profile.bd_ward;
      }
      const res = await api.put('/profile', payload);
      dispatch(setUser(res.data.data ?? res.data.user ?? res.data));
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
    currentUser.role === 'dolil_writer' ? 'bg-purple-100 text-purple-700' :
    'bg-gray-100 text-gray-600';

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>

      {/* Avatar / summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <Avatar name={currentUser.name} src={currentUser.avatar ?? undefined} size={72} />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
            title="Change photo"
          >
            {uploadingAvatar ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <div>
          <p className="text-xl font-semibold text-gray-900">{currentUser.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{currentUser.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${roleBadgeColor}`}>
              {currentUser.role?.replace('_', ' ')}
            </span>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              currentUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {currentUser.status}
            </span>
          </div>
          {currentUser.role === 'dolil_writer' && currentUser.registration_number && (
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
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2.5 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm select-none">+88</span>
                <input
                  type="tel"
                  value={profile.phone.replace(/^\+88/, '')}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setP('phone', '+88' + digits);
                    setPhoneError(validateBdPhone(digits));
                  }}
                  onBlur={(e) => setPhoneError(validateBdPhone(e.target.value.replace(/\D/g, '')))}
                  className={`${inputCls} rounded-l-none ${phoneError ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                />
              </div>
              {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
            </div>
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={profile.email} onChange={(e) => setP('email', e.target.value)} required className={inputCls} />
          </div>

          {currentUser.role === 'dolil_writer' && (
            <>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Professional Details</p>
                <div className="mb-4">
                  <label className={labelCls}>Office Name</label>
                  <input type="text" value={profile.office_name} onChange={(e) => setP('office_name', e.target.value)} className={inputCls} />
                </div>

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ঠিকানা (Address)</p>

                {/* Row 1: Address type | Division */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ঠিকানার ধরন</label>
                    <Select
                      options={addressTypeOptions}
                      value={findOpt(addressTypeOptions, profile.address_type)}
                      onChange={onAddressTypeChange}
                      styles={rsStyles}
                      placeholder="ধরন নির্বাচন করুন"
                      isSearchable={false}
                      instanceId="profile-address-type"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">বিভাগ</label>
                    <Select
                      options={divisionOptions}
                      value={findOpt(divisionOptions, profile.bd_division_id)}
                      onChange={onDivisionChange}
                      styles={rsStyles}
                      placeholder="বিভাগ নির্বাচন করুন"
                      isLoading={!addressData}
                      instanceId="profile-bd-division"
                    />
                  </div>
                </div>

                {/* Row 2: District | Thana */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">জেলা</label>
                    <Select
                      options={districtOptions}
                      value={findOpt(districtOptions, profile.bd_district_id)}
                      onChange={onDistrictChange}
                      styles={rsStyles}
                      placeholder="জেলা নির্বাচন করুন"
                      isDisabled={!profile.bd_division_id}
                      instanceId="profile-bd-district"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">থানা / উপজেলা</label>
                    <Select
                      options={thanaOptions}
                      value={findOpt(thanaOptions, profile.bd_thana_id)}
                      onChange={onThanaChange}
                      styles={rsStyles}
                      placeholder="থানা নির্বাচন করুন"
                      isDisabled={!profile.bd_district_id}
                      instanceId="profile-bd-thana"
                    />
                  </div>
                </div>

                {/* Row 3: Union/Municipality/City Corp | Post Office */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{specificLabel}</label>
                    <Select
                      options={specificOptions}
                      value={specificValue}
                      onChange={onSpecificChange}
                      styles={rsStyles}
                      placeholder="নির্বাচন করুন"
                      isDisabled={
                        profile.address_type === 'Union'
                          ? !profile.bd_thana_id
                          : !profile.bd_district_id
                      }
                      instanceId="profile-bd-specific"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ডাকঘর</label>
                    <Select
                      options={postOfficeOptions}
                      value={findOpt(postOfficeOptions, profile.bd_post_office_id)}
                      onChange={(opt) => setAddr('bd_post_office_id', opt?.value ?? null)}
                      styles={rsStyles}
                      placeholder="ডাকঘর নির্বাচন করুন"
                      isDisabled={!profile.bd_district_id}
                      instanceId="profile-bd-post-office"
                    />
                  </div>
                </div>

                {/* Row 4: Ward */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ওয়ার্ড নং</label>
                    <Select
                      options={wardOptions}
                      value={findOpt(wardOptions, profile.bd_ward)}
                      onChange={(opt) => setAddr('bd_ward', opt?.value ?? null)}
                      styles={rsStyles}
                      placeholder="ওয়ার্ড নির্বাচন করুন"
                      isDisabled={!addressData}
                      instanceId="profile-bd-ward"
                    />
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

      {/* Phone Verification */}
      <Section title="Phone Verification">
        <PhoneVerification
          phone={currentUser.phone}
          verifiedAt={currentUser.phone_verified_at ?? null}
          onVerified={(u) => dispatch(setUser(u as Parameters<typeof setUser>[0]))}
        />
      </Section>

      {/* Referral */}
      <Section title="Referral Program">
        {loadingReferral ? (
          <div className="text-sm text-gray-400">Loading referral info…</div>
        ) : referralData ? (
          <div className="space-y-5">
            {/* Credits summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 rounded-lg py-3 px-2">
                <p className="text-2xl font-bold text-blue-700">{referralData.credits}</p>
                <p className="text-xs text-blue-500 mt-0.5">Your Credits</p>
              </div>
              <div className="bg-green-50 rounded-lg py-3 px-2">
                <p className="text-2xl font-bold text-green-700">{referralData.total_referred}</p>
                <p className="text-xs text-green-500 mt-0.5">Referred Users</p>
              </div>
              <div className="bg-purple-50 rounded-lg py-3 px-2">
                <p className="text-2xl font-bold text-purple-700">{referralData.total_credited}</p>
                <p className="text-xs text-purple-500 mt-0.5">Credited</p>
              </div>
            </div>

            {/* Referral link */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Referral Link</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralData.referral_url}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 focus:outline-none select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={copyReferralLink}
                  className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Share this link. You earn <span className="font-medium text-gray-600">10 credits</span> for each person who signs up and verifies their account.
                New users get <span className="font-medium text-gray-600">20 credits</span> on signup.
              </p>
            </div>

            {/* Referrals list */}
            {referralData.referrals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Referred Users</p>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                  {referralData.referrals.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-2.5 bg-white">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.phone}</p>
                      </div>
                      <div className="text-right">
                        {r.credited ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                            +10 credited
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Pending verification</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Failed to load referral data.</p>
        )}
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
