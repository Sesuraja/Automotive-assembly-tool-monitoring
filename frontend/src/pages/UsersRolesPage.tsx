import React, { useEffect, useState } from 'react';
import { Users, Plus, Shield, Check, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

interface UsersRolesProps {
  selectedCompanyId: string | null;
}

export const UsersRolesPage: React.FC<UsersRolesProps> = ({ selectedCompanyId }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [modalOpen, setModalOpen] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    employee_id: '',
    phone: '',
    role: 'OPERATOR',
  });

  useEffect(() => {
    loadData();
  }, [selectedCompanyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, rList] = await Promise.all([
        api.getUsers(selectedCompanyId || undefined),
        api.getRoles(),
      ]);
      setUsers(uList);
      setRoles(rList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.full_name || !newUser.password) return;
    try {
      await api.createUser({
        company_id: selectedCompanyId,
        email: newUser.email,
        full_name: newUser.full_name,
        password: newUser.password,
        employee_id: newUser.employee_id,
        phone: newUser.phone,
        roles: [newUser.role],
      });
      setModalOpen(false);
      setNewUser({ email: '', full_name: '', password: '', employee_id: '', phone: '', role: 'OPERATOR' });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Personnel &amp; RBAC Security</h2>
          <p className="text-xs text-gray-500 mt-1">
            Role-based access control, scope authorization, and operator personnel management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'users' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'roles' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              RBAC Roles ({roles.length})
            </button>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-medium">
                <th className="p-3 pl-4">Full Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Employee ID</th>
                <th className="p-3">Assigned Roles</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 pl-4 font-semibold text-gray-900">{u.full_name}</td>
                  <td className="p-3 font-mono text-gray-600">{u.email}</td>
                  <td className="p-3 font-mono text-gray-500">{u.employee_id || 'N/A'}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u.is_super_admin ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          SUPER_ADMIN
                        </span>
                      ) : (
                        u.roles?.map((r: string) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {r}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={u.status} size="sm" />
                  </td>
                  <td className="p-3 pr-4 font-mono text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">{r.name}</span>
                {r.is_system && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">
                    System Role
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-[11px]">{r.description}</p>
              <div className="pt-2 border-t border-gray-100">
                <div className="font-semibold text-gray-700 mb-1.5">Granted Permissions:</div>
                <div className="flex flex-wrap gap-1">
                  {r.permissions?.slice(0, 10).map((perm: string) => (
                    <span
                      key={perm}
                      className="px-1.5 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 rounded text-[10px] font-mono"
                    >
                      {perm}
                    </span>
                  ))}
                  {r.permissions?.length > 10 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-gray-400">
                      +{r.permissions.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Authorized User"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              placeholder="e.g. Alex Thorne"
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Corporate Email Address *</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="alex.thorne@company.com"
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Temporary Password *</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Password"
                className="w-full border border-gray-200 rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Assigned Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full border border-gray-200 rounded-lg p-2.5"
              >
                <option value="OPERATOR">Operator</option>
                <option value="ML_ENGINEER">ML Engineer</option>
                <option value="HARDWARE_ENGINEER">Hardware Engineer</option>
                <option value="SITE_ADMIN">Site Admin</option>
                <option value="COMPANY_MANAGER">Company Manager</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => setModalOpen(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer shadow-xs"
            >
              Provision Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
