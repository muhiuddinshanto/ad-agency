'use client';

import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="space-y-5">
        <div className="flex gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm leading-6 text-slate-600">{message}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 min-h-[44px] rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
