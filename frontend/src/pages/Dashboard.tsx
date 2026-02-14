import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Database, Search, Cpu, Upload, ArrowRight,
  BarChart3, Shield, Clock, Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import type { Stats, DocumentMetadata, ActivityEntry } from '../types';

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentMetadata[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [quickSearch, setQuickSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoadError(null);
    Promise.all([
      api.getStats().then(setStats),
      api.getDocuments().then((r) => setRecentDocs(r.documents.slice(0, 5))),
      api.getActivityLog(8).then((r) => setActivity(r.activity)),
    ]).catch(() => {
      setLoadError('Failed to load dashboard data. Please try refreshing the page.');
    });
  }, []);

  const actionIcons: Record<string, string> = {
    document_uploaded: '📄',
    document_processed: '✅',
    document_deleted: '🗑️',
    search: '🔍',
    chat: '💬',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-navy-500 mt-1">Document Intelligence Overview</p>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-6">
          {loadError}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<FileText className="text-navy-600" size={22} />}
          label="Documents"
          value={stats?.total_documents ?? 0}
          sub={stats?.documents_by_status?.ready ? `${stats.documents_by_status.ready} ready` : undefined}
        />
        <StatCard
          icon={<Database className="text-navy-600" size={22} />}
          label="Indexed Chunks"
          value={stats?.total_chunks ?? 0}
          sub="semantic vectors"
        />
        <StatCard
          icon={<Search className="text-gold-500" size={22} />}
          label="Search Status"
          value="Active"
          highlight
          sub="ready for queries"
        />
        <StatCard
          icon={<Cpu className="text-navy-600" size={22} />}
          label="Ollama LLM"
          value={stats?.ollama_status === 'connected' ? 'Online' : 'Offline'}
          highlight={stats?.ollama_status === 'connected'}
          sub={stats?.ollama_status === 'connected' ? 'llama3.1:8b' : 'search still works'}
        />
      </div>

      {/* Quick search — prominent */}
      <div className="bg-white rounded-lg border border-navy-200 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-navy-800">Smart Search</h2>
          <kbd className="text-xs text-navy-400 bg-navy-100 px-2 py-0.5 rounded">⌘K</kbd>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (quickSearch.trim()) navigate(`/search?q=${encodeURIComponent(quickSearch)}`);
          }}
          className="flex gap-3"
        >
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search across all documents using natural language..."
              className="w-full pl-10 pr-4 py-3 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-navy-800 text-white text-sm font-medium rounded-lg hover:bg-navy-700 transition-colors flex items-center gap-2"
          >
            Search <ArrowRight size={16} />
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent documents */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-navy-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-navy-100">
            <h2 className="text-lg font-semibold text-navy-800">Recent Documents</h2>
            <Link to="/documents" className="text-sm text-navy-500 hover:text-navy-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentDocs.length === 0 ? (
            <div className="p-10 text-center">
              <Upload size={36} className="mx-auto text-navy-300 mb-3" />
              <p className="text-navy-500 mb-2">No documents yet</p>
              <Link
                to="/documents"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-navy-800 text-white rounded-lg hover:bg-navy-700 transition-colors"
              >
                <Upload size={14} /> Upload Documents
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-navy-50">
              {recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  to={doc.status === 'ready' ? `/documents/${doc.id}` : '/documents'}
                  className="flex items-center justify-between px-5 py-3 hover:bg-navy-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-navy-100 rounded">
                      <FileText size={14} className="text-navy-500" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-navy-800">{doc.filename}</span>
                      <p className="text-xs text-navy-400">
                        {doc.page_count ? `${doc.page_count} pages` : doc.file_type.replace('.', '').toUpperCase()}
                        {doc.chunk_count ? ` · ${doc.chunk_count} chunks` : ''}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-lg border border-navy-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-navy-100">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-navy-500" />
              <h2 className="text-lg font-semibold text-navy-800">Activity</h2>
            </div>
            <Link to="/analytics" className="text-sm text-navy-500 hover:text-navy-700">
              More
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="p-6 text-center text-sm text-navy-400">No activity yet. Upload a document to get started.</p>
          ) : (
            <div className="divide-y divide-navy-50 max-h-72 overflow-y-auto">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-2.5">
                  <span className="text-sm mt-0.5">{actionIcons[a.action] ?? '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-navy-700 truncate">{a.detail}</p>
                    <p className="text-xs text-navy-400">{timeAgo(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickAction
          to="/documents"
          icon={<Upload size={20} className="text-navy-600" />}
          title="Upload Documents"
          desc="Add PDFs, DOCX, or TXT files"
        />
        <QuickAction
          to="/chat"
          icon={<Cpu size={20} className="text-navy-600" />}
          title="Document Q&A"
          desc="Ask questions about your documents"
        />
        <QuickAction
          to="/documents"
          icon={<Sparkles size={20} className="text-gold-500" />}
          title="AI Analysis"
          desc="Risk, checklist, obligations & more"
        />
        <QuickAction
          to="/analytics"
          icon={<BarChart3 size={20} className="text-navy-600" />}
          title="View Analytics"
          desc="Search trends and usage stats"
        />
      </div>

      {/* Privacy footer */}
      <div className="bg-navy-900 text-white rounded-lg p-5 flex items-center gap-4">
        <Shield size={24} className="text-gold-400 shrink-0" />
        <div>
          <p className="text-sm font-medium">100% Local Processing</p>
          <p className="text-xs text-navy-300">
            All documents, embeddings, and AI processing happen entirely on your machine. Nothing is sent to the cloud.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, highlight, sub,
}: {
  icon: React.ReactNode; label: string; value: number | string; highlight?: boolean; sub?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-navy-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">{icon}<span className="text-sm text-navy-500">{label}</span></div>
      <p className={`text-2xl font-bold ${highlight ? 'text-green-600' : 'text-navy-900'}`}>{value}</p>
      {sub && <p className="text-xs text-navy-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function QuickAction({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="bg-white border border-navy-200 rounded-lg p-4 flex items-center gap-4 hover:border-navy-300 hover:shadow-sm transition-all group"
    >
      <div className="p-2 bg-navy-50 rounded-lg group-hover:bg-navy-100 transition-colors">{icon}</div>
      <div>
        <p className="text-sm font-medium text-navy-800">{title}</p>
        <p className="text-xs text-navy-400">{desc}</p>
      </div>
    </Link>
  );
}
