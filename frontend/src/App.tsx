import { useState, useEffect, lazy, Suspense } from 'react';
import type {
  ActiveView,
  Organization,
  User,
  CTIRecord,
  LedgerBlock,
  PrivacyStats,
  ToastMessage,
  UserRole
} from './types';

import {
  isViewAllowedForRole,
  getDefaultViewForRole
} from './config/roleConfig';

// Layout & Core Shell Components (Immediate Bundle)
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/Toast';
import { InvestigationDrawer } from './components/common/InvestigationDrawer';
import { StixModal } from './components/common/StixModal';
import { AccessRestricted } from './components/common/AccessRestricted';
import { AuthView } from './components/views/AuthView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { AnalystDashboardView } from './components/views/AnalystDashboardView';

// Route-Level Code-Splitting Lazy Loaded Workspaces
const AdminUsersView = lazy(() => import('./components/views/AdminUsersView').then(m => ({ default: m.AdminUsersView })));
const ValidatorDashboardView = lazy(() => import('./components/views/ValidatorDashboardView').then(m => ({ default: m.ValidatorDashboardView })));
const ValidatorQueueView = lazy(() => import('./components/views/ValidatorQueueView').then(m => ({ default: m.ValidatorQueueView })));
const ValidatorContributorTrustView = lazy(() => import('./components/views/ValidatorContributorTrustView').then(m => ({ default: m.ValidatorContributorTrustView })));
const ConsumerDashboardView = lazy(() => import('./components/views/ConsumerDashboardView').then(m => ({ default: m.ConsumerDashboardView })));
const ConsumerSearchView = lazy(() => import('./components/views/ConsumerSearchView').then(m => ({ default: m.ConsumerSearchView })));
const ConsumerLandscapeView = lazy(() => import('./components/views/ConsumerLandscapeView').then(m => ({ default: m.ConsumerLandscapeView })));
const ConsumerSightingsView = lazy(() => import('./components/views/ConsumerSightingsView').then(m => ({ default: m.ConsumerSightingsView })));
const ConsumerSavedView = lazy(() => import('./components/views/ConsumerSavedView').then(m => ({ default: m.ConsumerSavedView })));

// Shared Feature Workspaces
const ThreatMapView = lazy(() => import('./components/views/ThreatMapView').then(m => ({ default: m.ThreatMapView })));
const CtiFeedView = lazy(() => import('./components/views/CtiFeedView').then(m => ({ default: m.CtiFeedView })));
const SubmitCtiView = lazy(() => import('./components/views/SubmitCtiView').then(m => ({ default: m.SubmitCtiView })));
const InvestigateView = lazy(() => import('./components/views/InvestigateView').then(m => ({ default: m.InvestigateView })));
const TrustReputationView = lazy(() => import('./components/views/TrustReputationView').then(m => ({ default: m.TrustReputationView })));
const PrivacyView = lazy(() => import('./components/views/PrivacyView').then(m => ({ default: m.PrivacyView })));
const FederatedLearningView = lazy(() => import('./components/views/FederatedLearningView').then(m => ({ default: m.FederatedLearningView })));
const SecurityEventsView = lazy(() => import('./components/views/SecurityEventsView').then(m => ({ default: m.SecurityEventsView })));
const LedgerView = lazy(() => import('./components/views/LedgerView').then(m => ({ default: m.LedgerView })));
const OrganizationsView = lazy(() => import('./components/views/OrganizationsView').then(m => ({ default: m.OrganizationsView })));
const SystemHealthView = lazy(() => import('./components/views/SystemHealthView').then(m => ({ default: m.SystemHealthView })));
const SettingsView = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));

// v1.2 Advanced Intelligence & Research Workspaces
const KnowledgeGraphView = lazy(() => import('./components/views/KnowledgeGraphView').then(m => ({ default: m.KnowledgeGraphView })));
const ThreatHuntingView = lazy(() => import('./components/views/ThreatHuntingView').then(m => ({ default: m.ThreatHuntingView })));
const IncidentsView = lazy(() => import('./components/views/IncidentsView').then(m => ({ default: m.IncidentsView })));
const FlSecurityLabView = lazy(() => import('./components/views/FlSecurityLabView').then(m => ({ default: m.FlSecurityLabView })));
const AdaptiveTrustView = lazy(() => import('./components/views/AdaptiveTrustView').then(m => ({ default: m.AdaptiveTrustView })));
const PrivacyCenterView = lazy(() => import('./components/views/PrivacyCenterView').then(m => ({ default: m.PrivacyCenterView })));
const AlertsCenterView = lazy(() => import('./components/views/AlertsCenterView').then(m => ({ default: m.AlertsCenterView })));

// Modals & Command Palette
const CommandPalette = lazy(() => import('./components/common/CommandPalette').then(m => ({ default: m.CommandPalette })));
const DemoModeModal = lazy(() => import('./components/common/DemoModeModal').then(m => ({ default: m.DemoModeModal })));
const IocInvestigateModal = lazy(() => import('./components/common/IocInvestigateModal').then(m => ({ default: m.IocInvestigateModal })));

const API_BASE = 'http://127.0.0.1:8000/api';

export function App() {
  // Session State
  const [token, setToken] = useState<string>(() => localStorage.getItem('ts_token') || '');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ts_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(() => {
    const saved = localStorage.getItem('ts_org');
    return saved ? JSON.parse(saved) : null;
  });

  // Active View State initialized per authenticated role
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const savedUser = localStorage.getItem('ts_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser) as User;
        return getDefaultViewForRole(u.role);
      } catch {
        return 'analyst-soc';
      }
    }
    return 'analyst-soc';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Domain Telemetry State
  const [ctiList, setCtiList] = useState<CTIRecord[]>([]);
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [privacyStats, setPrivacyStats] = useState<PrivacyStats | null>(null);
  const [ledgerValid, setLedgerValid] = useState<boolean | null>(null);
  const [savedIndicatorIds, setSavedIndicatorIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ts_saved_indicators');
    return saved ? JSON.parse(saved) : [];
  });

  // Investigation & Modals State
  const [investigatingCti, setInvestigatingCti] = useState<CTIRecord | null>(null);
  const [investigatingIocId, setInvestigatingIocId] = useState<string | null>(null);
  const [stixBundle, setStixBundle] = useState<any | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);

  // Global Ctrl+K Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading States
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(false);
  const [isVerifyingLedger, setIsVerifyingLedger] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Handlers
  const handleLogin = (authToken: string, user: User, org: Organization) => {
    setToken(authToken);
    setCurrentUser(user);
    setCurrentOrg(org);
    localStorage.setItem('ts_token', authToken);
    localStorage.setItem('ts_user', JSON.stringify(user));
    localStorage.setItem('ts_org', JSON.stringify(org));

    // Post-Login Routing based strictly on authenticated role:
    // ADMIN -> /admin (admin-overview)
    // ANALYST -> /analyst (analyst-soc)
    // VALIDATOR -> /validator (validator-center)
    // THREAT_CONSUMER -> /intelligence (consumer-hub)
    const landingView = getDefaultViewForRole(user.role);
    setActiveView(landingView);

    fetchPlatformData(authToken, user.role);
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setCurrentOrg(null);
    localStorage.removeItem('ts_token');
    localStorage.removeItem('ts_user');
    localStorage.removeItem('ts_org');
    addToast('info', 'Session Closed', 'Signed out of ThreatShield console.');
  };

  // Data Fetching with permission awareness
  const fetchPlatformData = async (activeAuthToken?: string, activeRole?: UserRole) => {
    const authToken = activeAuthToken || token;
    const userRole = activeRole || currentUser?.role || 'ANALYST';
    if (!authToken) return;
    const headers = { 'Authorization': `Bearer ${authToken}` };

    try {
      // 1. Fetch CTI Records (Available to all authenticated roles)
      const ctiRes = await fetch(`${API_BASE}/cti/`, { headers });
      if (ctiRes.status === 401) {
        handleLogout();
        return;
      }
      if (ctiRes.ok) {
        const ctiData = await ctiRes.json();
        setCtiList(ctiData || []);
      }

      // 2. Fetch Ledger Status (Admin / Validator endpoints)
      if (userRole === 'ADMIN' || userRole === 'VALIDATOR') {
        try {
          const ledgerRes = await fetch(`${API_BASE}/ledger/verify`, { headers });
          if (ledgerRes.ok) {
            const lData = await ledgerRes.json();
            setLedgerValid(lData.valid);
          }

          const blocksRes = await fetch(`${API_BASE}/ledger/blocks`, { headers });
          if (blocksRes.ok) {
            const bData = await blocksRes.json();
            setBlocks(bData || []);
          }
        } catch {
          // Non-admin endpoint access may be restricted
        }
      }

      // 3. Fetch Privacy Budget
      const budgetRes = await fetch(`${API_BASE}/privacy/budget`, { headers });
      if (budgetRes.ok) {
        const budData = await budgetRes.json();
        setCurrentOrg(prev => {
          if (prev) {
            return { ...prev, privacy_budget: budData.privacy_budget };
          }
          return {
            id: budData.organization_id,
            name: 'CyberDefense Alpha',
            trust_score: 0.82,
            privacy_budget: budData.privacy_budget,
            status: 'ACTIVE',
            created_at: new Date().toISOString()
          };
        });
      }

      // 4. Fetch Organizations
      try {
        const orgsRes = await fetch(`${API_BASE}/organizations/`, { headers });
        if (orgsRes.ok) {
          const oData = await orgsRes.json();
          setOrganizations(oData || []);
        }
      } catch {
        // Fallback for role-scoped org views
      }
    } catch (err) {
      console.warn('Background telemetry update:', err);
    }
  };

  // CTI Ingestion Handler
  const handleSubmitCti = async (payload: {
    type: string;
    value: string;
    description: string;
    severity: number;
    confidence: number;
    source: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/cti/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addToast('success', 'Indicator Ingested', `Logged ${payload.type}: ${payload.value} to cryptographic ledger.`);
        fetchPlatformData();
        return true;
      } else {
        let errorMsg = 'Validation error';
        try {
          const err = await res.json();
          errorMsg = err.detail || err.message || errorMsg;
        } catch {
          errorMsg = `Server error (HTTP ${res.status})`;
        }

        if (res.status === 401) {
          addToast('error', 'Session Expired', 'Please log in again.');
          handleLogout();
          return false;
        }

        addToast('error', 'Ingestion Rejected', errorMsg);
        return false;
      }
    } catch (err: any) {
      addToast('error', 'Network Failure', err?.message || 'Failed to communicate with API.');
      return false;
    }
  };

  // STIX Export Handler
  const handleExportStix = async () => {
    try {
      const res = await fetch(`${API_BASE}/cti/export/stix-bundle`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStixBundle(data);
        addToast('success', 'STIX 2.1 Bundle Generated', 'OASIS STIX 2.1 specification bundle ready.');
      } else {
        addToast('warning', 'STIX Export', 'No CTI records available for STIX bundle generation.');
      }
    } catch {
      addToast('error', 'Export Error', 'Failed to export STIX bundle.');
    }
  };

  // Differential Privacy Query
  const handleConsumePrivacyBudget = async () => {
    setIsLoadingPrivacy(true);
    try {
      const res = await fetch(`${API_BASE}/privacy/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data: PrivacyStats = await res.json();
        setPrivacyStats(data);
        addToast('success', 'Differential Privacy Query', `Consumed ${data.epsilon_consumed} ε. Laplace noise applied.`);
        fetchPlatformData();
      } else {
        addToast('error', 'Budget Exhausted', 'Insufficient privacy budget remaining for DP query.');
      }
    } catch {
      addToast('error', 'Query Failed', 'Could not complete DP query.');
    } finally {
      setIsLoadingPrivacy(false);
    }
  };

  // Cryptographic Ledger Verification
  const handleVerifyLedger = async () => {
    setIsVerifyingLedger(true);
    try {
      const res = await fetch(`${API_BASE}/ledger/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLedgerValid(data.valid);
        if (data.valid) {
          addToast('success', 'Ledger Integrity Verified', 'SHA-256 cryptographic hash chain intact. Zero tampering detected.');
        } else {
          addToast('error', 'Tampering Detected', 'Cryptographic hash mismatch in historical ledger chain.');
        }
      }
    } catch {
      addToast('error', 'Ledger Audit Error', 'Failed to verify ledger integrity.');
    } finally {
      setIsVerifyingLedger(false);
    }
  };

  // Watchlist Bookmarking for Consumers
  const handleSaveIndicator = (cti: CTIRecord) => {
    setSavedIndicatorIds(prev => {
      let updated: string[];
      if (prev.includes(cti.id)) {
        updated = prev.filter(id => id !== cti.id);
        addToast('info', 'Watchlist Updated', `Removed ${cti.value} from saved intelligence.`);
      } else {
        updated = [...prev, cti.id];
        addToast('success', 'Watchlist Updated', `Bookmarked ${cti.value} to your watchlist.`);
      }
      localStorage.setItem('ts_saved_indicators', JSON.stringify(updated));
      return updated;
    });
  };

  const handleExportSavedWatchlist = () => {
    const savedItems = ctiList.filter(c => savedIndicatorIds.includes(c.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "threatshield_watchlist.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Watchlist Exported', 'Saved indicators exported to JSON file.');
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('info', 'Copied to Clipboard', 'Text copied.');
  };

  useEffect(() => {
    if (token) {
      fetchPlatformData(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Unauthenticated State -> Auth Screen
  if (!token || !currentUser) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <AuthView onLogin={handleLogin} onShowToast={addToast} />
      </>
    );
  }

  const role: UserRole = currentUser.role || 'ANALYST';
  const isAllowed = isViewAllowedForRole(role, activeView);

  // Render View Content based on activeView & role
  const renderViewContent = () => {
    if (!isAllowed) {
      return (
        <AccessRestricted
          onReturnToDashboard={() => setActiveView(getDefaultViewForRole(role))}
          roleName={role}
          moduleName={activeView}
        />
      );
    }

    switch (activeView) {
      // 1. ADMIN VIEWS
      case 'admin-overview':
        return (
          <AdminDashboardView
            organizations={organizations}
            ctiList={ctiList}
            blocks={blocks}
            ledgerValid={ledgerValid}
            currentOrg={currentOrg}
            onNavigate={setActiveView}
            onVerifyLedger={handleVerifyLedger}
            isVerifyingLedger={isVerifyingLedger}
          />
        );

      case 'admin-users':
        return <AdminUsersView onShowToast={addToast} />;

      // 2. ANALYST VIEWS
      case 'analyst-soc':
        return (
          <AnalystDashboardView
            ctiList={ctiList}
            currentOrg={currentOrg}
            token={token}
            onSelectCti={(cti) => setInvestigatingCti(cti)}
            onNavigate={setActiveView}
            onOpenStix={handleExportStix}
          />
        );

      // 3. VALIDATOR VIEWS
      case 'validator-center':
        return (
          <ValidatorDashboardView
            ctiList={ctiList}
            organizations={organizations}
            onSelectCti={(cti) => setInvestigatingCti(cti)}
            onNavigate={setActiveView}
            onShowToast={addToast}
          />
        );

      case 'validation-queue':
        return (
          <ValidatorQueueView
            ctiList={ctiList}
            organizations={organizations}
            onShowToast={addToast}
          />
        );

      case 'contributor-trust':
      case 'quality-analytics':
        return <ValidatorContributorTrustView organizations={organizations} />;

      // 4. THREAT CONSUMER VIEWS
      case 'consumer-hub':
        return (
          <ConsumerDashboardView
            ctiList={ctiList}
            organizations={organizations}
            onSelectCti={(cti) => setInvestigatingCti(cti)}
            onNavigate={setActiveView}
            onSaveIndicator={handleSaveIndicator}
            savedIndicatorIds={savedIndicatorIds}
          />
        );

      case 'cti-search':
        return (
          <ConsumerSearchView
            ctiList={ctiList}
            organizations={organizations}
            onSelectCti={(cti) => setInvestigatingCti(cti)}
            onSaveIndicator={handleSaveIndicator}
            savedIndicatorIds={savedIndicatorIds}
          />
        );

      case 'threat-landscape':
        return <ConsumerLandscapeView ctiList={ctiList} />;

      case 'recent-sightings':
        return <ConsumerSightingsView ctiList={ctiList} organizations={organizations} />;

      case 'saved-intel':
        return (
          <ConsumerSavedView
            savedCtis={ctiList.filter(c => savedIndicatorIds.includes(c.id))}
            onSelectCti={(cti) => setInvestigatingCti(cti)}
            onRemoveSaved={(id) => handleSaveIndicator({ id } as any)}
            onExportSaved={handleExportSavedWatchlist}
            onNavigateToSearch={() => setActiveView('cti-search')}
          />
        );

      // COMMON / SHARED VIEWS
      case 'cti-feed':
        return (
          <CtiFeedView
            ctiList={ctiList}
            currentUser={currentUser}
            onSelectCti={(cti) => setInvestigatingCti(cti)}
            onNavigate={setActiveView}
            onOpenStix={handleExportStix}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );

      case 'submit-cti':
        return (
          <SubmitCtiView
            currentUser={currentUser}
            onSubmit={handleSubmitCti}
            onNavigate={setActiveView}
          />
        );

      case 'investigate':
        return (
          <InvestigateView
            ctiList={ctiList}
            onSelectCti={(cti) => setInvestigatingCti(cti)}
            token={token}
          />
        );

      case 'threat-map':
        return <ThreatMapView ctiList={ctiList} />;

      case 'organizations':
      case 'trusted-sources':
        return (
          <OrganizationsView
            organizations={organizations}
            ctiList={ctiList}
          />
        );

      case 'trust-reputation':
        return (
          <TrustReputationView
            currentOrg={currentOrg}
            organizations={organizations}
          />
        );

      case 'privacy':
        return (
          <PrivacyView
            currentOrg={currentOrg}
            privacyStats={privacyStats}
            onConsumePrivacy={handleConsumePrivacyBudget}
            isLoadingPrivacy={isLoadingPrivacy}
          />
        );

      case 'federated-learning':
        return <FederatedLearningView />;

      case 'security-events':
        return (
          <SecurityEventsView
            blocks={blocks}
            organizations={organizations}
          />
        );

      case 'ledger':
      case 'audit-history':
        return (
          <LedgerView
            blocks={blocks}
            ledgerValid={ledgerValid}
            organizations={organizations}
            onVerifyLedger={handleVerifyLedger}
            isVerifyingLedger={isVerifyingLedger}
          />
        );

      // v1.2 ADVANCED RESEARCH & INTELLIGENCE EXTENSION VIEWS
      case 'knowledge-graph':
        return (
          <KnowledgeGraphView
            token={token}
            onOpenIoc={(id) => setInvestigatingIocId(id)}
          />
        );

      case 'threat-hunting':
      case 'attck-analytics':
        return (
          <ThreatHuntingView
            token={token}
            onOpenIoc={(id) => setInvestigatingIocId(id)}
            onOpenIncident={(_id) => setActiveView('incidents')}
          />
        );

      case 'incidents':
        return (
          <IncidentsView
            token={token}
            onOpenIoc={(id) => setInvestigatingIocId(id)}
          />
        );

      case 'fl-security-lab':
        return (
          <FlSecurityLabView
            token={token}
          />
        );

      case 'trust-center':
        return (
          <AdaptiveTrustView
            token={token}
            currentUser={currentUser}
            organizations={organizations}
          />
        );

      case 'privacy-center':
        return (
          <PrivacyCenterView
            token={token}
            currentOrg={currentOrg}
          />
        );

      case 'alerts-center':
        return (
          <AlertsCenterView
            token={token}
            onOpenIncident={(_id) => setActiveView('incidents')}
          />
        );

      case 'system-health':
        return <SystemHealthView token={token} />;

      case 'settings':
        return (
          <SettingsView
            currentUser={currentUser}
            currentOrg={currentOrg}
          />
        );

      default:
        return (
          <AnalystDashboardView
            ctiList={ctiList}
            currentOrg={currentOrg}
            token={token}
            onSelectCti={(cti) => setInvestigatingCti(cti)}
            onNavigate={setActiveView}
            onOpenStix={handleExportStix}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Global Command Center (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setActiveView}
        onStartDemo={() => setIsDemoTourOpen(true)}
        onOpenIoc={(id) => setInvestigatingIocId(id)}
        token={token}
      />

      {/* Guided Demo Mode Tour */}
      <DemoModeModal
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onNavigate={setActiveView}
      />

      {/* 360° IOC Investigation Modal */}
      <IocInvestigateModal
        iocId={investigatingIocId}
        isOpen={!!investigatingIocId}
        onClose={() => setInvestigatingIocId(null)}
        token={token}
        onFeedbackSubmitted={() => addToast('success', 'Feedback Committed', 'Validator assessment recorded to audit chain.')}
      />

      {/* Slide-over Indicator Drawer */}
      <InvestigationDrawer
        cti={investigatingCti}
        onClose={() => setInvestigatingCti(null)}
        onCopyText={handleCopyText}
      />

      {/* STIX 2.1 JSON Specification Modal */}
      <StixModal
        bundle={stixBundle}
        onClose={() => setStixBundle(null)}
        onCopy={handleCopyText}
      />

      {/* Role-Specific Navigation Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        currentOrg={currentOrg}
        ctiCount={ctiList.length}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Application Container */}
      <div className="main-wrapper">
        {/* Role-Specific Header */}
        <Header
          activeView={activeView}
          currentUser={currentUser}
          currentOrg={currentOrg}
          ledgerValid={ledgerValid}
          onLogout={handleLogout}
          onOpenStix={handleExportStix}
          onSelectCti={(cti) => setInvestigatingCti(cti)}
          ctiList={ctiList}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Dynamic View Canvas */}
        <main className="main-content">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-800">Loading Workspace...</h4>
                <p className="text-xs text-slate-400">Loading component telemetry and styles</p>
              </div>
            </div>
          }>
            {renderViewContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
