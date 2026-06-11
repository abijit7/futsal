import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function useModalAccessibility(open, dialogRef, onClose) {
  useEffect(() => {
    if (!open) return undefined;

    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusable = getFocusable(dialog);

    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      dialog?.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const currentFocusable = getFocusable(dialogRef.current);
      if (currentFocusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('modal-open');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
      if (previousActive && document.contains(previousActive)) {
        previousActive.focus();
      }
    };
  }, [open, dialogRef, onClose]);
}

function getFocusable(dialog) {
  if (!dialog) return [];
  return Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((element) => element instanceof HTMLElement && !element.hasAttribute('hidden'));
}
