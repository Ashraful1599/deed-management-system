'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { fmtDate } from '@/lib/date';
import { toast } from 'react-toastify';
import { showConfirm } from '@/lib/confirm';

interface Document {
  id: number;
  original_filename: string;
  file_size: number | null;
  mime_type: string | null;
  label: string | null;
  download_url: string;
  created_at: string;
}

interface Props {
  deedId: number;
  documents: Document[];
  onChange: (docs: Document[]) => void;
  readonly?: boolean;
}

const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
const ACCEPT_MIME = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/png'];

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function FileIcon({ mime }: { mime: string | null }) {
  const isPdf = mime?.includes('pdf');
  const isImg = mime?.startsWith('image/');
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
      isPdf ? 'bg-red-100 text-red-600' : isImg ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
    }`}>
      {isPdf ? 'PDF' : isImg ? 'IMG' : 'DOC'}
    </div>
  );
}

// ── Gallery Modal ──────────────────────────────────────────────────────────────
function GalleryModal({
  documents,
  startIndex,
  onClose,
}: {
  documents: Document[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const doc = documents[index];
  const total = documents.length;
  const isImg = doc.mime_type?.startsWith('image/');
  const isPdf = doc.mime_type?.includes('pdf');

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <p className="text-white text-sm font-medium truncate max-w-md">{doc.original_filename}</p>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-xs">{index + 1} / {total}</span>
          <a
            href={doc.download_url}
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Download"
            onClick={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer" title="Close (Esc)">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 items-center justify-center min-h-0 relative" onClick={(e) => e.stopPropagation()}>
        {/* Left arrow */}
        {total > 1 && (
          <button
            onClick={prev}
            className="absolute left-3 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Previous (←)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* File preview */}
        <div className="flex-1 flex items-center justify-center h-full px-16 py-4">
          {isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={doc.id}
              src={doc.download_url}
              alt={doc.original_filename}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              draggable={false}
              style={{ pointerEvents: 'none' }}
            />
          ) : isPdf ? (
            <iframe
              key={doc.id}
              src={doc.download_url}
              className="w-full h-full rounded-lg bg-white"
              title={doc.original_filename}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-2xl bg-blue-900 flex items-center justify-center text-blue-300 text-2xl font-bold">
                DOC
              </div>
              <p className="text-white text-sm">Preview not available for this file type.</p>
              <a
                href={doc.download_url}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Download to view
              </a>
            </div>
          )}
        </div>

        {/* Right arrow */}
        {total > 1 && (
          <button
            onClick={next}
            className="absolute right-3 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Next (→)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 py-3 px-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {documents.map((d, i) => {
            const tIsImg = d.mime_type?.startsWith('image/');
            const tIsPdf = d.mime_type?.includes('pdf');
            return (
              <button
                key={d.id}
                onClick={() => setIndex(i)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  i === index ? 'border-blue-400 scale-110' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
                title={d.original_filename}
              >
                {tIsImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.download_url} alt={d.original_filename} className="w-full h-full object-cover" draggable={false} style={{ pointerEvents: 'none' }} />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${
                    tIsPdf ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'
                  }`}>
                    {tIsPdf ? 'PDF' : 'DOC'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DocumentPanel({ deedId, documents, onChange, readonly = false }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => {
      if (!ACCEPT_MIME.includes(f.type) && !f.name.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i)) {
        toast.error(`${f.name}: unsupported file type`);
        return false;
      }
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name}: file too large (max 20 MB)`);
        return false;
      }
      return true;
    });

    for (const file of fileArr) {
      setUploading((prev) => [...prev, file.name]);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.post(`/deeds/${deedId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onChange([res.data.data, ...documents]);
        toast.success(`${file.name} uploaded`);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploading((prev) => prev.filter((n) => n !== file.name));
      }
    }
  }, [deedId, documents, onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (readonly) return;
    uploadFiles(e.dataTransfer.files);
  }, [readonly, uploadFiles]);

  async function handleDelete(docId: number, filename: string) {
    if (!await showConfirm(`"${filename}" will be permanently removed.`, { title: 'Delete document?' })) return;
    try {
      await api.delete(`/documents/${docId}`);
      onChange(documents.filter((d) => d.id !== docId));
      toast.success('Document deleted');
    } catch {
      toast.error('Delete failed');
    }
  }

  const isUploading = uploading.length > 0;

  return (
    <div className="space-y-4">
      {/* Gallery modal */}
      {previewIndex !== null && (
        <GalleryModal
          documents={documents}
          startIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}

      {/* Drop zone */}
      {!readonly && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 ${
            dragOver
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
            dragOver ? 'bg-blue-100' : 'bg-gray-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${dragOver ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          {dragOver ? (
            <p className="text-sm font-medium text-blue-600">Drop files here</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                Drag & drop files here, or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG — max 20 MB each</p>
            </>
          )}
        </div>
      )}

      {/* Uploading indicators */}
      {uploading.map((name) => (
        <div key={name} className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span className="text-sm text-blue-700 truncate">Uploading {name}...</span>
        </div>
      ))}

      {/* Document list */}
      {documents.length > 0 ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {documents.map((doc, i) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
              <FileIcon mime={doc.mime_type} />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setPreviewIndex(i)}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block text-left w-full cursor-pointer transition-colors"
                >
                  {doc.original_filename}
                </button>
                <p className="text-xs text-gray-400">
                  {formatBytes(doc.file_size)}
                  {doc.label && <span className="ml-2 text-blue-500">· {doc.label}</span>}
                  <span className="ml-2">· {fmtDate(doc.created_at)}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Preview button */}
                <button
                  onClick={() => setPreviewIndex(i)}
                  className="p-1.5 text-gray-400 hover:text-green-600 rounded-md hover:bg-green-50 transition-colors cursor-pointer"
                  title="Preview"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                {/* Download button */}
                <a
                  href={doc.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Download"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                {!readonly && (
                  <button
                    onClick={() => handleDelete(doc.id, doc.original_filename)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isUploading && (
          <div className="text-center py-6 text-sm text-gray-400">
            No documents yet
          </div>
        )
      )}
    </div>
  );
}
