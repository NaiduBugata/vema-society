import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { subscribeToApiLoading } from '../api/loadingBus';

const SHOW_DELAY_MS = 600;

const GlobalLoadingOverlay = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return subscribeToApiLoading(setPendingCount);
  }, []);

  useEffect(() => {
    if (pendingCount > 0) {
      const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [pendingCount]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="card flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
          VEMACS is Loading
        </div>
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;
