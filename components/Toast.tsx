'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div className={`toast ${type}`} style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px)',
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: '300px',
      zIndex: 2000,
      animation: 'slideIn 300ms ease-out',
      borderLeft: `4px solid var(--${type})`
    }}>
      <span style={{ fontSize: '1.25rem' }}>{icons[type]}</span>
      <span>{message}</span>
    </div>
  )
}

export function showToast(
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  setToast: (toast: { message: string; type: typeof type } | null) => void
) {
  setToast({ message, type })
}

