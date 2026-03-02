'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { fmtDate, fmtDateTime } from '@/lib/date';
import { toast } from 'react-toastify';
import { IconPaperclip, IconTrash, IconSend } from '@/components/ui/Icons';
import { useAppSelector } from '@/lib/store/hooks';
import { DocumentPanel } from '@/components/documents/DocumentPanel';
import { showConfirm } from '@/lib/confirm';

interface UserResult { id: number; name: string; email: string; phone: string | null; role: string; }
interface User { id: number; name: string; email: string; role: string; }
interface Document { id: number; original_filename: string; file_size: number | null; mime_type: string | null; label: string | null; download_url: string; created_at: string; }
interface Comment {
  id: number;
  user: User | null;
  body: string;
  has_attachment: boolean;
  attachment_name: string | null;
  attachment_mime: string | null;
  download_url: string | null;
  created_at: string;
}
interface Review {
  id: number;
  reviewer: User;
  rating: number;
  body: string | null;
  created_at: string;
  updated_at: string;
}
interface Payment {
  id: number;
  amount: string;
  paid_at: string;
  notes: string | null;
  recorded_by: { id: number; name: string } | null;
  created_at: string;
}
interface Dolil {
  id: number;
  deed_number: string | null;
  title: string;
  description: string | null;
  status: string;
  notes: string | null;
  created_by: User | null;
  assigned_to: User | null;
  documents: Document[];
  agreement_amount: string | null;
  payment_status: string;
  amount_paid: number | null;
  created_at: string;
  updated_at: string;
}

const inCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

const statusColors: Record<string, string> = {
  draft:        'bg-gray-100 text-gray-700',
  under_review: 'bg-yellow-100 text-yellow-800',
  completed:    'bg-blue-100 text-blue-800',
  archived:     'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  draft:        'Draft',
  under_review: 'Under Review',
  completed:    'Completed',
  archived:     'Archived',
};

const paymentStatusLabels: Record<string, string> = {
  pending:   'Pending',
  partial:   'Partial',
  completed: 'Completed',
  overdue:   'Overdue',
};

const paymentStatusColors: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-700',
  partial:   'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  overdue:   'bg-red-100 text-red-800',
};

const ALL_STATUSES = ['draft', 'under_review', 'completed', 'archived'];

const TRANSITIONS: Record<string, string[]> = {
  draft:        ['under_review'],
  under_review: ['completed', 'draft'],
  completed:    ['archived'],
  archived:     ['completed'],
};

// Activity dot color per action type
const actionDotColor: Record<string, string> = {
  dolil_created:      'bg-emerald-500',
  dolil_assigned:     'bg-indigo-500',
  status_changed:    'bg-amber-500',
  comment_added:     'bg-blue-500',
  file_attached:     'bg-blue-400',
  document_uploaded: 'bg-violet-500',
  document_deleted:  'bg-red-400',
  payment_recorded:  'bg-emerald-600',
  payment_updated:   'bg-emerald-400',
  payment_deleted:   'bg-red-400',
};

function getAllowedTransitions(status: string, user: { id: number; role: string } | null, dolil: { created_by?: { id: number } | null; assigned_to?: { id: number } | null } | null): string[] {
  if (!user || !dolil) return [];
  if (user.role === 'admin' || user.role === 'dolil_writer') return ALL_STATUSES.filter(s => s !== status);
  const all = TRANSITIONS[status] ?? [];
  if (dolil.created_by?.id === user.id) return all.filter(s => s === 'under_review');
  return [];
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

// ── Star components ───────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} onClick={() => onChange(n)}
          className={`text-2xl leading-none cursor-pointer transition-colors ${n <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`text-base ${n <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-3 w-16 bg-gray-200 rounded mb-3" />
        <div className="h-7 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-32 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-2 w-full bg-gray-100 rounded-full" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-4/5 bg-gray-100 rounded" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200" style={{ minHeight: 320 }}>
            <div className="p-5 border-b border-gray-100">
              <div className="h-4 w-28 bg-gray-200 rounded" />
            </div>
            <div className="p-5 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                    <div className="h-8 w-3/4 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DolilDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAppSelector((s) => s.user.currentUser);

  const [dolil, setDolil] = useState<Dolil | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  // Inline edit — Details card
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ deed_number: '', title: '', status: 'draft', agreement_amount: '', payment_status: 'pending' });

  // Inline edit — Description & Notes card
  const [editNotesMode, setEditNotesMode] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [editNotesForm, setEditNotesForm] = useState({ description: '', notes: '' });
  const [editAssignedUser, setEditAssignedUser] = useState<UserResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Activity timeline
  const [activities, setActivities] = useState<{ id: number; action: string; description: string; meta: Record<string, unknown> | null; actor: { id: number; name: string } | null; created_at: string }[]>([]);

  // Payment state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paid_at: '', notes: '' });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', paid_at: '', notes: '' });
  const [savingPayment, setSavingPayment] = useState(false);

  const allowedTransitions = getAllowedTransitions(dolil?.status ?? "", currentUser, dolil);

  const canEdit = currentUser && dolil && (
    currentUser.role === 'admin' ||
    currentUser.role === 'dolil_writer' ||
    dolil.created_by?.id === currentUser.id ||
    dolil.assigned_to?.id === currentUser.id
  );

  const canRecordPayment = currentUser && dolil && (
    currentUser.role === 'admin' ||
    dolil.assigned_to?.id === currentUser.id ||
    (dolil.created_by?.id === currentUser.id && currentUser.role === 'dolil_writer')
  );

  const isCompletedOrRecorded = dolil && ['completed', 'archived'].includes(dolil.status);
  const canReview =
    isCompletedOrRecorded &&
    currentUser &&
    ['admin', 'user'].includes(currentUser.role) &&
    currentUser.id !== dolil?.assigned_to?.id;
  const myReview = reviews.find((r) => r.reviewer.id === currentUser?.id);

  // User search for inline edit
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearching(true);
      api.get('/users/search', { params: { q: searchQuery } })
        .then((r) => setSearchResults(r.data.data || r.data))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
  }, [searchQuery]);

  function loadDolil() {
    api.get(`/dolils/${id}`)
      .then((r) => { setDolil(r.data.data); setDocuments(r.data.data.documents || []); })
      .catch((err) => {
        if (err?.response?.status === 403) { toast.info("You no longer have access to this dolil."); router.push('/dashboard/dolils'); }
        else toast.error("Failed to load dolil");
      });
  }

  function loadComments()    { api.get(`/dolils/${id}/comments`).then((r) => setComments(r.data.data || r.data)).catch(() => {}); }
  function loadReviews()     { api.get(`/dolils/${id}/reviews`).then((r) => setReviews(r.data.data || [])).catch(() => {}); }
  function loadActivities()  { api.get(`/dolils/${id}/activities`).then((r) => setActivities(r.data)).catch(() => {}); }
  function loadPayments()    { api.get(`/dolils/${id}/payments`).then((r) => setPayments(r.data.data ?? r.data)).catch(() => {}); }

  useEffect(() => { loadDolil(); loadComments(); loadReviews(); loadActivities(); loadPayments(); }, [id]);

  // ── Inline dolil edit ───────────────────────────────────────────────────────
  function startEdit() {
    if (!dolil) return;
    setEditForm({
      deed_number:      dolil.deed_number ?? '',
      title:            dolil.title,
      status:           dolil.status,
      agreement_amount: dolil.agreement_amount != null ? String(dolil.agreement_amount) : '',
      payment_status:   dolil.payment_status ?? 'pending',
    });
    setEditAssignedUser(dolil.assigned_to ? { ...dolil.assigned_to, phone: null } : null);
    setSearchQuery('');
    setSearchResults([]);
    setEditMode(true);
  }

  function cancelEdit() { setEditMode(false); setSearchQuery(''); setSearchResults([]); }

  function startEditNotes() {
    if (!dolil) return;
    setEditNotesForm({ description: dolil.description ?? '', notes: dolil.notes ?? '' });
    setEditNotesMode(true);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const res = await api.put(`/dolils/${id}`, {
        description: editNotesForm.description || null,
        notes:       editNotesForm.notes || null,
      });
      setDolil(res.data.data);
      setEditNotesMode(false);
      toast.success('Saved');
      loadActivities();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save');
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await api.put(`/dolils/${id}`, {
        deed_number:      editForm.deed_number || null,
        title:            editForm.title,
        status:           editForm.status,
        assigned_to:      editAssignedUser?.id ?? null,
        agreement_amount: editForm.agreement_amount ? Number(editForm.agreement_amount) : null,
        payment_status:   editForm.payment_status,
      });
      const updated = res.data.data;
      const stillHasAccess =
        currentUser?.role === 'admin' ||
        updated?.created_by?.id === currentUser?.id ||
        updated?.assigned_to?.id === currentUser?.id;
      if (!stillHasAccess) { router.push('/dashboard/dolils'); return; }
      setDolil(updated);
      setEditMode(false);
      setSearchQuery('');
      toast.success('Dolil updated');
      loadActivities();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to update dolil");
    } finally {
      setSaving(false);
    }
  }

  // ── Status quick-change ────────────────────────────────────────────────────
  async function handleStatusChange(newStatus: string) {
    if (!dolil || newStatus === dolil.status) return;
    setChangingStatus(true);
    try {
      const res = await api.put(`/dolils/${id}`, { status: newStatus });
      setDolil(res.data.data);
      toast.success(`Status changed to ${statusLabels[newStatus] ?? newStatus}`);
      loadActivities();
    } catch { toast.error('Failed to change status'); }
    finally { setChangingStatus(false); }
  }

  // ── Reviews ────────────────────────────────────────────────────────────────
  function startEditReview(review: Review) { setEditingReview(review); setReviewRating(review.rating); setReviewBody(review.body ?? ''); }
  function cancelEditReview() { setEditingReview(null); setReviewRating(0); setReviewBody(''); }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewRating) return;
    const req = editingReview
      ? api.put(`/reviews/${editingReview.id}`, { rating: reviewRating, body: reviewBody })
      : api.post(`/dolils/${id}/reviews`, { rating: reviewRating, body: reviewBody });
    await toast.promise(
      req.then((res) => {
        const updated: Review = res.data.data ?? res.data;
        setReviews((prev) => editingReview ? prev.map((r) => (r.id === editingReview.id ? updated : r)) : [...prev, updated]);
        setEditingReview(null); setReviewRating(0); setReviewBody('');
      }),
      { pending: 'Saving review...', success: 'Review saved',
        error: { render: ({ data }: { data: unknown }) => (data as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save review' } }
    );
  }

  // ── Comments ───────────────────────────────────────────────────────────────
  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim() && !commentFile) return;
    setSubmittingComment(true);
    try {
      const formData = new FormData();
      if (commentBody) formData.append('body', commentBody);
      if (commentFile) formData.append('attachment', commentFile);
      const res = await api.post(`/dolils/${id}/comments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setComments((prev) => [...prev, res.data.data]);
      setCommentBody(''); setCommentFile(null);
      loadActivities();
    } catch { toast.error('Failed to post comment'); }
    finally { setSubmittingComment(false); }
  }

  async function handleDeleteComment(commentId: number) {
    if (!await showConfirm('This comment will be permanently removed.', { title: 'Delete comment?' })) return;
    try { await api.delete(`/comments/${commentId}`); setComments((prev) => prev.filter((c) => c.id !== commentId)); }
    catch { toast.error('Failed to delete comment'); }
  }

  // ── Payments ───────────────────────────────────────────────────────────────
  function startEditPayment(p: Payment) { setEditingPayment(p); setEditPaymentForm({ amount: String(p.amount), paid_at: p.paid_at, notes: p.notes ?? '' }); }

  async function handleUpdatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPayment) return;
    setSavingPayment(true);
    try {
      await api.put(`/payments/${editingPayment.id}`, { amount: Number(editPaymentForm.amount), paid_at: editPaymentForm.paid_at, notes: editPaymentForm.notes || null });
      toast.success('Payment updated'); setEditingPayment(null);
      loadPayments(); loadDolil(); loadActivities();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update payment');
    } finally { setSavingPayment(false); }
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      await api.post(`/dolils/${id}/payments`, { amount: Number(paymentForm.amount), paid_at: paymentForm.paid_at, notes: paymentForm.notes || null });
      toast.success('Payment recorded');
      setPaymentForm({ amount: '', paid_at: new Date().toISOString().split('T')[0], notes: '' }); setAddingPayment(false);
      loadPayments(); loadDolil(); loadActivities();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to record payment');
    } finally { setSubmittingPayment(false); }
  }

  async function handleDeletePayment(paymentId: number) {
    if (!await showConfirm('This payment record will be permanently removed.', { title: 'Delete payment?' })) return;
    try { await api.delete(`/payments/${paymentId}`); toast.success('Payment deleted'); loadPayments(); loadDolil(); loadActivities(); }
    catch { toast.error('Failed to delete payment'); }
  }

  if (!dolil) return <LoadingSkeleton />;

  const editableStatuses = (currentUser?.role === 'admin' || currentUser?.role === 'dolil_writer')
    ? ALL_STATUSES
    : [dolil.status, ...(TRANSITIONS[dolil.status] ?? []).filter(s => dolil.created_by?.id === currentUser?.id ? s === 'under_review' : false)];

  const agreementAmt = dolil.agreement_amount != null ? Number(dolil.agreement_amount) : null;
  const paidAmt      = dolil.amount_paid ?? 0;
  const dueAmt       = agreementAmt != null ? agreementAmt - paidAmt : null;
  const paidPct      = agreementAmt ? Math.min(100, Math.round((paidAmt / agreementAmt) * 100)) : 0;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <div className="mb-2">
          <Link href="/dashboard/dolils" className="text-gray-500 hover:text-gray-700 text-sm">← Dolils</Link>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-gray-900">{dolil.title}</h2>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[dolil.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {statusLabels[dolil.status] ?? dolil.status}
          </span>
        </div>
        {dolil.deed_number && (
          <p className="text-sm text-gray-400 font-mono mt-0.5">{dolil.deed_number}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Details card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{editMode ? 'Edit Details' : 'Details'}</h3>
              {!editMode && canEdit && (
                <button onClick={startEdit} className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer">Edit</button>
              )}
              {editMode && (
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancelEdit}
                    className="border border-gray-300 px-3 py-1 rounded-lg text-xs hover:bg-gray-50 cursor-pointer transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {editMode ? (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={editForm.title}
                    onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                    className={inCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dolil Number</label>
                  <input type="text" value={editForm.deed_number}
                    onChange={(e) => setEditForm((p) => ({ ...p, deed_number: e.target.value }))}
                    className={inCls} placeholder="e.g. DN-2024-00123" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                    className={`${inCls} cursor-pointer`}>
                    {editableStatuses.map((s) => (
                      <option key={s} value={s}>{statusLabels[s] ?? s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
                  {editAssignedUser ? (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={editAssignedUser.name} />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{editAssignedUser.name}</span>
                          <span className="text-xs text-gray-500 ml-2">{editAssignedUser.email}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setEditAssignedUser(null); setSearchQuery(''); }}
                        className="text-xs text-gray-400 hover:text-red-500 cursor-pointer">Remove</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="text" value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email or phone..."
                        className={inCls} />
                      {(searchResults.length > 0 || searching) && (
                        <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-auto">
                          {searching && <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>}
                          {searchResults.map((u) => (
                            <button key={u.id} type="button"
                              onClick={() => { setEditAssignedUser(u); setSearchQuery(''); setSearchResults([]); }}
                              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Avatar name={u.name} />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                  <p className="text-xs text-gray-500">{u.email}</p>
                                </div>
                              </div>
                              <span className="text-xs text-gray-400 capitalize">{u.role.replace('_', ' ')}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Agreement Amount (৳)</label>
                    <input type="number" min="0" step="0.01" value={editForm.agreement_amount}
                      onChange={(e) => setEditForm((p) => ({ ...p, agreement_amount: e.target.value }))}
                      className={inCls} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                    <select value={editForm.payment_status}
                      onChange={(e) => setEditForm((p) => ({ ...p, payment_status: e.target.value }))}
                      className={`${inCls} cursor-pointer`}>
                      {Object.entries(paymentStatusLabels).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Id</span>
                    <span className="font-medium text-gray-900 font-mono">#{dolil.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[dolil.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {statusLabels[dolil.status] ?? dolil.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dolil No.</span>
                    <span className="font-medium text-gray-900 font-mono">{dolil.deed_number ?? <span className="text-gray-400 italic text-xs not-italic font-sans">—</span>}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Created by</span>
                    {dolil.created_by ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={dolil.created_by.name} />
                        <span className="font-medium text-gray-900">{dolil.created_by.name}</span>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Assigned to</span>
                    {dolil.assigned_to ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={dolil.assigned_to.name} />
                        <span className="font-medium text-gray-900">{dolil.assigned_to.name}</span>
                      </div>
                    ) : <span className="text-gray-400 italic text-xs">Unassigned</span>}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-700">{fmtDate(dolil.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated</span>
                    <span className="text-gray-700">{fmtDate(dolil.updated_at)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description & Notes */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Description & Notes</h3>
              {!editNotesMode && canEdit && (
                <button onClick={startEditNotes} className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer">Edit</button>
              )}
              {editNotesMode && (
                <div className="flex gap-2">
                  <button onClick={handleSaveNotes} disabled={savingNotes}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors">
                    {savingNotes ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditNotesMode(false)}
                    className="border border-gray-300 px-3 py-1 rounded-lg text-xs hover:bg-gray-50 cursor-pointer transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {editNotesMode ? (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea rows={4} value={editNotesForm.description}
                    onChange={(e) => setEditNotesForm((p) => ({ ...p, description: e.target.value }))}
                    className={inCls} placeholder="Brief description of this dolil..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea rows={3} value={editNotesForm.notes}
                    onChange={(e) => setEditNotesForm((p) => ({ ...p, notes: e.target.value }))}
                    className={inCls} placeholder="Internal notes..." />
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4 max-h-64 overflow-y-auto">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700">{dolil.description ?? <span className="text-gray-400 italic">—</span>}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{dolil.notes ?? <span className="text-gray-400 italic">—</span>}</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Payment</h3>
              {dolil.payment_status && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentStatusColors[dolil.payment_status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {paymentStatusLabels[dolil.payment_status] ?? dolil.payment_status}
                </span>
              )}
            </div>
            <div className="p-5 space-y-4">

              {/* Summary rows */}
              <div className="space-y-2 text-sm">
                {agreementAmt != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Agreement</span>
                    <span className="font-medium text-gray-900">৳{agreementAmt.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span className="font-medium text-green-700">৳{paidAmt.toLocaleString()}</span>
                </div>
                {dueAmt != null && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-500">Due</span>
                    <span className={`font-semibold ${dueAmt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ৳{dueAmt.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {agreementAmt != null && agreementAmt > 0 && (
                <div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${paidPct >= 100 ? 'bg-green-500' : paidPct > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{paidPct}% paid</p>
                </div>
              )}

              {/* Payment history */}
              {payments.length > 0 && (
                <div className="border-t pt-3 space-y-3">
                  {payments.map((p) => (
                    <div key={p.id}>
                      {editingPayment?.id === p.id ? (
                        <form onSubmit={handleUpdatePayment} className="space-y-2 bg-gray-50 rounded-lg p-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (৳)</label>
                              <input type="number" min="0.01" step="0.01" required value={editPaymentForm.amount}
                                onChange={(e) => setEditPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                              <input type="date" required value={editPaymentForm.paid_at}
                                onChange={(e) => setEditPaymentForm((prev) => ({ ...prev, paid_at: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                          </div>
                          <input type="text" value={editPaymentForm.notes}
                            onChange={(e) => setEditPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Notes (optional)"
                            className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <div className="flex gap-2">
                            <button type="submit" disabled={savingPayment}
                              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors">
                              {savingPayment ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setEditingPayment(null)}
                              className="border border-gray-300 px-3 py-1 rounded-lg text-xs hover:bg-gray-100 cursor-pointer transition-colors">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-start justify-between gap-2 text-sm">
                          <div>
                            <p className="font-medium text-gray-800">৳{Number(p.amount).toLocaleString()} <span className="text-gray-400 font-normal">— {fmtDate(p.paid_at)}</span></p>
                            {p.notes && <p className="text-xs text-gray-500 mt-0.5">{p.notes}</p>}
                            {p.recorded_by && <p className="text-xs text-gray-400">By {p.recorded_by.name}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {canRecordPayment && (
                              <button type="button" onClick={() => startEditPayment(p)}
                                className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer">Edit</button>
                            )}
                            {currentUser?.role === 'admin' && (
                              <button type="button" onClick={() => handleDeletePayment(p.id)}
                                className="text-gray-300 hover:text-red-500 cursor-pointer"><IconTrash /></button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {payments.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No payments recorded yet.</p>
              )}

              {/* Record payment */}
              {canRecordPayment && (
                <div className="border-t pt-3">
                  {addingPayment ? (
                    <form onSubmit={handlePaymentSubmit} className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Amount (৳)</label>
                          <input type="number" min="0.01" step="0.01" required value={paymentForm.amount}
                            onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                          <input type="date" required value={paymentForm.paid_at}
                            onChange={(e) => setPaymentForm((prev) => ({ ...prev, paid_at: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      <input type="text" value={paymentForm.notes}
                        onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional note..." />
                      <div className="flex gap-2">
                        <button type="submit" disabled={submittingPayment}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors">
                          {submittingPayment ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" onClick={() => { setAddingPayment(false); setPaymentForm({ amount: '', paid_at: new Date().toISOString().split('T')[0], notes: '' }); }}
                          className="border border-gray-300 px-4 py-1.5 rounded-lg text-xs hover:bg-gray-50 cursor-pointer transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button type="button" onClick={() => { setPaymentForm({ amount: '', paid_at: new Date().toISOString().split('T')[0], notes: '' }); setAddingPayment(true); }}
                      className="w-full border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 rounded-lg py-2 text-xs font-medium cursor-pointer transition-colors">
                      + Record Payment
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Documents</h3>
              <p className="text-xs text-gray-500 mt-0.5">{documents.length} file{documents.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-5 max-h-64 overflow-y-auto">
              <DocumentPanel dolilId={dolil.id} documents={documents} onChange={setDocuments} />
            </div>
          </div>

          {/* Reviews */}
          {isCompletedOrRecorded && (
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Reviews</h3>
                <p className="text-xs text-gray-500 mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="p-5 space-y-4">
                {reviews.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No reviews yet.</p>}
                {reviews.map((review) => {
                  const isOwnReview = currentUser?.id === review.reviewer.id;
                  if (editingReview?.id === review.id) return null;
                  return (
                    <div key={review.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarDisplay rating={review.rating} />
                          <span className="text-sm font-medium text-gray-700">{review.reviewer.name}</span>
                        </div>
                        {(isOwnReview || currentUser?.role === 'admin') && (
                          <button type="button" onClick={() => startEditReview(review)} className="text-xs text-blue-600 hover:underline cursor-pointer">Edit</button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{fmtDate(review.created_at)}</p>
                      {review.body && <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{review.body}</p>}
                    </div>
                  );
                })}
                {(editingReview || (canReview && !myReview)) && (
                  <>
                    {reviews.length > 0 && <hr className="border-gray-100" />}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {editingReview ? 'Edit Review' : 'Leave a Review'}
                      </p>
                      <form onSubmit={handleReviewSubmit} className="space-y-3">
                        <StarPicker value={reviewRating} onChange={setReviewRating} />
                        <textarea value={reviewBody} onChange={(e) => setReviewBody(e.target.value)}
                          placeholder="Optional comment..." rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                        <div className="flex gap-2">
                          <button type="submit" disabled={!reviewRating || submittingReview}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors disabled:cursor-not-allowed">
                            Save Review
                          </button>
                          {editingReview && (
                            <button type="button" onClick={cancelEditReview}
                              className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors">
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </>
                )}
                {canReview && !dolil.assigned_to && (
                  <p className="text-sm text-gray-400 italic">No dolil writer assigned — cannot leave a review.</p>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className={`${isCompletedOrRecorded ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col`}>
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Comments ({comments.length})</h3>
            </div>
            <div className="overflow-y-auto p-5 space-y-4" style={{ maxHeight: '480px' }}>
              {comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-12">No comments yet. Start the conversation.</p>
              )}
              {comments.map((comment) => {
                const isOwn = currentUser?.id === comment.user?.id;
                return (
                  <div key={comment.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700 text-xs font-bold">
                      {(comment.user?.name ?? 'U')[0].toUpperCase()}
                    </div>
                    <div className={`max-w-sm flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">{comment.user?.name ?? 'Unknown'}</span>
                        <span className="text-xs text-gray-400">{fmtDateTime(comment.created_at)}</span>
                        {isOwn && (
                          <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-300 hover:text-red-500 cursor-pointer"><IconTrash /></button>
                        )}
                      </div>
                      {comment.body && (
                        <div className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${isOwn ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-900 rounded-tl-none'}`}>
                          {comment.body}
                        </div>
                      )}
                      {comment.has_attachment && (
                        <a href={comment.download_url ?? '#'} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline cursor-pointer bg-blue-50 px-3 py-1.5 rounded-lg">
                          <IconPaperclip />{comment.attachment_name}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Comment input — more breathing room */}
            <div className="border-t border-gray-100 p-5 bg-gray-50">
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write a comment..." rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white" />
                {commentFile && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <IconPaperclip />
                    <span className="truncate">{commentFile.name}</span>
                    <button type="button" onClick={() => setCommentFile(null)} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">Remove</button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="cursor-pointer text-gray-500 hover:text-blue-600 flex items-center gap-1.5 text-sm transition-colors">
                    <IconPaperclip /> Attach file
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setCommentFile(e.target.files?.[0] || null)} />
                  </label>
                  <button type="submit" disabled={submittingComment || (!commentBody.trim() && !commentFile)}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors disabled:cursor-not-allowed">
                    <IconSend />{submittingComment ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Activity Timeline ── */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800 text-sm">Activity Timeline</h3>
              {activities.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{activities.length} event{activities.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            {activities.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">No activity recorded yet.</p>
            ) : (
              <div className="px-6 py-5 max-h-80 overflow-y-auto">
                <ol className="relative border-l border-gray-200 space-y-5">
                  {activities.map((a) => (
                    <li key={a.id} className="ml-4">
                      <div className={`absolute -left-1.5 mt-1 w-3 h-3 rounded-full border-2 border-white ${actionDotColor[a.action] ?? 'bg-gray-400'}`} />
                      <p className="text-sm text-gray-800">{a.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(a.created_at)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

      </div>

    </div>
  );
}
