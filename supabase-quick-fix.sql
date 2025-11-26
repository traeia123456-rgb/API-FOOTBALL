-- ============================================
-- SOLUCIÓN RÁPIDA - EJECUTA SOLO ESTO
-- ============================================

-- Otorgar todos los permisos necesarios
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Refrescar el esquema de PostgREST
NOTIFY pgrst, 'reload schema';
