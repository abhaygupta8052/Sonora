import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-20 h-20 rounded-3xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 flex items-center justify-center mb-6">
        <Radio className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
        404
      </h1>
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
        Page Not Found
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        The musical page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/25 active:scale-95 transition-all"
      >
        <Home className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
