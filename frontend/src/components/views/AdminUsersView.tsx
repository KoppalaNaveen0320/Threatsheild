import React, { useState } from 'react';
import type { UserRole } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { ChartCard } from '../common/ChartCard';
import { StatusBadge } from '../common/StatusBadge';
import { SearchIcon, EditIcon, EyeIcon, UserXIcon } from '../icons/Icons';

interface AdminUsersViewProps {
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, msg: string) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onShowToast }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([
    { id: 'u-1', email: 'admin@threatshield.org', role: 'ADMIN' as UserRole, org: 'CyberDefense Alpha', status: 'ACTIVE', lastLogin: '2026-08-25 08:15:00 UTC', created: '2026-01-10' },
    { id: 'u-2', email: 'analyst@threatshield.org', role: 'ANALYST' as UserRole, org: 'CyberDefense Alpha', status: 'ACTIVE', lastLogin: '2026-08-25 08:10:00 UTC', created: '2026-01-12' },
    { id: 'u-3', email: 'validator@threatshield.org', role: 'VALIDATOR' as UserRole, org: 'Financial ISAC', status: 'ACTIVE', lastLogin: '2026-08-25 07:55:00 UTC', created: '2026-01-15' },
    { id: 'u-4', email: 'consumer@threatshield.org', role: 'THREAT_CONSUMER' as UserRole, org: 'HealthNet SOC', status: 'ACTIVE', lastLogin: '2026-08-25 06:40:00 UTC', created: '2026-02-01' },
    { id: 'u-5', email: 'secops@nationalgrid.org', role: 'ANALYST' as UserRole, org: 'Critical Infra Sec', status: 'ACTIVE', lastLogin: '2026-08-25 05:22:00 UTC', created: '2026-02-14' }
  ]);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const handleSaveEdit = (newRole: UserRole, newStatus: string) => {
    if (!editingUser) return;
    setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, role: newRole, status: newStatus } : u));
    setEditingUser(null);
    if (onShowToast) {
      onShowToast('success', 'User Updated', `Updated account for ${editingUser.email}`);
    }
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u));
    if (onShowToast) {
      onShowToast('info', 'Status Updated', 'User account status toggled.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.org.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="view-container">
      <PageHeader
        title="User & Role Management"
        subtitle="Manage authenticated identity directories, role assignments, and tenant boundaries"
        badge={<span className="badge role-badge-admin">RBAC GOVERNANCE</span>}
        breadcrumb={{ section: 'SYSTEM', page: 'Users & Roles' }}
      />

      {/* Role Breakdown Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '8px' }}>
        <div className="metric-card">
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>ADMINISTRATORS</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-blue)', margin: '2px 0' }}>
            {users.filter(u => u.role === 'ADMIN').length}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Full governance & system control</div>
        </div>

        <div className="metric-card">
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>SOC ANALYSTS</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: '#0284C7', margin: '2px 0' }}>
            {users.filter(u => u.role === 'ANALYST').length}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Threat detection & CTI submission</div>
        </div>

        <div className="metric-card">
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>VALIDATORS</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: '#0D9488', margin: '2px 0' }}>
            {users.filter(u => u.role === 'VALIDATOR').length}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>CTI validation & quality scoring</div>
        </div>

        <div className="metric-card">
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>THREAT CONSUMERS</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: '#4F46E5', margin: '2px 0' }}>
            {users.filter(u => u.role === 'THREAT_CONSUMER').length}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Read-only intelligence consumption</div>
        </div>
      </div>

      {/* User Directory Table */}
      <ChartCard
        title="Directory Users"
        subtitle="Manage access tiers and permissions strictly enforced by backend authentication"
        headerAction={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <SearchIcon size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '28px', height: '30px', fontSize: '11.5px', width: '200px' }}
              />
            </div>
          </div>
        }
      >
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>ORGANIZATION</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>LAST ACTIVE</th>
                <th>CREATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.email}</div>
                    <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {u.id}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, fontSize: '11.5px' }}>{u.org}</span>
                  </td>
                  <td>
                    <span className={`badge role-badge-${u.role.toLowerCase().replace('_', '-')}`} style={{ fontSize: '10px' }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={u.status} size="sm" />
                  </td>
                  <td className="font-mono" style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                    {u.lastLogin}
                  </td>
                  <td className="font-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {u.created}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 6px', fontSize: '10.5px' }}
                        onClick={() => setSelectedUser(u)}
                        title="View User Details"
                      >
                        <EyeIcon size={11} />
                        <span>View</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 6px', fontSize: '10.5px' }}
                        onClick={() => setEditingUser(u)}
                        title="Edit Role & Permissions"
                      >
                        <EditIcon size={11} />
                        <span>Edit</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '2px 6px',
                          fontSize: '10.5px',
                          color: u.status === 'ACTIVE' ? 'var(--color-critical)' : 'var(--color-success)'
                        }}
                        onClick={() => handleToggleStatus(u.id)}
                        title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <UserXIcon size={11} />
                        <span>{u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* User Details View Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '20px',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>User Account Details</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>EMAIL</div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{selectedUser.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ORGANIZATION</div>
                <div>{selectedUser.org}</div>
              </div>
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ROLE TIER</div>
                <span className={`badge role-badge-${selectedUser.role.toLowerCase().replace('_', '-')}`}>{selectedUser.role}</span>
              </div>
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>BACKEND AUTHORIZATION</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Role verified via JSON Web Token signing. Backend FastAPI dependency injection enforces RBAC at the route boundary.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {editingUser && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '20px',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Edit User: {editingUser.email}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const role = (form.elements.namedItem('role') as HTMLSelectElement).value as UserRole;
                const status = (form.elements.namedItem('status') as HTMLSelectElement).value;
                handleSaveEdit(role, status);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div className="form-group">
                <label className="form-label">Role Assignment</label>
                <select name="role" className="form-select" defaultValue={editingUser.role}>
                  <option value="ADMIN">ADMIN (Superuser Access)</option>
                  <option value="ANALYST">ANALYST (SOC Operations)</option>
                  <option value="VALIDATOR">VALIDATOR (CTI Validation)</option>
                  <option value="THREAT_CONSUMER">THREAT_CONSUMER (Intelligence Discovery)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Account Status</label>
                <select name="status" className="form-select" defaultValue={editingUser.status}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
