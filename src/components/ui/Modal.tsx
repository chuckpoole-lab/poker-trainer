'use client';

import { useEffect, useRef, useCallback, HTMLAttributes } from 'react';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  /** Optional title rendered at top */
  title?: string;
  /** Max width of the panel */
  maxWidth?: number;
}

export default function Modal({
  open,
  onClose,
  title,
  maxWidth = 420,
  children,
  style,
  ...rest
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  /* Close on Escape */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* backdrop */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(18,20,17,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'modalBackdropIn 0.2s ease-out',
      }} />

      {/* panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--surface-container)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-xl)',
          animation: 'modalPanelIn 0.25s var(--ease-out)',
          ...style,
        }}
        {...rest}
      >
        {title && (
          <div style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-bold)' as unknown as number,
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-4)',
            fontFamily: 'var(--font-display)',
          }}>
            {title}
          </div>
        )}
        {children}
      </div>

      <style>{`
        @keyframes modalBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalPanelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
