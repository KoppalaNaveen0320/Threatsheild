import React from 'react';
import { SearchIcon, FilterIcon, RefreshCwIcon } from '../icons/Icons';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  typeFilter?: string;
  onTypeFilterChange?: (t: string) => void;
  typeOptions?: FilterOption[];
  severityFilter?: string;
  onSeverityFilterChange?: (s: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (s: string) => void;
  onReset?: () => void;
  extraActions?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Filter indicators, hashes, domains...',
  typeFilter,
  onTypeFilterChange,
  typeOptions = [
    { label: 'All Types', value: 'ALL' },
    { label: 'IPv4 Address', value: 'ipv4-addr' },
    { label: 'Domain Name', value: 'domain-name' },
    { label: 'File Hash (SHA-256)', value: 'file-hash' },
    { label: 'URL', value: 'url' }
  ],
  severityFilter,
  onSeverityFilterChange,
  statusFilter,
  onStatusFilterChange,
  onReset,
  extraActions
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '16px'
      }}
    >
      {/* Left: Search input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <SearchIcon
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* Right: Dropdowns & Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {onTypeFilterChange && typeFilter !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FilterIcon size={12} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              style={{ height: '34px', fontSize: '11.5px', padding: '4px 10px' }}
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {onSeverityFilterChange && severityFilter !== undefined && (
          <select
            className="form-select"
            value={severityFilter}
            onChange={(e) => onSeverityFilterChange(e.target.value)}
            style={{ height: '34px', fontSize: '11.5px', padding: '4px 10px' }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical (≥ 8.5)</option>
            <option value="HIGH">High (7.0 - 8.4)</option>
            <option value="MEDIUM">Medium (4.0 - 6.9)</option>
            <option value="LOW">Low (&lt; 4.0)</option>
          </select>
        )}

        {onStatusFilterChange && statusFilter !== undefined && (
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{ height: '34px', fontSize: '11.5px', padding: '4px 10px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="DUPLICATE">Duplicate</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
          </select>
        )}

        {onReset && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onReset}
            title="Reset Filters"
            style={{ height: '34px', padding: '0 8px' }}
          >
            <RefreshCwIcon size={12} />
          </button>
        )}

        {extraActions}
      </div>
    </div>
  );
};
