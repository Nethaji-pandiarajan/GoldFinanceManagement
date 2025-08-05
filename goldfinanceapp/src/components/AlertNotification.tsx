// src/components/AlertNotification.tsx
import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

type AlertNotificationProps = {
  type: 'success' | 'error' | 'alert';
  message: string;
  onClose: () => void;
};

const alertConfig = {
  success: {
    Icon: CheckCircleIcon,
    iconColor: 'text-green-400',
  },
  error: {
    Icon: XCircleIcon,
    iconColor: 'text-red-400',
  },
  alert: {
    Icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-400',
  },
};

export default function AlertNotification({ type, message, onClose }: AlertNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const { Icon, iconColor } = alertConfig[type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <style>
        {`
          @keyframes fade-in-scale {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-scale {
            animation: fade-in-scale 0.3s ease-out forwards;
          }
        `}
      </style>
      <div className="flex flex-col items-center gap-6 animate-fade-in-scale">
        <Icon className={clsx('h-20 w-20', iconColor)} />
        <p className="text-2xl font-bold text-white text-center max-w-md">
          {message}
        </p>
      </div>
    </div>
  );
}