import React, { useState } from 'react';
import type { ActiveView, User, Organization, CTIRecord, UserRole } from '../../types';
import {
  SearchIcon,
  LogOutIcon,
  FileCodeIcon,
  BellIcon,
  MenuIcon
} from '../icons/Icons';
import { ROLE_CONFIGS } from '../../config/roleConfig';

interface HeaderProps {
  activeView: ActiveView;
  currentUser: User | null;
  currentOrg: Organization | null;
  ledgerValid: boolean | null;
  onLogout: () => void;
  onOpenStix: () => void;
  onSelectCti: (cti: CTIRecord) => void;
  ctiList: CTIRecord[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  currentUser,
  currentOrg,
  ledgerValid,
  onLogout,
  onOpenStix,
  onSelectCti,
  ctiList,
  searchQuery,
  setSearchQuery,
  onToggleMobileSidebar
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const role: UserRole = currentUser?.role || 'ANALYST';
  const roleConfig = ROLE_CONFIGS[role] || ROLE_CONFIGS.ANALYST;

  const getBreadcrumb = () => {
    switch (activeView) {
      // Admin
      case 'admin-overview': return { section: 'Governance', page: 'Administration Overview' };
      case 'admin-users': return { section: 'Governance', page: 'Users & Roles' };
      case 'organizations': return { section: 'Governance', page: 'Organizations' };
      case 'security-events': return { section: 'Platform Security', page: 'Security Governance' };
      case 'ledger': return { section: 'Audit', page: 'Cryptographic Ledger' };
      case 'privacy': return { section: 'Platform Security', page: 'Privacy Governance' };
      case 'system-health': return { section: 'Platform Security', page: 'System Health' };

      // Analyst
      case 'analyst-soc': return { section: 'SOC Operations', page: 'Security Operations' };
      case 'cti-feed': return { section: 'Intelligence', page: 'CTI Feed & Search' };
      case 'submit-cti': return { section: 'Intelligence', page: 'Submit Indicator' };
      case 'investigate': return { section: 'Intelligence', page: 'Threat Investigation' };
      case 'threat-map': return { section: 'SOC Operations', page: 'Threat Map' };
      case 'trust-reputation': return { section: 'Intelligence', page: 'Trust & Reputation' };

      // Validator
      case 'validator-center': return { section: 'Validation Center', page: 'CTI Validation Center' };
      case 'validation-queue': return { section: 'Validation Center', page: 'Validation Queue' };
      case 'contributor-trust': return { section: 'Trust & Evidence', page: 'Contributor Trust' };
      case 'quality-analytics': return { section: 'Trust & Evidence', page: 'Quality Analytics' };
      case 'audit-history': return { section: 'Audit', page: 'Audit History' };

      // Consumer
      case 'consumer-hub': return { section: 'Intelligence Center', page: 'Threat Intelligence' };
      case 'cti-search': return { section: 'Intelligence Center', page: 'CTI Search & Feed' };
      case 'threat-landscape': return { section: 'Intelligence Center', page: 'Threat Landscape' };
      case 'trusted-sources': return { section: 'Threat Discovery', page: 'Trusted Sources' };
      case 'recent-sightings': return { section: 'Threat Discovery', page: 'Recent Sightings' };
      case 'saved-intel': return { section: 'Threat Discovery', page: 'Saved Intelligence' };

      case 'settings': return { section: 'System', page: 'Settings' };
      default: return { section: roleConfig.title, page: 'Dashboard' };
    }
  };

  const breadcrumb = getBreadcrumb();

  const matchingCtis = searchQuery.trim()
    ? ctiList.filter(c =>
        c.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  const getUserInitials = () => {
    if (!currentUser?.email) return 'SA';
    const parts = currentUser.email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return currentUser.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="header">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="header-left">
        {onToggleMobileSidebar && (
          <button
            className="btn btn-secondary btn-sm mobile-menu-btn"
            onClick={onToggleMobileSidebar}
            style={{ padding: '6px', marginRight: '6px' }}
            aria-label="Toggle Sidebar Navigation"
          >
            <MenuIcon size={16} />
          </button>
        )}
        <div className="breadcrumb">
          <span className="breadcrumb-root">{breadcrumb.section}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{breadcrumb.page}</span>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="header-center">
        <div className="search-input-wrapper">
          <SearchIcon size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search indicators, hashes, organizations, STIX IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
          />

          {isSearchFocused && matchingCtis.length > 0 && (
            <div className="search-dropdown">
              <div style={{ padding: '6px 12px', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--bg-app)' }}>
                Matching Indicators ({matchingCtis.length})
              </div>
              {matchingCtis.map(cti => (
                <div
                  key={cti.id}
                  className="search-dropdown-item"
                  onMouseDown={() => onSelectCti(cti)}
                >
                  <div>
                    <div className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-blue)', fontSize: '12px' }}>
                      {cti.value}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {cti.type} • Severity: {cti.severity.toFixed(1)}
                    </div>
                  </div>
                  <span className={`badge ${cti.severity >= 8.5 ? 'badge-critical' : cti.severity >= 7 ? 'badge-high' : 'badge-low'}`}>
                    {cti.severity >= 8.5 ? 'Critical' : cti.severity >= 7 ? 'High' : 'Low'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Operational Status, Notifications & User Context */}
      <div className="header-right">
        {/* STIX Export Button (for analyst / validator / admin) */}
        {role !== 'THREAT_CONSUMER' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenStix}
            title="Export STIX 2.1 JSON Bundle"
          >
            <FileCodeIcon size={13} />
            <span>STIX 2.1</span>
          </button>
        )}

        {/* Live Subsystem Health Status */}
        <div className="status-pill">
          <span
            className="status-dot"
            style={{ backgroundColor: ledgerValid === false ? 'var(--color-critical)' : 'var(--color-success)' }}
          />
          <span>{ledgerValid === false ? 'Audit Alert' : 'System Healthy'}</span>
        </div>

        {/* Notifications Icon Button */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{ padding: '6px' }}
            title="Security Notifications"
          >
            <BellIcon size={14} />
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '280px',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-lg)',
                padding: '12px',
                zIndex: 9999
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Notifications
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                • Defense consensus synchronized with 4 federated peer nodes.<br />
                • SHA-256 cryptographic audit chain validated intact.
              </div>
            </div>
          )}
        </div>

        {/* User Profile Context & Role Badge (NO ROLE DROPDOWN) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid var(--border-default)', paddingLeft: '14px' }}>
          <div className="user-avatar" style={{ backgroundColor: roleConfig.accentLight, color: roleConfig.accentColor, fontWeight: 700 }}>
            {getUserInitials()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {currentOrg?.name || 'CyberDefense Alpha'}
              </span>
              <span className={`badge ${roleConfig.badgeClass}`} style={{ fontSize: '9.5px', padding: '1px 6px', fontWeight: 700 }}>
                {roleConfig.badgeLabel}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {currentUser?.email || `${role.toLowerCase()}@threatshield.org`}
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onLogout}
            title="Sign Out"
            style={{ padding: '6px', marginLeft: '4px' }}
          >
            <LogOutIcon size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
