import React from 'react';

interface SeverityBadgeProps {
  severity: number | string;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg' | string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  showScore = true,
  size = 'md'
}) => {
  const numericScore = typeof severity === 'number' ? severity : (
    severity === 'CRITICAL' ? 9.0 :
    severity === 'HIGH' ? 7.5 :
    severity === 'MEDIUM' ? 5.0 :
    severity === 'LOW' ? 2.5 : 5.0
  );

  const getSeverityConfig = (score: number) => {
    if (score >= 8.5) {
      return {
        label: 'CRITICAL',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-600'
      };
    }
    if (score >= 7.0) {
      return {
        label: 'HIGH',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        dot: 'bg-orange-600'
      };
    }
    if (score >= 4.0) {
      return {
        label: 'MEDIUM',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-600'
      };
    }
    return {
      label: 'LOW',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-600'
    };
  };

  const config = getSeverityConfig(numericScore);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold border rounded-full ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
      {showScore && (
        <span className="font-mono text-[10px] opacity-80">
          ({numericScore.toFixed(1)})
        </span>
      )}
    </span>
  );
};
