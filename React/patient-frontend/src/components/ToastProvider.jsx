import { useCallback, useContext, useMemo, useState, createContext } from "react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title = "Notification", message, variant = "success", duration = 3500 }) => {
      toastIdCounter += 1;
      const id = toastIdCounter;
      const safeMessage = message || "Action completed.";

      setToasts((prev) => [...prev, { id, title, message: safeMessage, variant }]);

      window.setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast show border-0 shadow-sm mb-2 text-bg-${toast.variant}`}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="d-flex align-items-start">
              <div className="toast-body">
                <strong className="d-block mb-1">{toast.title}</strong>
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 mt-2"
                aria-label="Close"
                onClick={() => removeToast(toast.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}