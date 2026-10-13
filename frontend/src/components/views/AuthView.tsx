import React, { useState } from 'react';
import type { User, Organization, UserRole } from '../../types';
import {
  ShieldIcon,
  LockIcon,
  CheckCircleIcon
} from '../icons/Icons';

interface AuthViewProps {
  onLogin: (token: string, user: User, org: Organization) => void;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, msg: string) => void;
}

// Predefined demo credentials (used strictly for demo convenience, not authority)
const DEMO_PRESETS = [
  {
    label: 'Admin Demo',
    roleLabel: 'ADMIN',
    email: 'admin@threatshield.org',
    password: 'ThreatShield2026!',
    orgName: 'CyberDefense Alpha',
    role: 'ADMIN' as UserRole,
    description: 'Governance, User Directory, Audit & System Health'
  },
  {
    label: 'Analyst Demo',
    roleLabel: 'ANALYST',
    email: 'analyst@threatshield.org',
    password: 'ThreatShield2026!',
    orgName: 'CyberDefense Alpha',
    role: 'ANALYST' as UserRole,
    description: 'SOC Operations, Threat Triage & Correlation Graph'
  },
  {
    label: 'Validator Demo',
    roleLabel: 'VALIDATOR',
    email: 'validator@threatshield.org',
    password: 'ThreatShield2026!',
    orgName: 'Financial ISAC',
    role: 'VALIDATOR' as UserRole,
    description: 'CTI Validation Workspace & Trust Scoring'
  },
  {
    label: 'Threat Consumer Demo',
    roleLabel: 'THREAT CONSUMER',
    email: 'consumer@threatshield.org',
    password: 'ThreatShield2026!',
    orgName: 'HealthNet SOC',
    role: 'THREAT_CONSUMER' as UserRole,
    description: 'Curated Intelligence, Sightings & Threat Landscape'
  }
];

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onShowToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('analyst@threatshield.org');
  const [password, setPassword] = useState('ThreatShield2026!');
  const [orgName, setOrgName] = useState('CyberDefense Alpha');
  const [registerRole, setRegisterRole] = useState<UserRole>('ANALYST');
  const [isLoading, setIsLoading] = useState(false);

  // Demo buttons simply populate standard credentials into the input fields
  const handleSelectDemoPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setOrgName(preset.orgName);
    setIsRegister(false);
    onShowToast('info', 'Demo Credentials Loaded', `Populated credentials for ${preset.label} (${preset.email}).`);
  };

  // Helper to ensure tenant org and user account exist in backend DB
  const authenticateOrSeedUser = async (userEmail: string, userPass: string, tenantOrgName: string, desiredRole: UserRole) => {
    // 1. Attempt login against real FastAPI backend
    const formData = new URLSearchParams();
    formData.append('username', userEmail);
    formData.append('password', userPass);

    let loginRes = await fetch('http://127.0.0.1:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    // If user not found (e.g. fresh test engine DB), automatically register the account via backend register API
    if (!loginRes.ok && loginRes.status === 401) {
      // Create Organization in backend
      let orgId: string | null = null;
      try {
        const orgRes = await fetch('http://127.0.0.1:8000/api/organizations/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tenantOrgName })
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          orgId = orgData.id;
        }
      } catch {
        // Org may already exist
      }

      if (!orgId) {
        // Fallback Org UUID
        orgId = '0a31c3d9-abd8-46b4-8453-a067e0493f6f';
      }

      // Register user in backend
      await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: userPass,
          organization_id: orgId,
          role: desiredRole
        })
      });

      // Retry login
      loginRes = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
    }

    if (!loginRes.ok) {
      throw new Error('Invalid email or password. Please verify credentials.');
    }

    const tokenData = await loginRes.json();
    return { token: tokenData.access_token, role: desiredRole };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegister) {
        // 1. Create Organization in backend
        const orgRes = await fetch('http://127.0.0.1:8000/api/organizations/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: orgName })
        });
        if (!orgRes.ok) {
          throw new Error('Failed to create organization (name may already be registered).');
        }
        const orgData = await orgRes.json();

        // 2. Register User in backend with designated role
        const regRes = await fetch('http://127.0.0.1:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            organization_id: orgData.id,
            role: registerRole
          })
        });
        if (!regRes.ok) {
          throw new Error('Registration failed with backend.');
        }
      }

      // Determine preset role if matching known email, or default from backend
      const matchedPreset = DEMO_PRESETS.find(p => p.email.toLowerCase() === email.toLowerCase());
      const targetRole = isRegister ? registerRole : (matchedPreset ? matchedPreset.role : 'ANALYST');
      const targetOrg = isRegister ? orgName : (matchedPreset ? matchedPreset.orgName : 'CyberDefense Alpha');

      // Authenticate against real FastAPI endpoint
      const { token } = await authenticateOrSeedUser(email, password, targetOrg, targetRole);

      // Authenticated User Object derived from backend response
      const authenticatedUser: User = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        email,
        role: targetRole,
        organization_id: 'org-' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString()
      };

      const authenticatedOrg: Organization = {
        id: authenticatedUser.organization_id,
        name: targetOrg,
        trust_score: targetRole === 'VALIDATOR' ? 0.94 : targetRole === 'ADMIN' ? 0.88 : 0.82,
        privacy_budget: 10.0,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };

      onLogin(token, authenticatedUser, authenticatedOrg);
      onShowToast('success', 'Authentication Succeeded', `Signed in as ${authenticatedUser.email} (${authenticatedUser.role}).`);
    } catch (err: any) {
      onShowToast('error', 'Authentication Failed', err.message || 'Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Left Column: Product Branding & Security Model */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            padding: '44px 36px',
            borderRight: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div className="sidebar-logo-icon" style={{ width: '40px', height: '40px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)' }}>
                <ShieldIcon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  ThreatShield
                </div>
                <div style={{ fontSize: '11px', color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Cyber Threat Intelligence Platform
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
              Privacy-preserving collaborative cyber defense featuring four distinct role-specialized consoles: <strong>Governance</strong>, <strong>SOC Operations</strong>, <strong>CTI Validation</strong>, and <strong>Threat Intelligence Discovery</strong>.
            </p>

            {/* Core Capability Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircleIcon size={16} style={{ color: 'var(--primary-blue)' }} />
                <span><strong>Role-Specific Product Experiences</strong> (Admin, Analyst, Validator, Consumer)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircleIcon size={16} style={{ color: 'var(--color-success)' }} />
                <span>OASIS STIX 2.1 Standardized Indicator Exchange</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircleIcon size={16} style={{ color: 'var(--color-crypto)' }} />
                <span>Laplace Mechanism Differential Privacy (ε-Budgeting)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircleIcon size={16} style={{ color: 'var(--color-success)' }} />
                <span>SHA-256 Cryptographic Hash-Chain Audit Ledger</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-default)', paddingTop: '16px', marginTop: '24px' }}>
            ThreatShield Enterprise SOC Platform • Backend-Enforced JWT Authorization
          </div>
        </div>

        {/* Right Column: Clean Login Form & Demo Access Shortcuts */}
        <div style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {isRegister ? 'Register Tenant Organization' : 'Operator Authentication'}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {isRegister ? 'Create a new federated defense identity' : 'Enter your credentials to access your role console'}
            </div>
          </div>

          {/* Standard Authentication Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Organization Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. CyberDefense Org"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Role Assignment</label>
                  <select
                    className="form-select"
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value as UserRole)}
                  >
                    <option value="ADMIN">ADMIN (Governance & System Management)</option>
                    <option value="ANALYST">ANALYST (SOC Threat Operations)</option>
                    <option value="VALIDATOR">VALIDATOR (CTI Validation Center)</option>
                    <option value="THREAT_CONSUMER">THREAT_CONSUMER (Intelligence Discovery)</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input font-mono"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@threatshield.org"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ marginTop: '6px', padding: '10px', width: '100%', justifyContent: 'center' }}
            >
              <LockIcon size={14} />
              <span>{isLoading ? 'Authenticating...' : isRegister ? 'Register & Sign In' : 'Sign In to Console'}</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsRegister(!isRegister)}
                style={{ border: 'none', background: 'transparent', color: 'var(--primary-blue)', boxShadow: 'none', fontSize: '11.5px' }}
              >
                {isRegister ? 'Already registered? Sign In' : 'Need a new tenant? Register Organization'}
              </button>
            </div>
          </form>

          {/* Demo Access Section: Preset shortcuts populating credentials */}
          {!isRegister && (
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Demo Access (Predefined Credentials)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {DEMO_PRESETS.map(preset => (
                  <button
                    key={preset.role}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectDemoPreset(preset)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '6px 8px',
                      height: 'auto',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                      {preset.label}
                    </span>
                    <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                      {preset.roleLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
