import { useEffect, useState } from 'react';
import { Monitor, HardDrive, Cpu, Shield } from 'lucide-react';
import { api } from '../lib/api';
import type { SystemInfo, ChatStatus } from '../types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SystemPage() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [ollama, setOllama] = useState<ChatStatus | null>(null);

  useEffect(() => {
    api.getSystemInfo().then(setInfo).catch(console.error);
    api.getChatStatus().then(setOllama).catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">System Information</h1>
        <p className="text-navy-500 mt-1">Runtime environment, storage paths, and service status</p>
      </div>

      {/* Privacy banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-center gap-3">
        <Shield size={20} className="text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">Fully Local Processing</p>
          <p className="text-xs text-green-600">All documents, embeddings, and queries are processed entirely on this machine. No data is sent to external services.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Environment */}
        <div className="bg-white rounded-lg border border-navy-200 shadow-sm">
          <div className="p-5 border-b border-navy-100 flex items-center gap-2">
            <Monitor size={18} className="text-navy-500" />
            <h2 className="text-lg font-semibold text-navy-800">Environment</h2>
          </div>
          <div className="divide-y divide-navy-50">
            <InfoRow label="Platform" value={info?.platform ?? '—'} />
            <InfoRow label="Architecture" value={info?.machine ?? '—'} />
            <InfoRow label="Python" value={info?.python_version?.split(' ')[0] ?? '—'} />
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white rounded-lg border border-navy-200 shadow-sm">
          <div className="p-5 border-b border-navy-100 flex items-center gap-2">
            <HardDrive size={18} className="text-navy-500" />
            <h2 className="text-lg font-semibold text-navy-800">Storage</h2>
          </div>
          <div className="divide-y divide-navy-50">
            <InfoRow label="Uploads Directory" value={info?.uploads_dir ?? '—'} mono />
            <InfoRow label="Uploads Size" value={info ? formatBytes(info.uploads_size) : '—'} />
            <InfoRow label="Index Directory" value={info?.index_dir ?? '—'} mono />
            <InfoRow label="Index Size" value={info ? formatBytes(info.index_size) : '—'} />
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg border border-navy-200 shadow-sm">
          <div className="p-5 border-b border-navy-100 flex items-center gap-2">
            <Cpu size={18} className="text-navy-500" />
            <h2 className="text-lg font-semibold text-navy-800">Services</h2>
          </div>
          <div className="divide-y divide-navy-50">
            <InfoRow label="Backend API" value="Running" badge="green" />
            <InfoRow label="Embedding Model" value="all-MiniLM-L6-v2 (loaded)" badge="green" />
            <InfoRow label="Vector Database" value="ChromaDB (local)" badge="green" />
            <InfoRow
              label="Ollama LLM"
              value={ollama?.ollama_available ? 'Connected (llama3.1:8b)' : 'Not running'}
              badge={ollama?.ollama_available ? 'green' : 'amber'}
            />
          </div>
        </div>

        {/* Capabilities */}
        <div className="bg-white rounded-lg border border-navy-200 shadow-sm">
          <div className="p-5 border-b border-navy-100">
            <h2 className="text-lg font-semibold text-navy-800">Capabilities</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Capability name="PDF Text Extraction" available />
            <Capability name="DOCX Processing" available />
            <Capability name="Plain Text Files" available />
            <Capability name="Semantic Search" available />
            <Capability name="Document Q&A (RAG)" available={ollama?.ollama_available ?? false} />
            <Capability name="OCR (Scanned PDFs)" available={false} label="Coming in v2" />
            <Capability name="Email Parsing" available={false} label="Coming in v2" />
            <Capability name="Hybrid Search (BM25)" available={false} label="Coming in v2" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: 'green' | 'amber' }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-sm text-navy-500">{label}</span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className={`w-2 h-2 rounded-full ${badge === 'green' ? 'bg-green-500' : 'bg-amber-500'}`} />
        )}
        <span className={`text-sm text-navy-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
      </div>
    </div>
  );
}

function Capability({ name, available, label }: { name: string; available: boolean; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full shrink-0 ${available ? 'bg-green-500' : 'bg-navy-300'}`} />
      <span className="text-sm text-navy-700">{name}</span>
      {label && <span className="text-xs text-navy-400 ml-auto">{label}</span>}
    </div>
  );
}
