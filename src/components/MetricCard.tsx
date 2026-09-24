import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  isDemo?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeType = 'info',
  isDemo,
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'danger':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'info':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="relative p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 transition-all group">
      {/* Subtle top indicator line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent group-hover:via-cyan-400 transition-all" />

      {/* Demo watermark if applicable */}
      {isDemo && (
        <span className="absolute top-3 right-3 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Demo Data
        </span>
      )}

      <div className="flex items-start justify-between">
        <div className="flex flex-col space-y-1">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {value}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/30 transition-all shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
        <span className="text-slate-400 truncate">{subtitle}</span>
        {badge && (
          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase shrink-0 ${getBadgeStyle()}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
