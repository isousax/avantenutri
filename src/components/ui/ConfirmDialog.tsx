import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  danger?: boolean;
  autoFocus?: boolean;
}

/**
 * Accessible reusable confirmation dialog (no external dependencies).
 * Features:
 * - Focus trap & return focus to previously focused element
 * - ESC to close
 * - aria-modal / role="dialog" semantics
 * - Optional danger style
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  danger,
  autoFocus = true
}) => {
  const previousFocus = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  // Manage focus lifecycle
  useEffect(() => {
    if (open) {
      previousFocus.current = (document.activeElement as HTMLElement) || null;
      // Delay to ensure element exists
      requestAnimationFrame(() => {
        if (autoFocus && confirmBtnRef.current) confirmBtnRef.current.focus();
      });
    } else if (!open && previousFocus.current) {
      previousFocus.current.focus();
    }
  }, [open, autoFocus]);

  // ESC handler & focus trap
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.getAttribute('disabled'));
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-labelledby="confirm-dialog-title"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={dialogRef}
        className="relative bg-white dark:bg-slate-800 rounded shadow-lg w-[320px] max-w-[90%] p-4 text-sm animate-scale-in"
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold mb-2 text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        {description && (
          <p className="text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap break-words">
            {description}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring focus:ring-slate-400"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`px-3 py-1.5 rounded text-white focus:outline-none focus:ring focus:ring-offset-1 disabled:opacity-60 ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-400'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
