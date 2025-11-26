'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClientSupabase } from '@/lib/supabase'
import { Toast } from '@/components/Toast'
import styles from '../login/auth.module.css'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClientSupabase()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      setEmailSent(true)
      setToast({ 
        message: '¡Enlace enviado! Revisa tu correo electrónico.', 
        type: 'success' 
      })

      // Clear form
      setEmail('')

    } catch (error: any) {
      console.error('Reset password error:', error)
      setToast({ 
        message: error.message || 'Error al enviar el enlace', 
        type: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={styles.authPage}>
        <div className={styles.authContainer} style={{ gridTemplateColumns: '1fr', maxWidth: '500px' }}>
          {/* Form */}
          <div className={styles.authFormContainer}>
            <div className={styles.authFormWrapper}>
              <div className={styles.authHeader}>
                <div className={styles.logoLarge} style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  🔐
                </div>
                <h2>¿Olvidaste tu contraseña?</h2>
                <p>No te preocupes, te enviaremos instrucciones para restablecerla</p>
              </div>

              {emailSent ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
                  <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                    ¡Correo enviado!
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                  </p>
                  <a href="/auth/login" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Volver al inicio de sesión
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.authForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      autoComplete="email"
                    />
                    <small style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
                      Te enviaremos un enlace para restablecer tu contraseña
                    </small>
                  </div>

                  <button
                    type="submit"
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className={styles.spinner} />
                    ) : (
                      <span>Enviar enlace de recuperación</span>
                    )}
                  </button>
                </form>
              )}

              <div className={styles.authFooter}>
                <p>
                  <a href="/auth/login" className={styles.linkPrimary}>
                    ← Volver al inicio de sesión
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
