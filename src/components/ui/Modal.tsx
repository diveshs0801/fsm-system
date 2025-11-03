"use client";

import React from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-lg shadow-lg border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button className="text-gray-500" onClick={onClose}>✕</button>
        </div>
        <div className="px-4 py-3">
          {children}
        </div>
        {footer && (
          <div className="px-4 py-3 border-t bg-gray-50 flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}


