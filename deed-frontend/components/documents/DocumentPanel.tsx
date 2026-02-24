'use client';
import { useRef, useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'react-toastify';

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

export function DocumentPanel({ deedId, documents, onChange, readonly = false }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]); // uploading file names
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
    if (!confirm(`Delete "${filename}"?`)) return;
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
          {/* Upload icon */}
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
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
              <FileIcon mime={doc.mime_type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.original_filename}</p>
                <p className="text-xs text-gray-400">
                  {formatBytes(doc.file_size)}
                  {doc.label && <span className="ml-2 text-blue-500">· {doc.label}</span>}
                  <span className="ml-2">· {new Date(doc.created_at).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
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
