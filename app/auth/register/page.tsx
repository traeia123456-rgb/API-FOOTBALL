'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Image from 'next/image'
import { createClientSupabase } from '@/lib/supabase'
import { Toast } from '@/components/Toast'
import styles from '../login/auth.module.css'

declare global {
  interface Window {
    turnstile: any
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null)

  useEffect(() => {
    // Redirect if already logged in
    async function checkAuth() {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  // Initialize Turnstile function
  const initTurnstile = useCallback(() => {
    // Check if Turnstile is disabled
    const isDisabled = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true'
    
    if (isDisabled) {
      // If disabled, auto-set a dummy token
      setTurnstileToken('disabled-' + Date.now())
      return
    }

    if (typeof window !== 'undefined' && window.turnstile && !turnstileWidgetId) {
      try {
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
        
        // Si es la clave de prueba, siempre permitir (para desarrollo)
        const isTestKey = siteKey === '1x00000000000000000000AA'
        
        // Use ID selector to ensure only one widget is rendered
        const container = document.getElementById('turnstile-register-widget')
        if (!container) {
          console.error('Turnstile container not found')
          return
        }
        
        // Check if already rendered to prevent duplicates
        if (container.hasChildNodes()) {
          console.log('Turnstile already rendered, skipping...')
          return
        }
        
        // Clear any existing content to prevent duplicates
        container.innerHTML = ''
        
        // Pass the container element directly, not a selector
        const widgetId = window.turnstile.render(container, {
          sitekey: siteKey,
          theme: 'dark',
          size: 'normal',
          callback: (token: string) => {
            setTurnstileToken(token)
          },
          'error-callback': () => {
            // Solo mostrar error si no es clave de prueba
            if (!isTestKey) {
              setToast({ message: 'Error al verificar CAPTCHA. Intenta de nuevo.', type: 'error' })
            }
            setTurnstileToken(null)
          }
        })
        setTurnstileWidgetId(widgetId)
        
        // Si es clave de prueba, simular token automáticamente después de un momento
        if (isTestKey) {
          setTimeout(() => {
            setTurnstileToken('test-token-' + Date.now())
          }, 500)
        }
      } catch (error) {
        console.error('Error initializing Turnstile:', error)
        // En caso de error, permitir continuar si es clave de prueba
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
        if (siteKey === '1x00000000000000000000AA') {
          setTurnstileToken('test-token-fallback')
        }
      }
    }
  }, [turnstileWidgetId])

  useEffect(() => {
    // Check if Turnstile is disabled
    const isDisabled = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true'
    
    if (isDisabled) {
      // If disabled, auto-set a dummy token immediately
      setTurnstileToken('disabled-' + Date.now())
      return
    }

    // Try immediately if already loaded
    if (typeof window !== 'undefined' && window.turnstile) {
      initTurnstile()
    } else {
      // Wait for script to load
      const checkTurnstile = setInterval(() => {
        if (typeof window !== 'undefined' && window.turnstile) {
          clearInterval(checkTurnstile)
          initTurnstile()
        }
      }, 100)

      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(checkTurnstile), 10000)

      return () => clearInterval(checkTurnstile)
    }
  }, [initTurnstile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verificar Turnstile solo si no está deshabilitado y no es clave de prueba
    const isDisabled = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true'
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
    const isTestKey = siteKey === '1x00000000000000000000AA'
    
    if (!isDisabled && !isTestKey && !turnstileToken) {
      setToast({ message: 'Por favor completa la verificación CAPTCHA', type: 'warning' })
      return
    }

    if (password !== confirmPassword) {
      setToast({ message: 'Las contraseñas no coinciden', type: 'error' })
      return
    }

    if (!acceptTerms) {
      setToast({ message: 'Debes aceptar los términos y condiciones', type: 'warning' })
      return
    }

    setLoading(true)

    try {
      // Verify Turnstile token server-side (skip if disabled or test key)
      if (!isDisabled && !isTestKey && turnstileToken) {
        const verifyResponse = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: turnstileToken }),
        })

        const verifyResult = await verifyResponse.json()

        if (!verifyResult.success) {
          setToast({ message: 'Error al verificar CAPTCHA. Intenta de nuevo.', type: 'error' })
          
          // Reset Turnstile
          if (window.turnstile && turnstileWidgetId) {
            window.turnstile.reset(turnstileWidgetId)
            setTurnstileToken(null)
          }
          
          setLoading(false)
          return
        }
      }

      const supabase = createClientSupabase()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error

      setToast({ message: '¡Cuenta creada! Revisa tu email para confirmar.', type: 'success' })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)

    } catch (error: any) {
      console.error('Register error:', error)

      let errorMessage = 'Error al crear la cuenta'
      if (error.message.includes('already registered')) {
        errorMessage = 'Este email ya está registrado'
      } else if (error.message.includes('Password')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres'
      }

      setToast({ message: errorMessage, type: 'error' })

      // Reset Turnstile
      if (window.turnstile && turnstileWidgetId) {
        window.turnstile.reset(turnstileWidgetId)
        setTurnstileToken(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // Check if Turnstile should be rendered
  const isDisabled = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true'

  return (
    <>
      {!isDisabled && (
        <Script 
          src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
          strategy="afterInteractive"
          onLoad={initTurnstile}
        />
      )}
      <div className={styles.authPage}>
        <div className={styles.authContainer}>
          {/* Branding Side */}
          <div className={styles.authBranding}>
            <div className={styles.brandingContent}>
              <div className={styles.logoLarge}>
                <Image src="/logo.png" alt="Football Assistant" width={120} height={120} priority />
              </div>
              <h1>Football Assistant</h1>
              <p>Comienza tu experiencia de fútbol inteligente</p>
              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>🎁</span>
                  <span>100 tokens gratis al registrarte</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>💾</span>
                  <span>Guarda tu historial de consultas</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>⚡</span>
                  <span>Acceso instantáneo a datos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className={styles.authFormContainer}>
            <div className={styles.authFormWrapper}>
              <div className={styles.authHeader}>
                <h2>Crear cuenta</h2>
                <p>Regístrate gratis y obtén 100 tokens</p>
              </div>

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
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password">Contraseña</label>
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
                  <label htmlFor="confirmPassword">Confirmar contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      required
                    />
                    <span>
                      Acepto los <a href="#" className={styles.linkPrimary}>términos y condiciones</a>
                    </span>
                  </label>
                </div>

                {/* Turnstile Widget - Only show if not disabled */}
                {!isDisabled && <div id="turnstile-register-widget" />}

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}
                  disabled={loading || (!isDisabled && !turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '1x00000000000000000000AA')}
                >
                  {loading ? (
                    <span className={styles.spinner} />
                  ) : (
                    <span>Crear cuenta</span>
                  )}
                </button>
              </form>

              <div className={styles.authFooter}>
                <p>
                  ¿Ya tienes una cuenta?{' '}
                  <a href="/auth/login" className={styles.linkPrimary}>
                    Inicia sesión
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
