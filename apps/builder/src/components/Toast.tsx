'use client';

import { useState, useCallback, useEffect, createContext, useContext } from 'react';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={`toast ${visible ? 'show' : ''}`}>
        {message}
      </div>
    </ToastContext.Provider>
  );
}
