import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  requireTextMatch?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  requireTextMatch,
  onConfirm,
  onCancel,
}) => {
  const [typedValue, setTypedValue] = useState('');

  if (!isOpen) return null;

  const isMatchValid = !requireTextMatch || typedValue.trim().toUpperCase() === requireTextMatch.toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#282220]/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#e2d7cb] bg-[#fcf9f4] p-6 shadow-xl text-left">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmVariant === 'danger'
                  ? 'bg-[#ffdad6] text-[#ba1a1a]'
                  : 'bg-[#f2ebe1] text-[#9b4d36]'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-[#282220]">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-[#6e6259] hover:text-[#282220] p-1 rounded-md cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#6e6259] leading-relaxed mb-4">
          {message}
        </p>

        {requireTextMatch && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#282220] mb-1.5">
              Type <span className="font-mono font-bold text-[#ba1a1a]">{requireTextMatch}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requireTextMatch}
              className="w-full rounded-xl border border-[#e2d7cb] bg-[#f2ebe1] px-3 py-2 text-xs text-[#282220] font-mono focus:border-[#9b4d36] focus:outline-hidden"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e2d7cb]">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#e2d7cb] bg-[#f2ebe1] px-4 py-2 text-xs font-medium text-[#282220] hover:bg-[#e8dfd3] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isMatchValid}
            onClick={() => {
              onConfirm();
              setTypedValue('');
            }}
            className={`rounded-xl px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmVariant === 'danger'
                ? 'bg-[#ba1a1a] hover:bg-[#93000a]'
                : 'bg-[#9b4d36] hover:bg-[#833e2a]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
