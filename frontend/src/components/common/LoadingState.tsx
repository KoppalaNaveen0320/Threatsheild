import React from 'react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading real-time intelligence telemetry...",
  subtext = "Querying authoritative threat database and correlation graph."
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-800">{message}</h4>
        <p className="text-xs text-slate-400 font-medium">{subtext}</p>
      </div>
    </div>
  );
};
