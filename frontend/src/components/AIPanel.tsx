import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, RefreshCw, Loader2 } from 'lucide-react';

interface AIPanelProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  cached?: boolean;
  onRefresh?: () => void;
  defaultOpen?: boolean;
}

export default function AIPanel({
  title,
  icon,
  children,
  loading = false,
  cached,
  onRefresh,
  defaultOpen = true,
}: AIPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-navy-200 rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-navy-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon || <Sparkles size={16} className="text-gold-500" />}
          <span className="text-sm font-semibold text-navy-800">{title}</span>
          {cached !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${cached ? 'bg-navy-100 text-navy-500' : 'bg-gold-50 text-gold-700'}`}>
              {cached ? 'cached' : 'fresh'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin text-navy-400" />}
          {onRefresh && !loading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              className="p-1 hover:bg-navy-100 rounded transition-colors"
              title="Refresh analysis"
            >
              <RefreshCw size={13} className="text-navy-400" />
            </button>
          )}
          {open ? <ChevronUp size={16} className="text-navy-400" /> : <ChevronDown size={16} className="text-navy-400" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-navy-100 pt-3">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-navy-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">Analyzing with AI...</span>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk badge helper
// ---------------------------------------------------------------------------

export function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[level] ?? 'bg-navy-100 text-navy-600'}`}>
      {level}
    </span>
  );
}

export function ChecklistBadge({ status }: { status: string }) {
  if (status === 'pass') return <span className="text-green-600 font-bold text-sm">&#10003;</span>;
  if (status === 'fail') return <span className="text-red-600 font-bold text-sm">&#10007;</span>;
  return <span className="text-amber-500 font-bold text-sm">!</span>;
}
