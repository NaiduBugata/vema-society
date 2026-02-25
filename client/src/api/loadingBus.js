let pendingCount = 0;
const listeners = new Set();

const notify = () => {
  for (const listener of listeners) {
    try {
      listener(pendingCount);
    } catch {
      // ignore listener errors
    }
  }
};

export const getPendingCount = () => pendingCount;

export const subscribeToApiLoading = (listener) => {
  listeners.add(listener);
  listener(pendingCount);
  return () => listeners.delete(listener);
};

export const incrementPending = () => {
  pendingCount += 1;
  notify();
};

export const decrementPending = () => {
  pendingCount = Math.max(0, pendingCount - 1);
  notify();
};
