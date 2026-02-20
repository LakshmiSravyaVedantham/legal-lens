import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, LayoutDashboard, MessageSquare, BarChart3, Settings, BookOpen, Bookmark } from 'lucide-react';

const commands = [
  { label: 'Go to Dashboard', icon: LayoutDashboard, action: '/' },
  { label: 'Go to Document Library', icon: FileText, action: '/documents' },
  { label: 'Go to Smart Search', icon: Search, action: '/search' },
  { label: 'Go to Clause Finder', icon: BookOpen, action: '/clauses' },
  { label: 'Go to Document Q&A', icon: MessageSquare, action: '/chat' },
  { label: 'Go to Research', icon: Bookmark, action: '/research' },
  { label: 'Go to Analytics', icon: BarChart3, action: '/analytics' },
  { label: 'Go to System Info', icon: Settings, action: '/system' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // If query doesn't match a command, offer direct search
  const showSearchOption = query.trim().length > 0;

  const handleSelect = (index: number) => {
    if (showSearchOption && index === 0) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      const cmd = filtered[showSearchOption ? index - 1 : index];
      if (cmd) navigate(cmd.action);
    }
    setOpen(false);
  };

  const totalItems = (showSearchOption ? 1 : 0) + filtered.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="relative bg-white rounded-xl shadow-2xl border border-navy-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-100">
          <Search size={18} className="text-navy-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search or jump to..."
            className="flex-1 text-sm outline-none placeholder:text-navy-400"
          />
          <kbd className="text-xs text-navy-400 bg-navy-100 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {showSearchOption && (
            <button
              onClick={() => handleSelect(0)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors ${
                selectedIndex === 0 ? 'bg-navy-100 text-navy-900' : 'text-navy-700 hover:bg-navy-50'
              }`}
            >
              <Search size={16} className="text-gold-500" />
              <span>Search documents for "<strong>{query}</strong>"</span>
            </button>
          )}
          {filtered.map((cmd, i) => {
            const idx = showSearchOption ? i + 1 : i;
            return (
              <button
                key={cmd.label}
                onClick={() => handleSelect(idx)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors ${
                  selectedIndex === idx ? 'bg-navy-100 text-navy-900' : 'text-navy-700 hover:bg-navy-50'
                }`}
              >
                <cmd.icon size={16} className="text-navy-400" />
                {cmd.label}
              </button>
            );
          })}
          {totalItems === 0 && (
            <p className="px-4 py-6 text-center text-sm text-navy-400">No results</p>
          )}
        </div>
        <div className="border-t border-navy-100 px-4 py-2 text-xs text-navy-400 flex gap-4">
          <span><kbd className="bg-navy-100 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-navy-100 px-1 rounded">↵</kbd> select</span>
          <span><kbd className="bg-navy-100 px-1 rounded">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
