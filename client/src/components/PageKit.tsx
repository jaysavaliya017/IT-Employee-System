import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon: Icon, actions, className = '' }) => (
  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}>
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <span className="hidden sm:grid mt-0.5 h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

type StatTone = 'primary' | 'emerald' | 'red' | 'amber' | 'violet' | 'sky' | 'slate';

const TONES: Record<StatTone, { bg: string; text: string; ring: string }> = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-600', ring: 'ring-primary-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-100' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' },
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
  trend?: { value: string; positive?: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, tone = 'primary', hint, trend }) => {
  const t = TONES[tone];
  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200/70 p-5 transition-shadow duration-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${t.bg} ${t.text} ${t.ring}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
    {Icon && (
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-300 mb-4">
        <Icon className="h-7 w-7" />
      </span>
    )}
    <p className="text-sm font-semibold text-slate-900">{title}</p>
    {description && <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default PageHeader;
