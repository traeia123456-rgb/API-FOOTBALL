import { createClient } from '@supabase/supabase-js'

// Client-side Supabase instance
export const createClientSupabase = () => {
  // Get from environment variables (client-side)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fallback to hardcoded values if env vars not set (for development)
  const finalUrl = supabaseUrl || 'https://udrvtpcgyppfhobhpmyj.supabase.co'
  const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcnZ0cGNneXBwZmhvYmhwbXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4Nzg3MzksImV4cCI6MjA3OTQ1NDczOX0.jgcmKsruZbYx9TzNMuOPmNDZW6nLyMZJZQYAvN-Vhtc'

  if (!finalUrl || !finalKey || finalUrl.includes('placeholder')) {
    console.error('❌ ERROR: Variables de entorno de Supabase no configuradas!')
    console.error('Por favor, crea un archivo .env.local con:')
    console.error('NEXT_PUBLIC_SUPABASE_URL=tu-url')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key')
    throw new Error('Supabase no está configurado. Por favor, configura las variables de entorno en .env.local')
  }

  return createClient(finalUrl, finalKey)
}

