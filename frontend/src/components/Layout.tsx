import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Search, MessageSquare,
  BarChart3, Settings, BookOpen, Bookmark,
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import DemoBanner from './DemoBanner';

const navSections = [
  {
    label: null,
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'DOCUMENTS',
    items: [
      { to: '/documents', label: 'Document Library', icon: FileText },
      { to: '/search', label: 'Smart Search', icon: Search },
      { to: '/clauses', label: 'Clause Finder', icon: BookOpen },
    ],
  },
  {
    label: 'ANALYSIS',
    items: [
      { to: '/chat', label: 'Document Q&A', icon: MessageSquare },
      { to: '/research', label: 'Research', icon: Bookmark },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/system', label: 'System Info', icon: Settings },
    ],
  },
];

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <CommandPalette />

      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-navy-700">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-gold-400">Legal</span>Lens
          </h1>
          <p className="text-xs text-navy-300 mt-1">Smart Document Search</p>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="px-6 pt-4 pb-1 text-xs font-semibold text-navy-500 tracking-wider">
                  {section.label}
                </p>
              )}
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-navy-700 text-gold-400 border-r-2 border-gold-400'
                        : 'text-navy-200 hover:bg-navy-800 hover:text-white'
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-navy-700">
          <div className="flex items-center gap-2 text-xs text-navy-400 mb-1.5">
            <kbd className="bg-navy-700 px-1.5 py-0.5 rounded text-navy-300">⌘K</kbd>
            <span>Quick search</span>
          </div>
          <p className="text-xs text-navy-500">100% local. No data leaves this machine.</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DemoBanner />
        <main className="flex-1 overflow-y-auto bg-navy-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
