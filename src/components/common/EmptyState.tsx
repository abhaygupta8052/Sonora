import React from 'react';
import { LucideIcon, Music2 } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Music2,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 my-6 rounded-2xl bg-slate-50/50 dark:bg-dark-card/30 border border-slate-200/60 dark:border-slate-800/60 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 ring-8 ring-brand-500/5">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
