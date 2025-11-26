'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Image from 'next/image'
import { createClientSupabase } from '@/lib/supabase'
import { Toast } from '@/components/Toast'
import styles from './auth.module.css'

declare global {
  interface Window {
    turnstile: any
    onTurnstileSuccess: (token: string) => void
    onTurnstileError: () => void
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
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
    if (typeof window !== 'undefined' && window.turnstile && !turnstileWidgetId) {
      try {
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
        
        // Si es la clave de prueba, siempre permitir (para desarrollo)
        const isTestKey = siteKey === '1x00000000000000000000AA'
        
        // Use ID selector to ensure only one widget is rendered
        const container = document.getElementById('turnstile-login-widget')
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
          }, 1000)
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

    // Verificar Turnstile solo si no es clave de prueba
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'
    const isTestKey = siteKey === '1x00000000000000000000AA'
    
    if (!isTestKey && !turnstileToken) {
      setToast({ message: 'Por favor completa la verificación CAPTCHA', type: 'warning' })
      return
    }

    setLoading(true)

    try {
      // Verify Turnstile token server-side
      if (!isTestKey && turnstileToken) {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      setToast({ message: '¡Bienvenido de vuelta!', type: 'success' })

      // Redirect to dashboard
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard'
      sessionStorage.removeItem('redirectAfterLogin')

      setTimeout(() => {
        router.push(redirectTo)
      }, 500)

    } catch (error: any) {
      console.error('Login error:', error)

      let errorMessage = 'Error al iniciar sesión'
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos'
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

  return (
    <>
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
        strategy="afterInteractive"
        onLoad={initTurnstile}
      />
      <div className={styles.authPage}>
        <div className={styles.authContainer}>
          {/* Branding Side */}
          <div className={styles.authBranding}>
            <div className={styles.brandingContent}>
              <div className={styles.logoLarge}>
                <Image src="/logo.png" alt="Football Assistant" width={120} height={120} priority />
              </div>
              <h1>Football Assistant</h1>
              <p>Tu asistente inteligente de fútbol</p>
              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>💬</span>
                  <span>Consultas en lenguaje natural</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>📊</span>
                  <span>Datos en tiempo real</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>🎯</span>
                  <span>Historial de conversaciones</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className={styles.authFormContainer}>
            <div className={styles.authFormWrapper}>
              <div className={styles.authHeader}>
                <h2>Bienvenido de nuevo</h2>
                <p>Ingresa tus credenciales para continuar</p>
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
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className={styles.formOptions}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Recordarme</span>
                  </label>
                  <a href="/auth/forgot-password" className={styles.linkPrimary}>
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                {/* Turnstile Widget - Using unique ID */}
                <div id="turnstile-login-widget" />

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}
                  disabled={loading || (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '1x00000000000000000000AA')}
                >
                  {loading ? (
                    <span className={styles.spinner} />
                  ) : (
                    <span>Iniciar Sesión</span>
                  )}
                </button>
              </form>

              <div className={styles.authFooter}>
                <p>
                  ¿No tienes una cuenta?{' '}
                  <a href="/auth/register" className={styles.linkPrimary}>
                    Regístrate gratis
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
