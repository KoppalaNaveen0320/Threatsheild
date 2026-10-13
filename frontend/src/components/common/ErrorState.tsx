import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Telemetry Synchronization Error",
  message = "Failed to communicate with authoritative backend subsystem. Please check network connectivity and authentication credentials.",
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-rose-50/50 border border-rose-200 rounded-2xl space-y-3">
      <div className="text-4xl">⚠️</div>
      <h3 className="text-base font-bold text-rose-950">{title}</h3>
      <p className="text-xs text-rose-700 max-w-md font-medium leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-xs"
        >
          Retry Synchronization
        </button>
      )}
    </div>
  );
};
