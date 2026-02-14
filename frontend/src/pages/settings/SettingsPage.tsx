import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Building2, Brain, User } from 'lucide-react';

const tabs = [
  { to: '/settings/organization', label: 'Organization', icon: Building2 },
  { to: '/settings/llm', label: 'LLM Providers', icon: Brain },
  { to: '/settings/profile', label: 'Profile', icon: User },
];

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
        <p className="text-navy-500 mt-1">Manage your organization, LLM providers, and profile</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-navy-200">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-gold-400 text-navy-900'
                  : 'border-transparent text-navy-500 hover:text-navy-700'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}

export function SettingsRedirect() {
  return <Navigate to="/settings/organization" replace />;
}
