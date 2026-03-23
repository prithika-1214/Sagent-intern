import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const createToast = (message, type = 'info') => ({
  id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
  message,
  type
});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const toast = createToast(message, type);
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => removeToast(toast.id), 3500);
  }, [removeToast]);

  const value = useMemo(
    () => ({
      showToast,
      success: (message) => showToast(message, 'success'),
      error: (message) => showToast(message, 'error'),
      info: (message) => showToast(message, 'info')
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
};
