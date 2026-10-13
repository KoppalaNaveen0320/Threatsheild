import React from 'react';
import type { ActiveView, Organization, User, UserRole } from '../../types';
import { ShieldIcon, XIcon } from '../icons/Icons';
import { ROLE_CONFIGS } from '../../config/roleConfig';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  currentUser: User | null;
  currentOrg: Organization | null;
  ctiCount: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  currentUser,
  currentOrg,
  ctiCount,
  mobileOpen = false,
  onCloseMobile
}) => {
  const role: UserRole = currentUser?.role || 'ANALYST';
  const roleConfig = ROLE_CONFIGS[role] || ROLE_CONFIGS.ANALYST;

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const getBadgeValue = (badgeKey?: 'ctiCount' | 'pendingCount' | 'eventsCount') => {
    if (badgeKey === 'ctiCount' && ctiCount > 0) return ctiCount;
    if (badgeKey === 'pendingCount') return Math.max(1, Math.min(ctiCount, 4));
    if (badgeKey === 'eventsCount') return 0;
    return undefined;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 998
          }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header" style={{ position: 'relative' }}>
          <div className="sidebar-logo-icon" style={{ backgroundColor: roleConfig.accentLight, color: roleConfig.accentColor }}>
            <ShieldIcon size={18} />
          </div>
          <div>
            <div className="sidebar-brand-title">ThreatShield</div>
            <div className="sidebar-brand-subtitle" style={{ color: roleConfig.accentColor, fontWeight: 700 }}>
              {roleConfig.badgeLabel} CONSOLE
            </div>
          </div>

          {onCloseMobile && (
            <button
              className="btn btn-secondary btn-sm mobile-close-btn"
              onClick={onCloseMobile}
              style={{ position: 'absolute', right: '12px', top: '16px', padding: '4px' }}
              aria-label="Close sidebar"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        {/* Role-Specific Navigation Groups */}
        <nav className="sidebar-nav">
          {roleConfig.navSections.map((section, sIdx) => (
            <div key={sIdx} className="sidebar-nav-group">
              <div className="sidebar-group-title">{section.title}</div>
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                const badgeVal = getBadgeValue(item.badgeKey);

                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    style={isActive ? { borderLeft: `3px solid ${roleConfig.accentColor}` } : {}}
                  >
                    <Icon size={15} className="nav-icon" />
                    <span>{item.label}</span>
                    {badgeVal !== undefined && <span className="nav-badge">{badgeVal}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Tenant & Role Footer Context */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '11px', backgroundColor: roleConfig.accentLight, color: roleConfig.accentColor }}>
              {currentOrg?.name ? currentOrg.name.substring(0, 2).toUpperCase() : 'CD'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentOrg?.name || 'CyberDefense Alpha'}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Role: <strong style={{ color: roleConfig.accentColor }}>{roleConfig.badgeLabel}</strong>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
