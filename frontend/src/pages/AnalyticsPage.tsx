import { useEffect, useState } from 'react';
import { BarChart3, Search, HardDrive, Clock } from 'lucide-react';
import { api } from '../lib/api';
import type { Analytics, ActivityEntry } from '../types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    api.getAnalytics().then(setAnalytics).catch(console.error);
    api.getActivityLog(30).then((r) => setActivity(r.activity)).catch(console.error);
  }, []);

  const maxQueryCount = analytics?.search.top_queries.length
    ? Math.max(...analytics.search.top_queries.map((q) => q.count))
    : 1;

  const actionIcons: Record<string, string> = {
    document_uploaded: '📄',
    document_processed: '✅',
    document_deleted: '🗑️',
    search: '🔍',
    chat: '💬',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">Analytics</h1>
        <p className="text-navy-500 mt-1">Search activity, storage usage, and system metrics</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-navy-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Search size={20} className="text-navy-600" />
            <span className="text-sm text-navy-500">Total Searches</span>
          </div>
          <p className="text-2xl font-bold text-navy-900">{analytics?.search.total_searches ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-navy-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={20} className="text-navy-600" />
            <span className="text-sm text-navy-500">Avg Results/Search</span>
          </div>
          <p className="text-2xl font-bold text-navy-900">{analytics?.search.average_results ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-navy-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <HardDrive size={20} className="text-navy-600" />
            <span className="text-sm text-navy-500">Storage Used</span>
          </div>
          <p className="text-2xl font-bold text-navy-900">
            {analytics ? formatBytes(analytics.storage.uploads_bytes + analytics.storage.index_bytes) : '—'}
          </p>
          <p className="text-xs text-navy-400 mt-1">
            Docs: {analytics ? formatBytes(analytics.storage.uploads_bytes) : '—'}{' '}
            | Index: {analytics ? formatBytes(analytics.storage.index_bytes) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top queries chart */}
        <div className="bg-white rounded-lg border border-navy-200 shadow-sm">
          <div className="p-5 border-b border-navy-100">
            <h2 className="text-lg font-semibold text-navy-800">Top Search Queries</h2>
          </div>
          <div className="p-5">
            {!analytics?.search.top_queries.length ? (
              <p className="text-sm text-navy-400 text-center py-6">No searches yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.search.top_queries.map((q, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-navy-700 truncate max-w-[70%]">{q.query}</span>
                      <span className="text-navy-400">{q.count}x</span>
                    </div>
                    <div className="w-full bg-navy-100 rounded-full h-2">
                      <div
                        className="bg-gold-400 h-2 rounded-full transition-all"
                        style={{ width: `${(q.count / maxQueryCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity log */}
        <div className="bg-white rounded-lg border border-navy-200 shadow-sm">
          <div className="p-5 border-b border-navy-100">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-navy-500" />
              <h2 className="text-lg font-semibold text-navy-800">Recent Activity</h2>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-sm text-navy-400 text-center py-8">No activity yet</p>
            ) : (
              <div className="divide-y divide-navy-50">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <span className="text-base mt-0.5">{actionIcons[a.action] ?? '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-navy-800 truncate">{a.detail}</p>
                      <p className="text-xs text-navy-400">{timeAgo(a.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
