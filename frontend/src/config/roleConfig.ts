import React from 'react';
import type { UserRole, ActiveView } from '../types';
import {
  ShieldIcon,
  ActivityIcon,
  SearchIcon,
  PlusIcon,
  UsersIcon,
  TrendingUpIcon,
  LockIcon,
  CpuIcon,
  DatabaseIcon,
  SettingsIcon,
  FileCodeIcon,
  NetworkIcon,
  CheckCircleIcon,
  LayersIcon,
  SlidersIcon,
  HashIcon,
  EyeIcon,
  BookmarkIcon,
  AlertTriangleIcon
} from '../components/icons/Icons';

export interface NavItemConfig {
  id: ActiveView;
  label: string;
  icon: React.FC<any>;
  badgeKey?: 'ctiCount' | 'pendingCount' | 'eventsCount';
}

export interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

export interface RoleConfigItem {
  role: UserRole;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  landingView: ActiveView;
  landingPath: string;
  tagline: string;
  description: string;
  accentColor: string;
  accentLight: string;
  allowedViews: ActiveView[];
  navSections: NavSectionConfig[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfigItem> = {
  ADMIN: {
    role: 'ADMIN',
    title: 'System Administrator (Superuser)',
    badgeLabel: 'ADMIN SUPERUSER',
    badgeClass: 'role-badge-admin',
    landingView: 'admin-overview',
    landingPath: '/admin',
    tagline: 'Administration & Security Overview',
    description: 'Complete organization governance, security monitoring, and platform control.',
    accentColor: '#2563EB',
    accentLight: '#EFF6FF',
    // ADMIN has access to ALL views
    allowedViews: [
      'admin-overview',
      'admin-users',
      'analyst-soc',
      'knowledge-graph',
      'threat-hunting',
      'incidents',
      'alerts-center',
      'fl-security-lab',
      'trust-center',
      'privacy-center',
      'cti-feed',
      'submit-cti',
      'investigate',
      'threat-map',
      'organizations',
      'trust-reputation',
      'privacy',
      'federated-learning',
      'security-events',
      'ledger',
      'system-health',
      'settings',
      'validator-center',
      'validation-queue',
      'contributor-trust',
      'quality-analytics',
      'audit-history',
      'consumer-hub',
      'cti-search',
      'threat-landscape',
      'trusted-sources',
      'recent-sightings',
      'saved-intel'
    ],
    navSections: [
      {
        title: 'OVERVIEW',
        items: [
          { id: 'admin-overview', label: 'SOC Command Center', icon: ShieldIcon },
          { id: 'analyst-soc', label: 'Analyst Dashboard', icon: ActivityIcon }
        ]
      },
      {
        title: 'INTELLIGENCE',
        items: [
          { id: 'cti-feed', label: 'CTI Feed', icon: FileCodeIcon, badgeKey: 'ctiCount' },
          { id: 'investigate', label: 'IOC Investigation', icon: SearchIcon },
          { id: 'knowledge-graph', label: 'Knowledge Graph', icon: NetworkIcon },
          { id: 'threat-hunting', label: 'Threat Hunting', icon: SearchIcon }
        ]
      },
      {
        title: 'DETECTION & RESPONSE',
        items: [
          { id: 'alerts-center', label: 'Alert Center', icon: AlertTriangleIcon, badgeKey: 'eventsCount' },
          { id: 'incidents', label: 'Incident Response', icon: LayersIcon },
          { id: 'attck-analytics', label: 'ATT&CK Analytics', icon: NetworkIcon }
        ]
      },
      {
        title: 'TRUST & PRIVACY',
        items: [
          { id: 'trust-center', label: 'Organization Trust & Risk', icon: TrendingUpIcon },
          { id: 'privacy-center', label: 'Privacy Center', icon: LockIcon }
        ]
      },
      {
        title: 'FEDERATED SECURITY',
        items: [
          { id: 'fl-security-lab', label: 'FL Security Lab', icon: CpuIcon }
        ]
      },
      {
        title: 'AUDIT',
        items: [
          { id: 'ledger', label: 'Cryptographic Ledger', icon: HashIcon },
          { id: 'security-events', label: 'Security Events', icon: AlertTriangleIcon }
        ]
      },
      {
        title: 'ADMINISTRATION',
        items: [
          { id: 'organizations', label: 'Organizations', icon: UsersIcon },
          { id: 'admin-users', label: 'Users & Roles', icon: UsersIcon },
          { id: 'system-health', label: 'System Health', icon: CpuIcon },
          { id: 'settings', label: 'Settings', icon: SettingsIcon }
        ]
      }
    ]
  },

  ANALYST: {
    role: 'ANALYST',
    title: 'SOC Operations Analyst',
    badgeLabel: 'SOC ANALYST',
    badgeClass: 'role-badge-analyst',
    landingView: 'analyst-soc',
    landingPath: '/analyst',
    tagline: 'Security Operations',
    description: 'Investigate threats, analyze intelligence, and monitor active indicators',
    accentColor: '#0284C7',
    accentLight: '#F0F9FF',
    allowedViews: [
      'analyst-soc',
      'knowledge-graph',
      'threat-hunting',
      'incidents',
      'alerts-center',
      'cti-feed',
      'investigate',
      'threat-map',
      'submit-cti',
      'organizations',
      'trust-center',
      'trust-reputation',
      'security-events',
      'settings'
    ],
    navSections: [
      {
        title: 'SOC Operations',
        items: [
          { id: 'analyst-soc', label: 'Security Operations', icon: ActivityIcon },
          { id: 'alerts-center', label: 'Alert Intelligence', icon: AlertTriangleIcon },
          { id: 'knowledge-graph', label: 'Knowledge Graph', icon: NetworkIcon },
          { id: 'threat-hunting', label: 'Threat Hunting', icon: SearchIcon },
          { id: 'incidents', label: 'Incidents Lifecycle', icon: LayersIcon }
        ]
      },
      {
        title: 'Intelligence',
        items: [
          { id: 'cti-feed', label: 'CTI Indicators', icon: FileCodeIcon, badgeKey: 'ctiCount' },
          { id: 'submit-cti', label: 'Submit Indicator', icon: PlusIcon },
          { id: 'trust-center', label: 'Organization Risk', icon: TrendingUpIcon },
          { id: 'organizations', label: 'Alliance Orgs', icon: UsersIcon }
        ]
      },
      {
        title: 'System',
        items: [
          { id: 'settings', label: 'Settings', icon: SettingsIcon }
        ]
      }
    ]
  },

  VALIDATOR: {
    role: 'VALIDATOR',
    title: 'CTI Validation Specialist',
    badgeLabel: 'VALIDATOR',
    badgeClass: 'role-badge-validator',
    landingView: 'validator-center',
    landingPath: '/validator',
    tagline: 'CTI Validation Center',
    description: 'Review, validate, and assess shared threat intelligence',
    accentColor: '#0D9488',
    accentLight: '#F0FDFA',
    allowedViews: [
      'validator-center',
      'validation-queue',
      'cti-feed',
      'investigate',
      'contributor-trust',
      'quality-analytics',
      'audit-history',
      'ledger',
      'settings'
    ],
    navSections: [
      {
        title: 'Validation',
        items: [
          { id: 'validator-center', label: 'Validation Center', icon: CheckCircleIcon },
          { id: 'validation-queue', label: 'Validation Queue', icon: LayersIcon, badgeKey: 'pendingCount' },
          { id: 'cti-feed', label: 'CTI Feed', icon: SearchIcon, badgeKey: 'ctiCount' },
          { id: 'investigate', label: 'Threat Investigation', icon: FileCodeIcon }
        ]
      },
      {
        title: 'Trust & Quality',
        items: [
          { id: 'contributor-trust', label: 'Contributor Trust', icon: TrendingUpIcon },
          { id: 'quality-analytics', label: 'Quality Analytics', icon: SlidersIcon }
        ]
      },
      {
        title: 'Audit',
        items: [
          { id: 'audit-history', label: 'Validation History', icon: DatabaseIcon },
          { id: 'ledger', label: 'Audit History', icon: HashIcon }
        ]
      },
      {
        title: 'System',
        items: [
          { id: 'settings', label: 'Settings', icon: SettingsIcon }
        ]
      }
    ]
  },

  THREAT_CONSUMER: {
    role: 'THREAT_CONSUMER',
    title: 'Threat Intelligence Consumer',
    badgeLabel: 'THREAT CONSUMER',
    badgeClass: 'role-badge-consumer',
    landingView: 'consumer-hub',
    landingPath: '/intelligence',
    tagline: 'Threat Intelligence Center',
    description: 'Access relevant, validated cyber threat intelligence',
    accentColor: '#4F46E5',
    accentLight: '#EEF2FF',
    allowedViews: [
      'consumer-hub',
      'cti-search',
      'threat-landscape',
      'threat-map',
      'trusted-sources',
      'organizations',
      'recent-sightings',
      'saved-intel',
      'settings'
    ],
    navSections: [
      {
        title: 'Threat Intelligence',
        items: [
          { id: 'consumer-hub', label: 'Intelligence Overview', icon: ShieldIcon },
          { id: 'cti-search', label: 'CTI Search', icon: SearchIcon, badgeKey: 'ctiCount' },
          { id: 'threat-landscape', label: 'Threat Landscape', icon: ActivityIcon },
          { id: 'threat-map', label: 'Threat Map', icon: NetworkIcon },
          { id: 'trusted-sources', label: 'Trusted Sources', icon: UsersIcon },
          { id: 'recent-sightings', label: 'Recent Sightings', icon: EyeIcon },
          { id: 'saved-intel', label: 'Saved Intelligence', icon: BookmarkIcon }
        ]
      },
      {
        title: 'System',
        items: [
          { id: 'settings', label: 'Settings', icon: SettingsIcon }
        ]
      }
    ]
  }
};

export const isViewAllowedForRole = (role: UserRole, view: ActiveView): boolean => {
  // ADMIN is superuser - full access to every module
  if (role === 'ADMIN') return true;

  const config = ROLE_CONFIGS[role];
  if (!config) return false;
  return config.allowedViews.includes(view);
};

export const getDefaultViewForRole = (role: UserRole): ActiveView => {
  const config = ROLE_CONFIGS[role];
  return config ? config.landingView : 'analyst-soc';
};
