import { createContext, useContext, useState, useRef, useCallback } from 'react';
import Toast, { ToastType } from '../components/Toast';

type ToastCtx = {
  showToast: (message: string, type?: ToastType) => void;
};

const Ctx = createContext<ToastCtx>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, t: ToastType = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(msg);
    setType(t);
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      <Toast message={message} type={type} visible={visible} />
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
