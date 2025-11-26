'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, hsl(220, 30%, 10%) 0%, hsl(220, 30%, 5%) 100%)'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⚽</div>
        <div style={{ fontSize: '1.125rem', opacity: 0.8 }}>Cargando Football Assistant...</div>
      </div>
    </div>
  )
}

