-- ============================================
-- FIX: RECURSIVE RLS POLICIES
-- ============================================
-- El error 500/42P17 regresó porque las políticas de admin causaron
-- una "recursión infinita". Al intentar leer 'profiles' para ver si eres admin,
-- se activaba la política que intentaba leer 'profiles' de nuevo, y así infinitamente.

-- SOLUCIÓN: Usar una función segura (SECURITY DEFINER) para verificar el rol.

-- 1. Crear función segura para verificar admin
-- SECURITY DEFINER hace que la función se ejecute con permisos de "superuser"
-- evitando el bucle de RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar las políticas recursivas anteriores
DROP POLICY IF EXISTS "admins_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_select_all_queries" ON public.queries;
DROP POLICY IF EXISTS "admins_select_all_transactions" ON public.token_transactions;
DROP POLICY IF EXISTS "admins_select_all_conversations" ON public.conversations;
DROP POLICY IF EXISTS "admins_select_all_messages" ON public.messages;

-- 3. Re-crear las políticas usando la función segura

-- Profiles
CREATE POLICY "admins_select_all_profiles" 
ON public.profiles FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "admins_update_all_profiles" 
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin());

-- Queries
CREATE POLICY "admins_select_all_queries" 
ON public.queries FOR SELECT TO authenticated
USING (public.is_admin());

-- Transactions
CREATE POLICY "admins_select_all_transactions" 
ON public.token_transactions FOR SELECT TO authenticated
USING (public.is_admin());

-- Conversations
CREATE POLICY "admins_select_all_conversations" 
ON public.conversations FOR SELECT TO authenticated
USING (public.is_admin());

-- Messages
CREATE POLICY "admins_select_all_messages" 
ON public.messages FOR SELECT TO authenticated
USING (public.is_admin());

-- Asegurar que la función es ejecutable
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
