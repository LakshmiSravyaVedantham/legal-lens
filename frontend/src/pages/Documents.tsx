import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Trash2, RefreshCw, Eye } from 'lucide-react';
import { api } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import type { DocumentMetadata } from '../types';

export default function Documents() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const loadDocuments = useCallback(() => {
    api.getDocuments().then((r) => setDocuments(r.documents)).catch(console.error);
  }, []);

  useEffect(() => {
    loadDocuments();
    const interval = setInterval(loadDocuments, 3000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await api.uploadDocument(file);
      }
      loadDocuments();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteDocument(id);
      loadDocuments();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Documents</h1>
          <p className="text-navy-500 mt-1">Upload and manage your legal documents</p>
        </div>
        <button
          onClick={loadDocuments}
          className="flex items-center gap-2 px-4 py-2 text-sm text-navy-600 border border-navy-200 rounded-lg hover:bg-white transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors mb-8 ${
          dragOver
            ? 'border-navy-500 bg-navy-100'
            : 'border-navy-300 bg-white hover:border-navy-400'
        }`}
      >
        <Upload size={36} className="mx-auto text-navy-400 mb-3" />
        <p className="text-sm text-navy-700 font-medium">
          {uploading ? 'Uploading...' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-navy-400 mt-1">Supports PDF, DOCX, TXT (max 50MB)</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-6">
          {error}
        </div>
      )}

      {/* Document list */}
      <div className="bg-white rounded-lg border border-navy-200 shadow-sm">
        {documents.length === 0 ? (
          <div className="p-12 text-center text-navy-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left">
                <th className="px-6 py-3 text-navy-500 font-medium">Document</th>
                <th className="px-6 py-3 text-navy-500 font-medium">Type</th>
                <th className="px-6 py-3 text-navy-500 font-medium">Size</th>
                <th className="px-6 py-3 text-navy-500 font-medium">Pages</th>
                <th className="px-6 py-3 text-navy-500 font-medium">Chunks</th>
                <th className="px-6 py-3 text-navy-500 font-medium">Status</th>
                <th className="px-6 py-3 text-navy-500 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-navy-50">
                  <td className="px-6 py-3 text-navy-800 font-medium">{doc.filename}</td>
                  <td className="px-6 py-3 text-navy-500 uppercase">{doc.file_type.replace('.', '')}</td>
                  <td className="px-6 py-3 text-navy-500">{formatSize(doc.file_size)}</td>
                  <td className="px-6 py-3 text-navy-500">{doc.page_count ?? '—'}</td>
                  <td className="px-6 py-3 text-navy-500">{doc.chunk_count || '—'}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {doc.status === 'ready' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}
                          className="text-navy-400 hover:text-navy-700 transition-colors"
                          title="View document"
                          aria-label={`View ${doc.filename}`}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.filename); }}
                        className="text-navy-400 hover:text-red-600 transition-colors"
                        title="Delete document"
                        aria-label={`Delete ${doc.filename}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
