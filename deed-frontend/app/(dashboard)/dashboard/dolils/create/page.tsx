'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { DocumentPanel } from '@/components/documents/DocumentPanel';

interface UserResult { id: number; name: string; email: string; phone: string | null; role: string; }
interface Document { id: number; original_filename: string; file_size: number | null; mime_type: string | null; label: string | null; download_url: string; created_at: string; }

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

export default function CreateDolilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdDolil, setCreatedDolil] = useState<{ id: number; title: string } | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [form, setForm] = useState({ deed_number: '', title: '', description: '', notes: '', status: 'draft', agreement_amount: '', payment_status: 'pending' });

  // User search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        deed_number: form.deed_number || undefined,
        title: form.title,
        description: form.description || undefined,
        notes: form.notes || undefined,
        status: form.status,
        agreement_amount: form.agreement_amount ? Number(form.agreement_amount) : undefined,
        payment_status: form.payment_status,
      };
      if (selectedUser) payload.assigned_to = selectedUser.id;
      const res = await api.post('/dolils', payload);
      const dolil = res.data.data;
      toast.success('Dolil created — you can now upload documents');
      setCreatedDolil({ id: dolil.id, title: dolil.title });
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string } } })?.response?.data;
      toast.error(errData?.message || 'Failed to create dolil');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: document upload ────────────────────────────────────────────────
  if (createdDolil) {
    return (
      <div className="max-w-2xl space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
            <span className="text-gray-500">Dolil details</span>
          </div>
          <div className="flex-1 h-px bg-blue-200" />
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
            <span className="font-medium text-gray-900">Upload documents</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Documents for "{createdDolil.title}"</h3>
            <p className="text-xs text-gray-500 mt-0.5">Upload any supporting files. You can also do this later.</p>
          </div>
          <div className="p-6">
            <DocumentPanel
              dolilId={createdDolil.id}
              documents={documents}
              onChange={setDocuments}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/dashboard/dolils/${createdDolil.id}`)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer transition-colors"
          >
            {documents.length > 0 ? 'Done — View Dolil' : 'Skip & View Dolil'}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: dolil details form ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
          <span className="font-medium text-gray-900">Dolil details</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">2</div>
          <span className="text-gray-400">Upload documents</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/dashboard/dolils" className="text-gray-500 hover:text-gray-700 text-sm cursor-pointer">← Dolils</Link>
        <h2 className="text-2xl font-bold text-gray-900">New Dolil</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dolil Number</label>
          <input type="text" value={form.deed_number} onChange={(e) => set('deed_number', e.target.value)} className={inputCls} placeholder="e.g. DN-2024-00123 (from registered office)" />
          <p className="text-xs text-gray-400 mt-1">Assigned by the registered office. Leave blank if not yet available.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} required className={inputCls} placeholder="e.g. Property Transfer Agreement" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={inputCls} placeholder="Brief description of this dolil..." />
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
          {selectedUser ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <div>
                <span className="text-sm font-medium text-gray-900">{selectedUser.name}</span>
                <span className="text-xs text-gray-500 ml-2">{selectedUser.email}</span>
                <span className="text-xs text-blue-600 ml-2 capitalize">{selectedUser.role.replace('_', ' ')}</span>
              </div>
              <button type="button" onClick={() => { setSelectedUser(null); setQuery(''); }} className="text-gray-400 hover:text-red-500 text-xs cursor-pointer">Remove</button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email, or phone..." className={inputCls} />
              {(results.length > 0 || searching) && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                  {searching && <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>}
                  {results.map((u) => (
                    <button key={u.id} type="button" onClick={() => { setSelectedUser(u); setQuery(''); setResults([]); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">{u.role.replace('_', ' ')}</span>
                    </button>
                  ))}
                  {!searching && results.length === 0 && query.length >= 2 && (
                    <div className="px-3 py-2 text-sm text-gray-400">No users found</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={inputCls} placeholder="Internal notes..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Amount (৳)</label>
            <input type="number" min="0" step="0.01" value={form.agreement_amount} onChange={(e) => set('agreement_amount', e.target.value)} className={inputCls} placeholder="e.g. 50000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select value={form.payment_status} onChange={(e) => set('payment_status', e.target.value)} className={`${inputCls} cursor-pointer`}>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors text-sm">
            {loading ? 'Creating...' : 'Continue →'}
          </button>
          <Link href="/dashboard/dolils" className="border border-gray-300 px-6 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
