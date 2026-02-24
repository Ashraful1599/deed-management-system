import Cookies from 'js-cookie';
import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'user' | 'deed_writer' | 'admin';
  status: 'active' | 'suspended';
  registration_number: string | null;
  office_name: string | null;
  district: string | null;
  avatar: string | null;
  created_at: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'deed_writer';
  registration_number?: string;
  office_name?: string;
  district?: string;
}

export async function login(loginField: string, password: string): Promise<{ user: User; token: string }> {
  const res = await api.post('/login', { login: loginField, password });
  const { user, token } = res.data;
  localStorage.setItem('deed_token', token);
  Cookies.set('deed_token', token, { expires: 7 });
  return { user, token };
}

export async function register(data: RegisterData): Promise<{ user: User; token: string }> {
  const res = await api.post('/register', data);
  const { user, token } = res.data;
  localStorage.setItem('deed_token', token);
  Cookies.set('deed_token', token, { expires: 7 });
  return { user, token };
}

export function logout() {
  api.post('/logout').catch(() => {});
  localStorage.removeItem('deed_token');
  Cookies.remove('deed_token');
  window.location.href = '/login';
}

export function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('deed_token') : null;
}
