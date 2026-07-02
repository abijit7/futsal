import { useEffect, useRef, useState } from 'react';

export function useAnimatedDisclosure(duration = 180) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const timer = useRef<number | null>(null);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const open = () => {
    clearTimer();
    setIsMounted(true);
    setIsClosing(false);
    setIsOpen(true);
  };

  const close = () => {
    if (!isMounted) return;
    clearTimer();
    setIsOpen(false);
    setIsClosing(true);
    timer.current = window.setTimeout(() => {
      setIsMounted(false);
      setIsClosing(false);
    }, duration);
  };

  const toggle = () => {
    if (isMounted && isOpen) close();
    else open();
  };

  useEffect(() => clearTimer, []);

  return {
    close,
    isClosing,
    isMounted,
    isOpen,
    open,
    state: isClosing ? 'closing' : 'open',
    toggle
  };
}
