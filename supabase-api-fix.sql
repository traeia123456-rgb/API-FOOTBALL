-- ============================================
-- SOLUCIÓN DEFINITIVA - EXPONER TABLA EN API REST
-- ============================================

-- El error 42P17 significa que PostgREST no puede encontrar la tabla
-- Esto ocurre cuando la tabla no está en el esquema expuesto a la API

-- PASO 1: Verificar en qué esquema está la tabla
SELECT 
    table_schema, 
    table_name 
FROM information_schema.tables 
WHERE table_name = 'profiles';

-- PASO 2: Verificar la configuración de PostgREST
-- La tabla debe estar en el esquema 'public' y tener los permisos correctos

-- PASO 3: Asegurar que la tabla está en el esquema público
-- Si la tabla está en otro esquema, necesitamos moverla o crear una vista

-- PASO 4: Otorgar permisos explícitos a la tabla
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- PASO 5: Asegurar que el esquema público es accesible
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- PASO 6: Otorgar permisos en las secuencias si existen
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- PASO 7: Refrescar el esquema de PostgREST
-- Esto fuerza a PostgREST a recargar el esquema
NOTIFY pgrst, 'reload schema';

-- PASO 8: Verificar que los permisos están correctos
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- ============================================
-- ALTERNATIVA: Si el problema persiste
-- ============================================

-- Verificar la configuración de RLS
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Si RLS está causando problemas, temporalmente deshabilitarlo para diagnóstico:
-- ⚠️ SOLO PARA DIAGNÓSTICO - NO DEJAR ASÍ EN PRODUCCIÓN
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Después de verificar que funciona, volver a habilitar:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
