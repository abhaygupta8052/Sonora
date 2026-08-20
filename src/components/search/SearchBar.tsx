import React, { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearchSubmit,
  isLoading = false,
  placeholder = "Search songs, artists, or your mood (e.g. 'mood off', 'romantic vibe', 'gym')...",
  autoFocus = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit && value.trim()) {
      onSearchSubmit(value.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center w-full rounded-2xl bg-slate-100 dark:bg-dark-card border transition-all duration-200 ${
        isFocused
          ? 'border-brand-500 ring-4 ring-brand-500/10 shadow-lg'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="pl-4 text-slate-400">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
        ) : (
          <Search className="w-5 h-5" />
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full py-3.5 pl-3 pr-10 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Clear search query"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  );
};
