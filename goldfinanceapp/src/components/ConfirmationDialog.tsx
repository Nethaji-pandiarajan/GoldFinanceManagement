// src/components/ConfirmationDialog.tsx
import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

type ConfirmationDialogProps = {
  message: string;
  type: 'delete' | 'logout';
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationDialog({ message, type, onConfirm, onCancel }: ConfirmationDialogProps) {
  const confirmButtonColor = type === 'delete' 
    ? 'bg-red-600 hover:bg-red-700' 
    : 'bg-[#c69909] hover:bg-yellow-500';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="flex flex-col items-center gap-6">
        <ExclamationTriangleIcon className="h-20 w-20 text-yellow-400" />
        <p className="text-2xl font-bold text-white text-center max-w-md">
          {message}
        </p>
        <div className="flex items-center space-x-6 mt-4">
          <button
            onClick={onCancel}
            className="px-8 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              'px-8 py-2 rounded-lg text-black font-semibold transition-colors',
              confirmButtonColor
            )}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}