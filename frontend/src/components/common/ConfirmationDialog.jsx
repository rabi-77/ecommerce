import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable confirmation dialog.
 * Props:
 *  - open: boolean – whether the dialog is visible.
 *  - title: string – heading text.
 *  - message: string | ReactNode – optional message below the title (ignored if children passed).
 *  - confirmLabel: string – text for confirm button (default: "Confirm").
 *  - cancelLabel: string – text for cancel button (default: "Cancel").
 *  - loading: boolean – disables buttons & shows spinner on confirm.
 *  - onConfirm: () => void – called when user confirms.
 *  - onCancel: () => void – called when user cancels or presses Escape / clicks outside.
 *  - children: ReactNode – optional custom body; overrides message.
 */
const ConfirmationDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  const dialogRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  // Trap focus inside dialog while open
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const firstFocusable = dialogRef.current.querySelector(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 bg-opacity-50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-lg p-6 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Title */}
        {title && (
          <h3 id="dialog-title" className="text-lg font-semibold mb-4 text-gray-800">
            {title}
          </h3>
        )}

        {/* Body */}
        <div className="mb-6 text-sm text-gray-600">
          {children || message}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationDialog;
