import React from 'react';
import useUIStore from '../../store/uiStore.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        const Icon = isSuccess
          ? CheckCircle2
          : isError
          ? AlertCircle
          : Info;

        const borderStyle = isSuccess
          ? 'border-emerald-200 bg-white text-emerald-900 shadow-lg'
          : isError
          ? 'border-rose-200 bg-white text-rose-900 shadow-lg'
          : isWarning
          ? 'border-amber-200 bg-white text-amber-900 shadow-lg'
          : 'border-stone-200 bg-white text-stone-900 shadow-lg';

        const iconColor = isSuccess
          ? 'text-emerald-500'
          : isError
          ? 'text-rose-500'
          : isWarning
          ? 'text-amber-500'
          : 'text-salon-700';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border ${borderStyle} transition-all animate-in slide-in-from-bottom-2 duration-200`}
            role="alert"
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />

            <div className="flex-1 min-w-0">
              {toast.title && <h5 className="text-xs font-bold mb-0.5">{toast.title}</h5>}
              <p className="text-xs text-stone-600 leading-relaxed break-words">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-stone-700 p-0.5 rounded-md"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default React.memo(ToastContainer);
