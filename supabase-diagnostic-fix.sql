-- ============================================
-- DIAGNÓSTICO Y CORRECCIÓN DE ACCESO A PROFILES
-- ============================================

-- PASO 1: Verificar que la tabla existe y está en el esquema correcto
-- Ejecuta esto primero para ver el estado actual:

SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- PASO 2: Verificar las políticas RLS actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- ============================================
-- CORRECCIÓN: Agregar política para acceso anónimo de lectura
-- ============================================

-- El problema es que las políticas actuales solo permiten acceso a usuarios autenticados
-- Pero la API REST necesita poder leer con el rol 'anon' también

-- NOTA: Esta sección es solo informativa, la corrección real está más abajo
-- en la sección "CORRECCIÓN DEFINITIVA"

-- ============================================
-- CORRECCIÓN ALTERNATIVA: Si el problema persiste
-- ============================================

-- Si aún no funciona, temporalmente deshabilita RLS para diagnosticar:
-- ⚠️ ADVERTENCIA: Esto es solo para diagnóstico, NO lo dejes así en producción

-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Después de verificar que funciona, vuelve a habilitar RLS:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICACIÓN: Probar acceso como usuario autenticado
-- ============================================

-- Ejecuta esto para ver si puedes leer tu perfil:
SELECT * FROM public.profiles WHERE id = '9a0ecfbf-1453-4ead-8e89-fc611b3c00f1';

-- ============================================
-- CORRECCIÓN DEFINITIVA: Recrear políticas correctamente
-- ============================================

-- Eliminar todas las políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON public.profiles;

-- Crear políticas correctas para SELECT
CREATE POLICY "enable_read_own_profile" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Política para que admins puedan ver todos los perfiles
CREATE POLICY "enable_read_all_profiles_for_admins" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Política para UPDATE (usuarios pueden actualizar su propio perfil)
CREATE POLICY "enable_update_own_profile" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para que admins puedan actualizar cualquier perfil
CREATE POLICY "enable_update_all_profiles_for_admins" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- VERIFICAR PERMISOS DE LA TABLA
-- ============================================

-- Asegurar que los roles tienen permisos correctos
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Ejecuta esto para verificar que todo está correcto:
SELECT 
    'Tabla existe' as check_type,
    COUNT(*) as result
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles'

UNION ALL

SELECT 
    'RLS habilitado' as check_type,
    CASE WHEN rowsecurity THEN 1 ELSE 0 END as result
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles'

UNION ALL

SELECT 
    'Políticas creadas' as check_type,
    COUNT(*) as result
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';
