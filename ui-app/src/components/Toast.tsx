'use client';
import React from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const icons: Record<ToastType, string> = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning',
  };

  const colors: Record<ToastType, string> = {
    success: 'text-[#2ae500] border-[#2ae500]/30 bg-[#2ae500]/10 shadow-[0_0_15px_rgba(42,229,0,0.2)]',
    error: 'text-[#ff3b3b] border-[#ff3b3b]/30 bg-[#ff3b3b]/10 shadow-[0_0_15px_rgba(255,59,59,0.2)]',
    info: 'text-[#00d1ff] border-[#00d1ff]/30 bg-[#00d1ff]/10 shadow-[0_0_15px_rgba(0,209,255,0.2)]',
    warning: 'text-[#ffcc00] border-[#ffcc00]/30 bg-[#ffcc00]/10 shadow-[0_0_15px_rgba(255,204,0,0.2)]',
  };

  return (
    <div 
      className={`flex items-center gap-unit-sm px-unit-lg py-unit-md rounded-xl border animate-slide-in-right backdrop-blur-md ${colors[type]}`}
      role="alert"
    >
      <span className="material-symbols-outlined">{icons[type]}</span>
      <span className="font-body-lg text-body-lg font-medium">{message}</span>
      <button 
        onClick={onClose}
        className="ml-unit-md text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined scale-75">close</span>
      </button>
    </div>
  );
}
