import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';
import { ToastContext } from './contexts';
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]),
    timers = useRef(new Set());
  const notify = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();
    setToasts((v) => [...v.slice(-3), { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((v) => v.filter((t) => t.id !== id));
      timers.current.delete(timer);
    }, 6000);
    timers.current.add(timer);
  }, []);
  useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={'toast ' + t.type}>
            {t.type === 'success' ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}
            <span>{t.message}</span>
            <button
              className="icon-btn"
              aria-label="Dismiss notification"
              onClick={() => setToasts((v) => v.filter((i) => i.id !== t.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
