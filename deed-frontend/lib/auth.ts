import Cookies from 'js-cookie';
import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'user' | 'dolil_writer' | 'admin';
  status: 'active' | 'suspended';
  registration_number: string | null;
  office_name: string | null;
  district: string | null;
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  division_name: string | null;
  district_name: string | null;
  upazila_name: string | null;
  address_type: string | null;
  bd_union_id: string | null;
  bd_municipality_id: string | null;
  bd_city_corporation_id: string | null;
  bd_post_office_id: string | null;
  bd_ward: string | null;
  avatar: string | null;
  phone_verified_at: string | null;
  created_at: string;
  referral_code: string | null;
  credits: number;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'dolil_writer';
  registration_number?: string;
  office_name?: string;
  district?: string;
  division_id?: number | null;
  district_id?: number | null;
  upazila_id?: number | null;
  referral_code?: string;
}

export async function login(loginField: string, password: string): Promise<{ user: User; token: string }> {
  const res = await api.post('/login', { login: loginField, password });
  const { user, token } = res.data;
  localStorage.setItem('dolil_token', token);
  Cookies.set('dolil_token', token, { expires: 7 });
  return { user, token };
}

export async function resendVerificationEmail(token: string): Promise<void> {
  await api.post('/email/verify/resend', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function register(data: RegisterData & { avatarFile?: File }): Promise<{ user: User; token: string }> {
  let body: FormData | RegisterData;
  if (data.avatarFile) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (k !== 'avatarFile' && v != null) fd.append(k, v as string);
    });
    fd.append('avatar', data.avatarFile);
    body = fd;
  } else {
    const { avatarFile: _, ...rest } = data;
    body = rest;
  }
  const res = await api.post('/register', body);
  const { user, token } = res.data;
  // Do NOT store the token — user must verify email and log in before accessing the app
  return { user, token };
}

export function logout() {
  api.post('/logout').catch(() => {});
  localStorage.removeItem('dolil_token');
  Cookies.remove('dolil_token');
  window.location.href = '/login';
}

export function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('dolil_token') : null;
}
