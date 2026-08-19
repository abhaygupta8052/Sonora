import React from 'react';
import { History, X, Trash2 } from 'lucide-react';

interface SearchHistoryProps {
  history: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClear: () => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onRemove,
  onClear
}) => {
  if (history.length === 0) return null;

  return (
    <div className="my-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <History className="w-3.5 h-3.5" />
          <span>Recent Searches</span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {history.map((item) => (
          <div
            key={item}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-dark-card hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            onClick={() => onSelect(item)}
          >
            <span>{item}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item);
              }}
              className="text-slate-400 hover:text-rose-500 rounded-full p-0.5"
              aria-label={`Remove ${item} from search history`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
