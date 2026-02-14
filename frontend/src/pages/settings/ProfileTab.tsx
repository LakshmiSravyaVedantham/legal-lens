import { useAuth } from '../../lib/auth';

export default function ProfileTab() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-navy-200 p-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Profile Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-navy-500 mb-1">Full Name</label>
            <p className="text-sm font-medium text-navy-900">{user.full_name}</p>
          </div>
          <div>
            <label className="block text-sm text-navy-500 mb-1">Email</label>
            <p className="text-sm font-medium text-navy-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm text-navy-500 mb-1">Role</label>
            <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-navy-100 text-navy-700 capitalize">
              {user.role}
            </span>
          </div>
          <div>
            <label className="block text-sm text-navy-500 mb-1">Organization</label>
            <p className="text-sm font-medium text-navy-900">{user.organization_name || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-navy-200 p-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Security</h2>
        <p className="text-sm text-navy-500">
          Password change functionality will be available in a future update.
        </p>
      </div>
    </div>
  );
}
