'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { DocumentPanel } from '@/components/documents/DocumentPanel';
import { useAppSelector } from '@/lib/store/hooks';

interface UserResult { id: number; name: string; email: string; role: string; }
interface Document { id: number; original_filename: string; file_size: number | null; mime_type: string | null; label: string | null; download_url: string; created_at: string; }

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

export default function EditDeedPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAppSelector((s) => s.user.currentUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ deed_number: '', title: '', description: '', notes: '', status: 'draft' });
  const [assignedUser, setAssignedUser] = useState<UserResult | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get(`/deeds/${id}`)
      .then((r) => {
        const d = r.data.data;
        setForm({ deed_number: d.deed_number ?? '', title: d.title, description: d.description ?? '', notes: d.notes ?? '', status: d.status });
        if (d.assigned_to) setAssignedUser(d.assigned_to);
        setDocuments(d.documents ?? []);
      })
      .catch(() => toast.error('Failed to load deed'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearching(true);
      api.get('/users/search', { params: { q: query } })
        .then((r) => setResults(r.data.data || r.data))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
  }, [query]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/deeds/${id}`, {
        deed_number: form.deed_number || null,
        title: form.title,
        description: form.description || null,
        notes: form.notes || null,
        status: form.status,
        assigned_to: assignedUser?.id ?? null,
      });
      toast.success('Deed updated');
      // After reassigning, the current user may have lost access to this deed.
      // Redirect to deed list instead of the detail page in that case.
      const updated = res.data.data;
      const stillHasAccess =
        currentUser?.role === 'admin' ||
        updated?.created_by?.id === currentUser?.id ||
        updated?.assigned_to?.id === currentUser?.id;
      router.push(stillHasAccess ? `/deeds/${id}` : '/deeds');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/deeds/${id}`} className="text-gray-500 hover:text-gray-700 text-sm cursor-pointer">← Deed</Link>
        <h2 className="text-2xl font-bold text-gray-900">Edit Deed</h2>
      </div>

      {/* Deed details form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deed Number</label>
          <input type="text" value={form.deed_number} onChange={(e) => set('deed_number', e.target.value)} className={inputCls} placeholder="e.g. DN-2024-00123 (from registered office)" />
          <p className="text-xs text-gray-400 mt-1">Assigned by the registered office. Leave blank if not yet available.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} required className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className={`${inputCls} cursor-pointer`}>
            <option value="draft">Draft</option>
            <option value="under_review">Under Review</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
          {assignedUser ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <div>
                <span className="text-sm font-medium text-gray-900">{assignedUser.name}</span>
                <span className="text-xs text-gray-500 ml-2">{assignedUser.email}</span>
                <span className="text-xs text-blue-600 ml-2 capitalize">{assignedUser.role.replace('_', ' ')}</span>
              </div>
              <button type="button" onClick={() => { setAssignedUser(null); setQuery(''); }} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer">Remove</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search user to assign..." className={inputCls} />
              {(results.length > 0 || searching) && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                  {searching && <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>}
                  {results.map((u) => (
                    <button key={u.id} type="button" onClick={() => { setAssignedUser(u); setQuery(''); setResults([]); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">{u.role.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={inputCls} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors text-sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={`/deeds/${id}`} className="border border-gray-300 px-6 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
            Cancel
          </Link>
        </div>
      </form>

      {/* Document upload section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Documents</h3>
            <p className="text-xs text-gray-500 mt-0.5">{documents.length} file{documents.length !== 1 ? 's' : ''} attached</p>
          </div>
        </div>
        <div className="p-6">
          <DocumentPanel
            deedId={Number(id)}
            documents={documents}
            onChange={setDocuments}
          />
        </div>
      </div>
    </div>
  );
}
