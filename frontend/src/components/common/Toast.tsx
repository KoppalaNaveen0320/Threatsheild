import React from 'react';
import type { ToastMessage } from '../../types';
import { CheckCircleIcon, AlertTriangleIcon, XIcon } from '../icons/Icons';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 9999,
      maxWidth: '400px'
    }}>
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const borderColor = isSuccess ? '#10b981' : isError ? '#f43f5e' : '#0284c7';
        const bgColor = '#0f172a';

        return (
          <div
            key={toast.id}
            style={{
              background: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              color: '#f8fafc',
              animation: 'fadeIn 0.2s ease-in-out'
            }}
          >
            <div style={{ marginTop: '2px', color: borderColor }}>
              {isSuccess ? <CheckCircleIcon size={18} /> : <AlertTriangleIcon size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{toast.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{toast.message}</div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <XIcon size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
