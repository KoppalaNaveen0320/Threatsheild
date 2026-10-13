export type UserRole = 'ADMIN' | 'ANALYST' | 'VALIDATOR' | 'THREAT_CONSUMER';

export interface Organization {
  id: string;
  name: string;
  trust_score: number;
  privacy_budget: number;
  status: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organization_id: string;
  created_at: string;
}

export interface CTIRecord {
  id: string;
  organization_id: string;
  type: string;
  value: string;
  description?: string;
  severity: number;
  confidence: number;
  source?: string;
  status: string;
  created_at: string;
  validation_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'NEED_EVIDENCE';
  quality_score?: number;
}

export interface LedgerBlock {
  index: number;
  timestamp: string;
  previous_hash: string;
  payload_hash: string;
  organization_id: string;
  event_type: string;
  event_id: string;
  current_hash: string;
}

export interface PrivacyStats {
  active_threats: number;
  verified_iocs: number;
  epsilon_consumed: number;
  mechanism: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'identity' | 'indicator' | 'attack-pattern' | 'malware' | 'threat-actor';
  indicator_type?: string;
  value?: string;
  severity?: number;
  confidence?: number;
  trust_score?: number;
  status?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
}

export interface CorrelationGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface SystemHealthData {
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  timestamp: string;
  version: string;
  components: {
    database?: { status: string; engine?: string; error?: string };
    stix_engine?: { status: string; version?: string; error?: string };
    privacy_engine?: { status: string; mechanism?: string; error?: string };
    trust_engine?: { status: string; model?: string; error?: string };
    ledger_engine?: { status: string; chain_valid?: boolean; algorithm?: string; error?: string };
    fl_engine?: { status: string; strategy?: string; framework?: string; error?: string };
  };
}

export interface SecurityEvent {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  event_type: string;
  organization_name: string;
  organization_id: string;
  resource: string;
  timestamp: string;
  status: 'AUDITED' | 'FLAGGED' | 'RESOLVED';
  hash: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface ValidationDecision {
  cti_id: string;
  status: 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'NEED_EVIDENCE';
  reason?: string;
  notes?: string;
  validator_id: string;
  timestamp: string;
}

export interface ThreatSighting {
  id: string;
  indicator_id: string;
  indicator_value: string;
  indicator_type: string;
  source_org: string;
  sighting_count: number;
  first_seen: string;
  last_seen: string;
  confidence: number;
  severity: number;
  location?: string;
  mitigation?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: 'NEW' | 'TRIAGED' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
  organization_id: string;
  assigned_to_user_id?: string;
  linked_cti_count?: number;
  linked_techniques?: string[];
  resolution_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  trigger_type: string;
  description: string;
  organization_id?: string;
  recommended_action: string;
  is_resolved: boolean;
  created_at: string;
}

export interface ThreatShieldScoreV2 {
  threatshield_score_v2: number;
  classification: 'CRITICAL_ALERT' | 'HIGH_PRIORITY' | 'ELEVATED_MONITORING' | 'INFORMATIONAL_FEED';
  component_breakdown: {
    quality_contribution: number;
    trust_contribution: number;
    relevance_contribution: number;
    freshness_contribution: number;
    graph_centrality_contribution: number;
    sighting_contribution: number;
  };
  explainability_reasons: string[];
}

export interface OrganizationRiskData {
  organization_id: string;
  organization_name: string;
  risk_score: number;
  risk_tier: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW';
  components: {
    trust_deficit_risk: number;
    false_positive_risk: number;
    fl_anomaly_risk: number;
    privacy_depletion_risk: number;
  };
  reasons: string[];
}

export type ActiveView = 
  // Admin Views
  | 'admin-overview'
  | 'admin-users'
  | 'organizations'
  | 'security-events'
  | 'ledger'
  | 'privacy'
  | 'system-health'
  | 'settings'
  
  // Analyst Views
  | 'analyst-soc'
  | 'cti-feed'
  | 'investigate'
  | 'threat-map'
  | 'submit-cti'
  | 'trust-reputation'

  // v1.2 Advanced Intelligence Views
  | 'knowledge-graph'
  | 'threat-hunting'
  | 'incidents'
  | 'attck-analytics'
  | 'trust-center'
  | 'fl-security-lab'
  | 'privacy-center'
  | 'alerts-center'
  
  // Validator Views
  | 'validator-center'
  | 'validation-queue'
  | 'contributor-trust'
  | 'quality-analytics'
  | 'audit-history'
  
  // Threat Consumer Views
  | 'consumer-hub'
  | 'cti-search'
  | 'threat-landscape'
  | 'trusted-sources'
  | 'recent-sightings'
  | 'saved-intel'

  // Legacy / Direct
  | 'overview'
  | 'federated-learning';

