'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [exiting, setExiting] = useState(false);
  const Icon = icons[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onRemove, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${colors[toast.type]}`}
      style={{ animation: exiting ? 'toastOut 0.3s ease forwards' : 'toastIn 0.3s ease forwards' }}
    >
      <Icon size={18} className={iconColors[toast.type]} />
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => {
          setExiting(true);
          setTimeout(onRemove, 300);
        }}
        className="opacity-50 hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => onRemove(t.id)} />
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
