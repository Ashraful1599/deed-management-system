'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
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
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  recorded: 'bg-green-100 text-green-800',
};

const STATUSES = ['draft', 'pending', 'completed', 'recorded'];

export default function DeedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAppSelector((s) => s.user.currentUser);
  const [deed, setDeed] = useState<Deed | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const canChangeStatus =
    currentUser && deed &&
    (currentUser.role === 'admin' || currentUser.id === deed.assigned_to?.id);

  function loadDeed() {
    api.get(`/deeds/${id}`)
      .then((r) => {
        setDeed(r.data.data);
        setDocuments(r.data.data.documents || []);
      })
      .catch(() => toast.error('Failed to load deed'));
  }

  function loadComments() {
    api.get(`/deeds/${id}/comments`)
      .then((r) => setComments(r.data.data || r.data))
      .catch(() => {});
  }

  useEffect(() => { loadDeed(); loadComments(); }, [id]);

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
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors[deed.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {deed.status}
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
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Change Status</h3>
              <div className="space-y-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={s === deed.status || changingStatus}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors cursor-pointer ${
                      s === deed.status
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'hover:bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    {s}
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
