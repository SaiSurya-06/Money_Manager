import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../components/ui/Icon';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'rgba(76, 175, 80, 0.15)',
          border: 'rgba(76, 175, 80, 0.3)',
          text: 'text-green-500',
          icon: 'CheckCircle'
        };
      case 'warning':
        return {
          bg: 'rgba(255, 152, 0, 0.15)',
          border: 'rgba(255, 152, 0, 0.3)',
          text: 'text-amber-500',
          icon: 'AlertTriangle'
        };
      case 'error':
        return {
          bg: 'rgba(244, 67, 54, 0.15)',
          border: 'rgba(244, 67, 54, 0.3)',
          text: 'text-red-500',
          icon: 'XCircle'
        };
      case 'info':
      default:
        return {
          bg: 'rgba(33, 150, 243, 0.15)',
          border: 'rgba(33, 150, 243, 0.3)',
          text: 'text-blue-500',
          icon: 'Info'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Node */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const styles = getTypeStyles(toast.type);
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border backdrop-blur-md"
                style={{
                  backgroundColor: styles.bg,
                  borderColor: styles.border,
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon name={styles.icon} className={styles.text} size={22} />
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-4"
                >
                  <Icon name="X" size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
