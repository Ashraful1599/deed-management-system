'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'react-toastify';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  registration_number: string | null;
  office_name: string | null;
  district: string | null;
  created_at: string;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  deed_writer: 'bg-purple-100 text-purple-700',
  user: 'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ role: string; status: string }>({ role: '', status: '' });

  const load = useCallback((s: string, r: string, st: string) => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (s) params.search = s;
    if (r) params.role = r;
    if (st) params.status = st;
    api.get('/admin/users', { params })
      .then((res) => setUsers(res.data.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load('', '', ''); }, []);

  function startEdit(user: User) {
    setEditingId(user.id);
    setEditData({ role: user.role, status: user.status });
  }

  async function saveEdit(userId: number) {
    try {
      await api.put(`/admin/users/${userId}`, editData);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...editData } : u));
      setEditingId(null);
      toast.success('User updated');
    } catch {
      toast.error('Update failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-3 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search, roleFilter, statusFilter)}
          className="flex-1 min-w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); load(search, e.target.value, statusFilter); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="deed_writer">Deed Writer</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); load(search, roleFilter, e.target.value); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
        <button
          onClick={() => load(search, roleFilter, statusFilter)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Office</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <select
                        value={editData.role}
                        onChange={(e) => setEditData((prev) => ({ ...prev, role: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="user">User</option>
                        <option value="deed_writer">Deed Writer</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs capitalize font-medium ${roleColors[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData((prev) => ({ ...prev, status: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending">Pending</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs capitalize font-medium ${statusColors[user.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {user.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{user.office_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(user.id)} className="text-xs text-green-600 hover:underline font-medium">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(user)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
