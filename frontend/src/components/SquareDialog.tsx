import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface SquareDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  titleId: string;
  maxWidth?: string;
  children: React.ReactNode;
}

/**
 * Native <dialog> component tuân thủ hướng dẫn light-dismiss-a-dialog:
 * - Sử dụng closedby="any" và dialog.showModal()
 * - Chuẩn taste-skill framed-sheet: đường viền 1px, tiêu đề sentence-case, không gradient, không đổ bóng thừa
 */
export const SquareDialog: React.FC<SquareDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  titleId,
  maxWidth = '780px',
  children
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    // Fallback for browsers without native closedBy support
    const handleBackdropClick = (event: MouseEvent) => {
      if ('closedBy' in HTMLDialogElement.prototype) return;
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (isDialogContent) return;
      dialog.close();
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('click', handleBackdropClick);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby={titleId}
      className="wf-modal-dialog"
      style={{ maxWidth }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
        <div>
          <h3
            id={titleId}
            className="font-semibold text-base m-0 text-[var(--text)]"
          >
            {title}
          </h3>
          {subtitle && <div className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
          className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--raised)] border border-transparent hover:border-[var(--control)] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">{children}</div>
    </dialog>
  );
};
