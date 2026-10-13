import React from 'react';
import type { User, Organization } from '../../types';
import {
  ShieldIcon,
  UserIcon
} from '../icons/Icons';

interface SettingsViewProps {
  currentUser: User | null;
  currentOrg: Organization | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  currentOrg
}) => {
  return (
    <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings & Node Configuration</h1>
          <div className="page-subtitle">
            Manage local operator credentials, node endpoints, and multi-tenant keys
          </div>
        </div>
      </div>

      {/* Operator Profile */}
      <div className="soc-card">
        <div className="card-title" style={{ marginBottom: '16px' }}>
          <UserIcon size={16} />
          <span>Operator Profile Context</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12.5px' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Email Address</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser?.email || 'analyst@threatshield.org'}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Assigned RBAC Role</div>
            <div>
              <span className="badge badge-low">{currentUser?.role || 'ANALYST'}</span>
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Tenant Identity</div>
            <div className="font-mono" style={{ color: 'var(--primary-blue)' }}>{currentUser?.organization_id || currentOrg?.id}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Auth Token Protocol</div>
            <div style={{ color: 'var(--color-success)', fontWeight: 600 }}>Stateless JWT (HMAC-SHA256)</div>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="soc-card">
        <div className="card-title" style={{ marginBottom: '16px' }}>
          <ShieldIcon size={16} />
          <span>Active Backend Connection</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-default)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Target API Host:</span>
            <span className="font-mono" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>http://127.0.0.1:8000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-default)' }}>
            <span style={{ color: 'var(--text-muted)' }}>CORS Authorization:</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Allow All Origins (Development)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>OASIS STIX Spec:</span>
            <span className="font-mono">STIX 2.1 JSON Schema</span>
          </div>
        </div>
      </div>
    </div>
  );
};
