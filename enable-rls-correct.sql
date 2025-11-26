-- ============================================
-- REHABILITAR RLS CON POLÍTICAS CORRECTAS
-- ============================================
-- Ejecuta esto SOLO si deshabilitar RLS funcionó

-- Paso 1: Habilitar RLS nuevamente
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar TODAS las políticas existentes
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- Paso 3: Crear UNA SOLA política simple que permita a usuarios autenticados leer su propio perfil
CREATE POLICY "authenticated_users_select_own_profile" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Paso 4: Política para UPDATE
CREATE POLICY "authenticated_users_update_own_profile" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Paso 5: Verificar que las políticas se crearon
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public';
