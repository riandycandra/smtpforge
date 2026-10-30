"use client";

import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />,
          button: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
        };
      case 'primary':
        return {
          icon: <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
          button: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
          button: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-full shrink-0 ${styles.iconBg}`}>
              {styles.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                id="confirm-dialog-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h3>
              {description && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-md disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-300 dark:border-gray-700 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${styles.button}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

