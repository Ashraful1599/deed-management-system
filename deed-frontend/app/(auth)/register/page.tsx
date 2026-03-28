'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Select from 'react-select';
import { register, resendVerificationEmail } from '@/lib/auth';
import { toast } from 'react-toastify';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function validateBdPhone(local: string): string {
  if (!local) return 'Phone number is required.';
  if (!/^\d+$/.test(local)) return 'Only digits are allowed.';
  if (local.length !== 11) return 'Phone number must be 11 digits (e.g. 01XXXXXXXXX).';
  if (!/^01[3-9]\d{8}$/.test(local)) return 'Enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX).';
  return '';
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

function RegisterForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') ?? '';
  const [step, setStep] = useState<'form' | 'phone-otp' | 'phone-verified' | 'email-check'>('form');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [registeredPhone, setRegisteredPhone] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '+88',
    password: '',
    role: 'user' as 'user' | 'dolil_writer',
    registration_number: '',
    office_name: '',
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

  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [addressData, setAddressData] = useState<BdAddressData | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Load address JSON when dolil_writer is selected
  useEffect(() => {
    if (form.role !== 'dolil_writer' || addressData) return;
    fetch('/bangladesh_address_data.json')
      .then(r => r.json())
      .then(setAddressData)
      .catch(() => {});
  }, [form.role, addressData]);

  // Memoized option lists
  const divisionOptions = useMemo<SelectOption[]>(() =>
    (addressData?.divisions ?? []).map(d => ({ value: d.id, label: `${d.name_bn} (${d.name_en})` })),
    [addressData]);

  const districtOptions = useMemo<SelectOption[]>(() =>
    (addressData?.districts ?? [])
      .filter(d => d.division_id === form.bd_division_id)
      .map(d => ({ value: d.id, label: `${d.name_bn} (${d.name_en})` })),
    [addressData, form.bd_division_id]);

  const thanaOptions = useMemo<SelectOption[]>(() =>
    (addressData?.thanas ?? [])
      .filter(t => t.district_id === form.bd_district_id)
      .map(t => ({ value: t.id, label: `${t.name_bn} (${t.name_en})` })),
    [addressData, form.bd_district_id]);

  const unionOptions = useMemo<SelectOption[]>(() =>
    (addressData?.unions ?? [])
      .filter(u => u.thana_id === form.bd_thana_id)
      .map(u => ({ value: u.id, label: `${u.name_bn} (${u.name_en})` })),
    [addressData, form.bd_thana_id]);

  const postOfficeOptions = useMemo<SelectOption[]>(() =>
    (addressData?.postOffices ?? [])
      .filter(p => p.district_id === form.bd_district_id)
      .map(p => ({ value: p.id, label: `${p.name_bn} (${p.code}) ${p.name_en} (${p.code})` })),
    [addressData, form.bd_district_id]);

  const municipalityOptions = useMemo<SelectOption[]>(() =>
    (addressData?.municipalities ?? [])
      .filter(m => m.district_id === form.bd_district_id)
      .map(m => ({ value: m.id, label: `${m.name_bn} (${m.name_en})` })),
    [addressData, form.bd_district_id]);

  const cityCorporationOptions = useMemo<SelectOption[]>(() =>
    (addressData?.cityCorporations ?? [])
      .filter(c => c.district_id === form.bd_district_id)
      .map(c => ({ value: c.id, label: `${c.name_bn} (${c.name_en})` })),
    [addressData, form.bd_district_id]);

  const wardOptions = useMemo<SelectOption[]>(() =>
    (addressData?.wards ?? []).map(w => ({ value: w.value, label: `${w.label_bn} (${w.label_en})` })),
    [addressData]);

  // Helper to find a SelectOption by value
  function findOpt(opts: SelectOption[], val: string | null): SelectOption | null {
    return opts.find(o => o.value === val) ?? null;
  }

  // Cascade reset handlers
  function onAddressTypeChange(opt: SelectOption | null) {
    setForm(prev => ({
      ...prev,
      address_type: (opt?.value as AddressTypeValue) ?? 'Union',
      bd_district_id: null, bd_thana_id: null,
      bd_union_id: null, bd_municipality_id: null,
      bd_city_corporation_id: null, bd_post_office_id: null, bd_ward: null,
    }));
  }

  function onDivisionChange(opt: SelectOption | null) {
    setForm(prev => ({
      ...prev,
      bd_division_id: opt?.value ?? null,
      bd_district_id: null, bd_thana_id: null,
      bd_union_id: null, bd_municipality_id: null,
      bd_city_corporation_id: null, bd_post_office_id: null,
    }));
  }

  function onDistrictChange(opt: SelectOption | null) {
    setForm(prev => ({
      ...prev,
      bd_district_id: opt?.value ?? null,
      bd_thana_id: null, bd_union_id: null,
      bd_municipality_id: null, bd_city_corporation_id: null,
      bd_post_office_id: null,
    }));
  }

  function onThanaChange(opt: SelectOption | null) {
    setForm(prev => ({ ...prev, bd_thana_id: opt?.value ?? null, bd_union_id: null }));
  }

  function set(field: string, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function sendOtp(tok: string) {
    setOtpSending(true);
    try {
      await fetch(`${API}/phone/send-otp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tok}`, 'Accept': 'application/json' },
      });
    } catch {}
    setOtpSending(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const localPhone = form.phone.replace(/^\+88/, '');
    const err = validateBdPhone(localPhone);
    if (err) { setPhoneError(err); return; }
    setLoading(true);
    try {
      const payload: Parameters<typeof register>[0] = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        avatarFile: avatarFile ?? undefined,
        ...(refCode ? { referral_code: refCode } : {}),
      };
      if (form.role === 'dolil_writer') {
        payload.registration_number = form.registration_number;
        payload.office_name = form.office_name;
        // New cascading address fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = payload as any;
        p.address_type = form.address_type;
        p.bd_division_id = form.bd_division_id;
        p.bd_district_id = form.bd_district_id;
        p.bd_thana_id = form.bd_thana_id;
        p.bd_union_id = form.bd_union_id;
        p.bd_municipality_id = form.bd_municipality_id;
        p.bd_city_corporation_id = form.bd_city_corporation_id;
        p.bd_post_office_id = form.bd_post_office_id;
        p.bd_ward = form.bd_ward;
      }
      const { token: tok } = await register(payload);
      setToken(tok);
      setRegisteredEmail(form.email);
      setRegisteredPhone(form.phone);
      setStep('phone-otp');
      await sendOtp(tok);
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

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setOtpVerifying(true);
    try {
      const res = await fetch(`${API}/phone/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ code: otp }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || 'Invalid OTP');
      } else {
        setStep('phone-verified');
      }
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setOtpVerifying(false);
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

  // Phone verified step
  if (step === 'phone-verified') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow p-8 w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Phone Verified!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your phone number has been verified. You can sign in now.
            You can also verify your email from your profile settings.
          </p>
          <Link href="/login" className="block w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 text-center mb-3">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Phone OTP step
  if (step === 'phone-otp') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow p-8 w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verify your phone</h2>
          <p className="text-sm text-gray-500 mb-1">We sent a 4-digit OTP to</p>
          <p className="text-sm font-semibold text-gray-800 mb-6">{registeredPhone}</p>

          {otpSending ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Sending OTP…
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="w-40 mx-auto block border border-gray-300 rounded-lg px-3 py-2.5 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={otp.length !== 4 || otpVerifying}
                className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {otpVerifying ? 'Verifying…' : 'Verify Phone'}
              </button>
              <button
                type="button"
                onClick={() => token && sendOtp(token)}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Resend OTP
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => setStep('email-check')}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600"
          >
            Skip for now →
          </button>
        </div>
      </div>
    );
  }

  // Email check step
  if (step === 'email-check') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow p-8 w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 mb-1">We sent a verification link to</p>
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

  // Address type-specific row 3 field label & options
  const addressTypeOptions: SelectOption[] = [
    { value: 'Union', label: 'ইউনিয়ন (Union)' },
    { value: 'Municipality', label: 'পৌরসভা (Municipality)' },
    { value: 'City Corporation', label: 'সিটি কর্পোরেশন (City Corporation)' },
  ];

  const thanaLabel = form.address_type === 'City Corporation' ? 'থানা / উপজেলা *' : 'থানা / উপজেলা *';

  let specificLabel = 'ইউনিয়ন *';
  let specificOptions: SelectOption[] = unionOptions;
  let specificValue: SelectOption | null = findOpt(unionOptions, form.bd_union_id);
  function onSpecificChange(opt: SelectOption | null) {
    if (form.address_type === 'Union') set('bd_union_id', opt?.value ?? null);
    else if (form.address_type === 'Municipality') set('bd_municipality_id', opt?.value ?? null);
    else set('bd_city_corporation_id', opt?.value ?? null);
  }
  if (form.address_type === 'Municipality') {
    specificLabel = 'পৌরসভা *';
    specificOptions = municipalityOptions;
    specificValue = findOpt(municipalityOptions, form.bd_municipality_id);
  } else if (form.address_type === 'City Corporation') {
    specificLabel = 'সিটি কর্পোরেশন *';
    specificOptions = cityCorporationOptions;
    specificValue = findOpt(cityCorporationOptions, form.bd_city_corporation_id);
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-lg shadow p-8 w-full">
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
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500 text-sm select-none">+88</span>
                <input
                  type="tel"
                  value={form.phone.replace(/^\+88/, '')}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                    set('phone', '+88' + digits);
                    setPhoneError(validateBdPhone(digits));
                  }}
                  onBlur={(e) => setPhoneError(validateBdPhone(e.target.value.replace(/\D/g, '')))}
                  required
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                  className={`${inputCls} rounded-l-none ${phoneError ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
              </div>
              {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
                minLength={8}
                className={`${inputCls} pr-10`}
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

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${form.role === 'user' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="role" value="user" checked={form.role === 'user'} onChange={() => set('role', 'user')} className="sr-only" />
                <div className="font-medium text-sm text-gray-900">Regular User</div>
                <div className="text-xs text-gray-500 mt-1">Create and track dolils</div>
              </label>
              <label className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${form.role === 'dolil_writer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="role" value="dolil_writer" checked={form.role === 'dolil_writer'} onChange={() => set('role', 'dolil_writer')} className="sr-only" />
                <div className="font-medium text-sm text-gray-900">Dolil Writer</div>
                <div className="text-xs text-gray-500 mt-1">Licensed professional</div>
              </label>
            </div>
          </div>

          {/* Dolil Writer extra fields */}
          {form.role === 'dolil_writer' && (
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

              <p className="text-sm font-medium text-blue-800 pt-1">ঠিকানা (Address)</p>

              {/* Row 1: ঠিকানার ধরন | বিভাগ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ঠিকানার ধরন *</label>
                  <Select
                    options={addressTypeOptions}
                    value={findOpt(addressTypeOptions, form.address_type)}
                    onChange={onAddressTypeChange}
                    styles={rsStyles}
                    placeholder="ধরন নির্বাচন করুন"
                    isSearchable={false}
                    instanceId="address-type"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">বিভাগ *</label>
                  <Select
                    options={divisionOptions}
                    value={findOpt(divisionOptions, form.bd_division_id)}
                    onChange={onDivisionChange}
                    styles={rsStyles}
                    placeholder="বিভাগ নির্বাচন করুন"
                    isLoading={!addressData && form.role === 'dolil_writer'}
                    instanceId="bd-division"
                  />
                </div>
              </div>

              {/* Row 2: জেলা | থানা/উপজেলা */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">জেলা *</label>
                  <Select
                    options={districtOptions}
                    value={findOpt(districtOptions, form.bd_district_id)}
                    onChange={onDistrictChange}
                    styles={rsStyles}
                    placeholder="জেলা নির্বাচন করুন"
                    isDisabled={!form.bd_division_id}
                    instanceId="bd-district"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{thanaLabel}</label>
                  <Select
                    options={thanaOptions}
                    value={findOpt(thanaOptions, form.bd_thana_id)}
                    onChange={onThanaChange}
                    styles={rsStyles}
                    placeholder="থানা নির্বাচন করুন"
                    isDisabled={!form.bd_district_id}
                    instanceId="bd-thana"
                  />
                </div>
              </div>

              {/* Row 3: ইউনিয়ন/পৌরসভা/সিটি কর্পোরেশন | ডাকঘর */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{specificLabel}</label>
                  <Select
                    options={specificOptions}
                    value={specificValue}
                    onChange={onSpecificChange}
                    styles={rsStyles}
                    placeholder="নির্বাচন করুন"
                    isDisabled={
                      form.address_type === 'Union'
                        ? !form.bd_thana_id
                        : !form.bd_district_id
                    }
                    instanceId="bd-specific"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ডাকঘর *</label>
                  <Select
                    options={postOfficeOptions}
                    value={findOpt(postOfficeOptions, form.bd_post_office_id)}
                    onChange={(opt) => set('bd_post_office_id', opt?.value ?? null)}
                    styles={rsStyles}
                    placeholder="ডাকঘর নির্বাচন করুন"
                    isDisabled={!form.bd_district_id}
                    instanceId="bd-post-office"
                  />
                </div>
              </div>

              {/* Row 4: ওয়ার্ড নং */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ওয়ার্ড নং *</label>
                  <Select
                    options={wardOptions}
                    value={findOpt(wardOptions, form.bd_ward)}
                    onChange={(opt) => set('bd_ward', opt?.value ?? null)}
                    styles={rsStyles}
                    placeholder="ওয়ার্ড নির্বাচন করুন"
                    isDisabled={!addressData}
                    instanceId="bd-ward"
                  />
                </div>
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

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
      <PublicFooter />
    </div>
  );
}
