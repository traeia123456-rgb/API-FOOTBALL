'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClientSupabase } from '@/lib/supabase'
import { Toast } from '@/components/Toast'
import styles from '../login/auth.module.css'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null)

  useEffect(() => {
    // Check if user has a valid recovery session
    async function checkSession() {
      const supabase = createClientSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setValidSession(true)
      } else {
        setToast({ 
          message: 'Enlace de recuperación inválido o expirado', 
          type: 'error' 
        })
        setTimeout(() => {
          router.push('/auth/forgot-password')
        }, 3000)
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords match
    if (password !== confirmPassword) {
      setToast({ message: 'Las contraseñas no coinciden', type: 'error' })
      return
    }

    if (password.length < 6) {
      setToast({ message: 'La contraseña debe tener al menos 6 caracteres', type: 'error' })
      return
    }

    setLoading(true)

    try {
      const supabase = createClientSupabase()
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setToast({ 
        message: '¡Contraseña actualizada exitosamente!', 
        type: 'success' 
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)

    } catch (error: any) {
      console.error('Update password error:', error)
      setToast({ 
        message: error.message || 'Error al actualizar la contraseña', 
        type: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Real-time password validation
  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const passwordsDoNotMatch = confirmPassword && password !== confirmPassword

  if (!validSession) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authContainer} style={{ gridTemplateColumns: '1fr', maxWidth: '500px' }}>
          <div className={styles.authFormContainer}>
            <div className={styles.authFormWrapper}>
              <div className={styles.authHeader}>
                <div className={styles.logoLarge} style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  ⏳
                </div>
                <h2>Verificando enlace...</h2>
                <p>Por favor espera un momento</p>
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
      </div>
    )
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
                  🔑
                </div>
                <h2>Restablecer contraseña</h2>
                <p>Ingresa tu nueva contraseña</p>
              </div>

              <form onSubmit={handleSubmit} className={styles.authForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="password">Nueva contraseña</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <small style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
                    Mínimo 6 caracteres
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    style={{
                      borderColor: passwordsDoNotMatch ? 'var(--error)' : passwordsMatch ? 'var(--success)' : undefined
                    }}
                  />
                  {passwordsDoNotMatch && (
                    <small style={{ fontSize: '0.813rem', color: 'var(--error)' }}>
                      Las contraseñas no coinciden
                    </small>
                  )}
                  {passwordsMatch && (
                    <small style={{ fontSize: '0.813rem', color: 'var(--success)' }}>
                      ✓ Las contraseñas coinciden
                    </small>
                  )}
                </div>

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}
                  disabled={loading || !passwordsMatch}
                >
                  {loading ? (
                    <span className={styles.spinner} />
                  ) : (
                    <span>Actualizar contraseña</span>
                  )}
                </button>
              </form>

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
