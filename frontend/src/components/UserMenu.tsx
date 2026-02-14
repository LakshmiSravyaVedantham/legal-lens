import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../lib/auth';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  lawyer: 'bg-blue-100 text-blue-700',
  paralegal: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-700',
};

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gold-400 text-navy-900 flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm text-white leading-tight">{user.full_name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
            {user.role}
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-lg border border-navy-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-navy-100">
            <p className="text-sm font-medium text-navy-900">{user.full_name}</p>
            <p className="text-xs text-navy-500">{user.email}</p>
            {user.organization_name && (
              <p className="text-xs text-navy-400 mt-0.5">{user.organization_name}</p>
            )}
          </div>
          <button
            onClick={() => { setOpen(false); navigate('/settings'); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50"
          >
            <Settings size={14} /> Settings
          </button>
          <button
            onClick={() => { setOpen(false); navigate('/settings/profile'); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50"
          >
            <User size={14} /> Profile
          </button>
          <div className="border-t border-navy-100">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
