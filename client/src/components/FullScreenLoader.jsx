import { Loader2 } from 'lucide-react';

const FullScreenLoader = ({ label = 'Loading…', overlay = false, zIndexClass = 'z-50' }) => {
  const containerClass = overlay
    ? `fixed inset-0 ${zIndexClass} flex items-center justify-center bg-dark/60`
    : `fixed inset-0 ${zIndexClass} flex items-center justify-center bg-dark`;

  return (
    <div className={containerClass} role="status" aria-live="polite" aria-label={label}>
      <div className="card flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{label}</div>
      </div>
    </div>
  );
};

export default FullScreenLoader;
