'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { IconPaperclip, IconTrash, IconSend } from '@/components/ui/Icons';
import { useAppSelector } from '@/lib/store/hooks';
import { DocumentPanel } from '@/components/documents/DocumentPanel';

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
interface Deed {
  id: number;
  title: string;
  description: string | null;
  status: string;
  notes: string | null;
  created_by: User | null;
  assigned_to: User | null;
  documents: Document[];
  created_at: string;
  updated_at: string;
}

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

const TRANSITIONS: Record<string, string[]> = {
  draft:        ['under_review'],
  under_review: ['completed', 'draft'],
  completed:    ['archived'],
  archived:     ['completed'],
};

function getAllowedTransitions(status: string, user: { id: number; role: string } | null, deed: { created_by?: { id: number } | null; assigned_to?: { id: number } | null } | null): string[] {
  if (!user || !deed) return [];
  const all = TRANSITIONS[status] ?? [];
  if (user.role === 'admin') return all;
  if (deed.assigned_to?.id === user.id) return all.filter(s => s === 'completed');
  if (deed.created_by?.id  === user.id) return all.filter(s => s === 'under_review');
  return [];
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className={`text-2xl leading-none cursor-pointer transition-colors ${n <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'}`}
        >
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
        <span key={n} className={`text-base ${n <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function DeedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAppSelector((s) => s.user.currentUser);
  const [deed, setDeed] = useState<Deed | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const allowedTransitions = getAllowedTransitions(deed?.status ?? '', currentUser, deed);
  const canChangeStatus = allowedTransitions.length > 0;

  const isCompletedOrRecorded = deed && ['completed', 'archived'].includes(deed.status);
  const canReview =
    isCompletedOrRecorded &&
    currentUser &&
    ['admin', 'user'].includes(currentUser.role) &&
    currentUser.id !== deed?.assigned_to?.id;
  const myReview = reviews.find((r) => r.reviewer.id === currentUser?.id);

  function loadDeed() {
    api.get(`/deeds/${id}`)
      .then((r) => {
        setDeed(r.data.data);
        setDocuments(r.data.data.documents || []);
      })
      .catch((err) => {
        if (err?.response?.status === 403) {
          toast.info('You no longer have access to this deed.');
          router.push('/deeds');
        } else {
          toast.error('Failed to load deed');
        }
      });
  }

  function loadComments() {
    api.get(`/deeds/${id}/comments`)
      .then((r) => setComments(r.data.data || r.data))
      .catch(() => {});
  }

  function loadReviews() {
    api.get(`/deeds/${id}/reviews`)
      .then((r) => setReviews(r.data.data || []))
      .catch(() => {});
  }

  useEffect(() => { loadDeed(); loadComments(); loadReviews(); }, [id]);

  function startEditReview(review: Review) {
    setEditingReview(review);
    setReviewRating(review.rating);
    setReviewBody(review.body ?? '');
  }

  function cancelEditReview() {
    setEditingReview(null);
    setReviewRating(0);
    setReviewBody('');
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewRating) return;

    const req = editingReview
      ? api.put(`/reviews/${editingReview.id}`, { rating: reviewRating, body: reviewBody })
      : api.post(`/deeds/${id}/reviews`, { rating: reviewRating, body: reviewBody });

    await toast.promise(
      req.then((res) => {
        const updated: Review = res.data.data ?? res.data;
        setReviews((prev) =>
          editingReview
            ? prev.map((r) => (r.id === editingReview.id ? updated : r))
            : [...prev, updated]
        );
        setEditingReview(null);
        setReviewRating(0);
        setReviewBody('');
      }),
      {
        pending: 'Saving review...',
        success: 'Review saved',
        error: {
          render: ({ data }: { data: unknown }) =>
            (data as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to save review',
        },
      }
    );
  }

  async function handleStatusChange(newStatus: string) {
    if (!deed || newStatus === deed.status) return;
    setChangingStatus(true);
    try {
      const res = await api.put(`/deeds/${id}`, { status: newStatus });
      setDeed(res.data.data);
      toast.success(`Status changed to ${newStatus}`);
    } catch {
      toast.error('Failed to change status');
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim() && !commentFile) return;
    setSubmittingComment(true);
    try {
      const formData = new FormData();
      if (commentBody) formData.append('body', commentBody);
      if (commentFile) formData.append('attachment', commentFile);
      const res = await api.post(`/deeds/${id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setComments((prev) => [...prev, res.data.data]);
      setCommentBody('');
      setCommentFile(null);
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error('Failed to delete comment');
    }
  }

  if (!deed) return <div className="text-gray-500 py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1">
            <Link href="/deeds" className="text-gray-500 hover:text-gray-700 text-sm cursor-pointer">← Deeds</Link>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{deed.title}</h2>
          {deed.description && <p className="text-gray-500 mt-1">{deed.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[deed.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {statusLabels[deed.status] ?? deed.status}
          </span>
          <Link href={`/deeds/${id}/edit`} className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors">
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Info card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 border-b pb-2 text-sm uppercase tracking-wide text-gray-500">Details</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created by</span>
                <span className="font-medium text-gray-900">{deed.created_by?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Assigned to</span>
                <span className="font-medium text-gray-900">{deed.assigned_to?.name ?? <span className="text-gray-400 italic text-xs">Unassigned</span>}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">{new Date(deed.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-700">{new Date(deed.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
            {deed.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-gray-700">{deed.notes}</p>
              </div>
            )}
          </div>

          {/* Status change */}
          {canChangeStatus && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Status</h3>
              <p className="text-xs text-gray-400 mb-3">Current: <span className="font-medium text-gray-600">{statusLabels[deed.status] ?? deed.status}</span></p>
              <div className="space-y-1.5">
                {allowedTransitions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={changingStatus}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    <span>→ {statusLabels[s] ?? s}</span>
                    {changingStatus && <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Documents</h3>
              <p className="text-xs text-gray-500 mt-0.5">{documents.length} file{documents.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-5">
              <DocumentPanel
                deedId={deed.id}
                documents={documents}
                onChange={setDocuments}
              />
            </div>
          </div>

          {/* Reviews — only shown for completed/recorded deeds */}
          {isCompletedOrRecorded && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Reviews</h3>
                <p className="text-xs text-gray-500 mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="p-5 space-y-4">
                {/* Existing reviews */}
                {reviews.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">No reviews yet.</p>
                )}
                {reviews.map((review) => {
                  const isOwnReview = currentUser?.id === review.reviewer.id;
                  const isEditing = editingReview?.id === review.id;
                  if (isEditing) return null;
                  return (
                    <div key={review.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarDisplay rating={review.rating} />
                          <span className="text-sm font-medium text-gray-700">{review.reviewer.name}</span>
                        </div>
                        {isOwnReview && (
                          <button
                            type="button"
                            onClick={() => startEditReview(review)}
                            className="text-xs text-blue-600 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                        {!isOwnReview && currentUser?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => startEditReview(review)}
                            className="text-xs text-blue-600 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                      {review.body && (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{review.body}</p>
                      )}
                    </div>
                  );
                })}

                {/* Review form — shown when editing OR when canReview and no myReview yet */}
                {(editingReview || (canReview && !myReview)) && (
                  <>
                    {reviews.length > 0 && <hr className="border-gray-100" />}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {editingReview ? 'Edit Review' : 'Leave a Review'}
                      </p>
                      <form onSubmit={handleReviewSubmit} className="space-y-3">
                        <StarPicker value={reviewRating} onChange={setReviewRating} />
                        <textarea
                          value={reviewBody}
                          onChange={(e) => setReviewBody(e.target.value)}
                          placeholder="Optional comment..."
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={!reviewRating || submittingReview}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors disabled:cursor-not-allowed"
                          >
                            Save Review
                          </button>
                          {editingReview && (
                            <button
                              type="button"
                              onClick={cancelEditReview}
                              className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </>
                )}

                {/* No assignee notice */}
                {canReview && !deed.assigned_to && (
                  <p className="text-sm text-gray-400 italic">No deed writer assigned — cannot leave a review.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: comments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col" style={{ minHeight: '500px' }}>
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Comments ({comments.length})</h3>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-4">
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
                        <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                        {isOwn && (
                          <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-300 hover:text-red-500 cursor-pointer">
                            <IconTrash />
                          </button>
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
                          <IconPaperclip />
                          {comment.attachment_name}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comment form */}
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                />
                {commentFile && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                    <IconPaperclip />
                    <span className="truncate">{commentFile.name}</span>
                    <button type="button" onClick={() => setCommentFile(null)} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">Remove</button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="cursor-pointer text-gray-500 hover:text-blue-600 flex items-center gap-1.5 text-xs transition-colors">
                    <IconPaperclip />
                    Attach file
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setCommentFile(e.target.files?.[0] || null)} />
                  </label>
                  <button
                    type="submit"
                    disabled={submittingComment || (!commentBody.trim() && !commentFile)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors disabled:cursor-not-allowed"
                  >
                    <IconSend />
                    {submittingComment ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
