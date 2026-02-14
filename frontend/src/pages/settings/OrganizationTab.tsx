import { useAuth } from '../../lib/auth';

export default function OrganizationTab() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-navy-200 p-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Organization Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-navy-500 mb-1">Name</label>
            <p className="text-sm font-medium text-navy-900">{user?.organization_name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm text-navy-500 mb-1">Your Role</label>
            <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-navy-100 text-navy-700 capitalize">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-navy-200 p-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Members</h2>
        <p className="text-sm text-navy-500">
          Member management will be available in a future update. Currently, each user creates their own organization on registration.
        </p>
      </div>
    </div>
  );
}
