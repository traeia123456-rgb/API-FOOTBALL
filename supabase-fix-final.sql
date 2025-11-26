-- ============================================
-- CORRECCIÓN FINAL - POLÍTICAS RLS PARA PROFILES
-- ============================================
-- Ejecuta este script completo en Supabase SQL Editor
-- ============================================

-- Paso 1: Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "enable_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "enable_read_all_profiles_for_admins" ON public.profiles;
DROP POLICY IF EXISTS "enable_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "enable_update_all_profiles_for_admins" ON public.profiles;

-- Paso 2: Crear políticas correctas para SELECT
CREATE POLICY "enable_read_own_profile" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Paso 3: Política para que admins puedan ver todos los perfiles
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

-- Paso 4: Política para UPDATE (usuarios pueden actualizar su propio perfil)
CREATE POLICY "enable_update_own_profile" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Paso 5: Política para que admins puedan actualizar cualquier perfil
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

-- Paso 6: Asegurar que los roles tienen permisos correctos
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Paso 7: Verificación - Ejecuta esto después para confirmar
SELECT 
    'Políticas creadas' as status,
    COUNT(*) as total
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';
