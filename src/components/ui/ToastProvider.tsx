import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n/utils';

export interface Toast {
  id: string;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  duration?: number; // ms
}

interface ToastContextValue {
  push: (t: Omit<Toast, 'id'>) => string;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { t } = useI18n();
  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, duration: 4000, ...toast }]);
    return id;
  }, []);
  const remove = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // Auto dismiss
  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => remove(t.id), t.duration));
    return () => { timers.forEach(clearTimeout); };
  }, [toasts, remove]);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      {createPortal(
        <div className="fixed z-[60] top-4 right-4 w-72 space-y-2" aria-live="polite" role="region" aria-label="Notifications">
          {toasts.map(tw => (
            <div key={tw.id} className={`rounded shadow px-4 py-3 text-sm border flex items-start gap-2 bg-white/95 backdrop-blur-sm ${
              tw.type==='success'? 'border-green-300' : tw.type==='error'? 'border-rose-300' : 'border-slate-200'
            }`}>
              <div className="flex-1">
                <div className="font-semibold mb-0.5">
                  {tw.title || (tw.type==='success'? t('toast.success'): tw.type==='error'? t('toast.error') : '')}
                </div>
                <div className="text-slate-600 break-words whitespace-pre-wrap">{tw.message}</div>
              </div>
              <button onClick={()=> remove(tw.id)} className="text-slate-400 hover:text-slate-600 focus:outline-none" aria-label="Close">×</button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export function useToast(){
  const ctx = useContext(ToastContext);
  if(!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
