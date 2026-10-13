import React from 'react';
import { LockIcon, ShieldIcon } from '../icons/Icons';

interface AccessRestrictedProps {
  onReturnToDashboard: () => void;
  roleName?: string;
  moduleName?: string;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  onReturnToDashboard,
  roleName,
  moduleName
}) => {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-critical)',
            color: 'var(--color-critical)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}
        >
          <LockIcon size={26} />
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Access Restricted
        </h2>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
          You don't have permission to access this module{moduleName ? ` (${moduleName})` : ''}. Your active account role {roleName ? `(${roleName})` : ''} does not include authorization for this administrative interface.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={onReturnToDashboard}>
            <ShieldIcon size={14} />
            <span>Return to Dashboard</span>
          </button>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px', borderTop: '1px solid var(--border-default)', paddingTop: '12px' }}>
          Role-Based Access Control • ThreatShield Security Engine
        </div>
      </div>
    </div>
  );
};
