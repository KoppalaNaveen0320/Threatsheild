import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode | React.FC<any> | string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No intelligence data available",
  description = "No matching records were found for the current query or filter parameters.",
  icon = "📂",
  actionText,
  onAction
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <span className="text-4xl">{icon}</span>;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon as React.FC<{ size?: number }>;
      return <IconComponent size={36} />;
    }
    return icon;
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
      <div className="text-slate-400">{renderIcon()}</div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md font-medium leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
