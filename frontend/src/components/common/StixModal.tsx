import React from 'react';
import { XIcon, CopyIcon, FileCodeIcon } from '../icons/Icons';

interface StixModalProps {
  bundle: any;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export const StixModal: React.FC<StixModalProps> = ({ bundle, onClose, onCopy }) => {
  if (!bundle) return null;

  const jsonString = JSON.stringify(bundle, null, 2);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-header)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCodeIcon size={16} />
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
              OASIS STIX 2.1 JSON Bundle
            </span>
            <span className="badge badge-verified" style={{ fontSize: '9.5px' }}>Compliant</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '4px 6px' }}>
            <XIcon size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', background: 'var(--bg-app)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Contains STIX 2.1 <code className="font-mono">identity</code> and <code className="font-mono">indicator</code> objects exported for SIEM / SOAR ingestion.
          </div>
          <pre className="font-mono" style={{
            background: 'var(--bg-sidebar)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            color: '#38BDF8',
            fontSize: '11.5px',
            lineHeight: 1.5,
            overflowX: 'auto',
            maxHeight: '400px'
          }}>
            {jsonString}
          </pre>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Total Objects: <strong>{bundle.objects ? bundle.objects.length : 0}</strong>
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onCopy(jsonString)}>
              <CopyIcon size={12} />
              <span>Copy JSON</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
