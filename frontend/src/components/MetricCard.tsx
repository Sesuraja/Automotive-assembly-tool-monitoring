import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
  };
  highlightColor?: 'blue' | 'green' | 'amber' | 'red' | 'gray';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtitle,
  icon,
  trend,
  highlightColor = 'gray',
}) => {
  const borderHighlight = {
    blue: 'border-l-4 border-l-blue-600',
    green: 'border-l-4 border-l-emerald-600',
    amber: 'border-l-4 border-l-amber-500',
    red: 'border-l-4 border-l-red-600',
    gray: 'border-l border-l-gray-200',
  }[highlightColor];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-xs ${borderHighlight} transition-all hover:shadow-sm`}>
      <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
        <span>{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</span>
        {unit && <span className="text-xs font-medium text-gray-500">{unit}</span>}
      </div>
      {(subtitle || trend) && (
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-medium ${
                trend.neutral ? 'text-gray-500' : trend.positive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
