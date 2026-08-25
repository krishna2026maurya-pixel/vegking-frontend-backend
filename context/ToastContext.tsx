'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3.5 max-w-sm w-[calc(100vw-40px)] sm:w-80 pointer-events-none">
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          
          return (
            <div
              key={toast.id}
              className="flex items-center justify-between gap-4 p-3 bg-white/95 dark:bg-gray-900/95 border border-gray-100 dark:border-gray-800/80 rounded-2xl shadow-[0_16px_45px_rgba(0,0,0,0.08)] backdrop-blur-md pointer-events-auto animate-slideInRight transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isError 
                    ? 'bg-red-50 text-red-500' 
                    : isSuccess 
                      ? 'bg-emerald-50 text-emerald-500' 
                      : 'bg-blue-50 text-blue-500'
                }`}>
                  {isError && <AlertTriangle className="h-4.5 w-4.5" />}
                  {isSuccess && <CheckCircle className="h-4.5 w-4.5" />}
                  {!isError && !isSuccess && <Info className="h-4.5 w-4.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-gray-900 dark:text-white leading-none">
                    {isError ? 'Action Failed' : isSuccess ? 'Success' : 'Notification'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 mt-1 leading-normal break-words">
                    {toast.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-gray-300 hover:text-gray-500 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition shrink-0 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
