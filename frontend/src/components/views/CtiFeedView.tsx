import React, { useState } from 'react';
import type { CTIRecord, User, ActiveView } from '../../types';
import {
  SearchIcon,
  PlusIcon,
  FileCodeIcon,
  ShieldIcon
} from '../icons/Icons';

interface CtiFeedViewProps {
  ctiList: CTIRecord[];
  currentUser: User | null;
  onSelectCti: (cti: CTIRecord) => void;
  onNavigate: (view: ActiveView) => void;
  onOpenStix: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const CtiFeedView: React.FC<CtiFeedViewProps> = ({
  ctiList,
  onSelectCti,
  onNavigate,
  onOpenStix,
  searchQuery,
  setSearchQuery
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [minSeverity, setMinSeverity] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCtis = ctiList.filter(c => {
    const matchesSearch = !searchQuery.trim() ||
      c.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'all' || c.type === selectedType;
    const matchesSeverity = c.severity >= minSeverity;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (severity: number) => {
    if (severity >= 8.5) return <span className="badge badge-critical">Critical {severity.toFixed(1)}</span>;
    if (severity >= 7.0) return <span className="badge badge-high">High {severity.toFixed(1)}</span>;
    if (severity >= 4.0) return <span className="badge badge-medium">Medium {severity.toFixed(1)}</span>;
    return <span className="badge badge-low">Low {severity.toFixed(1)}</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="badge badge-success">ACTIVE</span>;
      case 'DUPLICATE': return <span className="badge badge-high">DUPLICATE</span>;
      case 'EXPIRED': return <span className="badge badge-muted">EXPIRED</span>;
      case 'INVALID': return <span className="badge badge-critical">INVALID</span>;
      default: return <span className="badge badge-low">{status || 'ACTIVE'}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Threat Intelligence Feed</h1>
          <div className="page-subtitle">
            Federated Indicators of Compromise (IOCs) with STIX 2.1 compliance and confidence scoring
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={onOpenStix}>
            <FileCodeIcon size={13} />
            <span>STIX 2.1 JSON</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('submit-cti')}>
            <PlusIcon size={13} />
            <span>Submit Indicator</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="soc-card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative' }}>
            <SearchIcon size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px' }}
              placeholder="Search value, type, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Indicator Types</option>
              <option value="ipv4-addr">IPv4 Address (ipv4-addr)</option>
              <option value="domain-name">Domain Name (domain-name)</option>
              <option value="file-hash">File Hash (file-hash)</option>
              <option value="url">URL (url)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DUPLICATE">DUPLICATE</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="INVALID">INVALID</option>
            </select>
          </div>

          {/* Min Severity Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Min Severity:</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minSeverity}
              onChange={(e) => setMinSeverity(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
            <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, minWidth: '24px' }}>
              {minSeverity.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Indicators Table */}
      <div className="soc-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Showing {filteredCtis.length} of {ctiList.length} Indicators
          </div>
          <span className="data-tag data-tag-live">Live SQLite Store</span>
        </div>

        {filteredCtis.length > 0 ? (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Indicator Value</th>
                  <th>Type</th>
                  <th>Confidence</th>
                  <th>Source</th>
                  <th>Observed (UTC)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCtis.map((cti) => (
                  <tr key={cti.id} className="clickable" onClick={() => onSelectCti(cti)}>
                    <td>{getSeverityBadge(cti.severity)}</td>
                    <td className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
                      {cti.value}
                    </td>
                    <td>
                      <span className="badge badge-muted font-mono">{cti.type}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="progress-bar-bg" style={{ width: '48px' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${(cti.confidence * 100).toFixed(0)}%`,
                              backgroundColor: cti.confidence >= 0.8 ? 'var(--color-success)' : 'var(--color-warning)'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>
                          {(cti.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '11.5px' }}>{cti.source || 'Local Sensor'}</td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(cti.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td>{getStatusBadge(cti.status)}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCti(cti);
                        }}
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ShieldIcon className="empty-icon" />
            <div className="empty-title">No Indicators Match Current Filter</div>
            <div className="empty-desc">Try clearing the search box or adjusting the minimum severity slider.</div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setMinSeverity(0);
                setStatusFilter('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
