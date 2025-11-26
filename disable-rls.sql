-- ============================================
-- DESHABILITAR RLS TEMPORALMENTE
-- ============================================
-- Esto es para diagnóstico. Si funciona, sabremos que el problema son las políticas RLS

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Después de confirmar que funciona, ejecuta este otro archivo para
-- volver a habilitar RLS con las políticas correctas
