-- ============================================
-- ADMIN PANEL - DATABASE SETUP
-- ============================================
-- Este archivo configura todas las funciones y políticas
-- necesarias para el panel de administración

-- ============================================
-- POLÍTICAS RLS PARA ADMINS
-- ============================================

-- Admins pueden ver todos los perfiles
CREATE POLICY "admins_select_all_profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins pueden actualizar todos los perfiles (excepto el suyo para cambiar rol)
CREATE POLICY "admins_update_all_profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins pueden ver todas las consultas
CREATE POLICY "admins_select_all_queries" 
ON public.queries 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins pueden ver todas las transacciones de tokens
CREATE POLICY "admins_select_all_transactions" 
ON public.token_transactions 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins pueden ver todas las conversaciones
CREATE POLICY "admins_select_all_conversations" 
ON public.conversations 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins pueden ver todos los mensajes
CREATE POLICY "admins_select_all_messages" 
ON public.messages 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- FUNCIÓN: Cambiar rol de usuario
-- ============================================

CREATE OR REPLACE FUNCTION public.change_user_role(
    p_user_id UUID,
    p_new_role TEXT,
    p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Verificar que quien ejecuta es admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_admin_id;

    IF NOT v_is_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Admin access required'
        );
    END IF;

    -- Validar el nuevo rol
    IF p_new_role NOT IN ('user', 'admin') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid role. Must be user or admin'
        );
    END IF;

    -- No permitir que un admin se quite su propio rol de admin
    IF p_user_id = p_admin_id AND p_new_role = 'user' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot remove your own admin role'
        );
    END IF;

    -- Actualizar rol
    UPDATE public.profiles
    SET role = p_new_role
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Role updated successfully',
        'new_role', p_new_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Eliminar usuario
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_user(
    p_user_id UUID,
    p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Verificar que quien ejecuta es admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_admin_id;

    IF NOT v_is_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Admin access required'
        );
    END IF;

    -- No permitir que un admin se elimine a sí mismo
    IF p_user_id = p_admin_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot delete your own account'
        );
    END IF;

    -- Eliminar usuario (CASCADE eliminará todo lo relacionado)
    DELETE FROM auth.users WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'User deleted successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Obtener estadísticas del sistema
-- ============================================

CREATE OR REPLACE FUNCTION public.get_system_stats(
    p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_total_users INTEGER;
    v_total_queries INTEGER;
    v_total_tokens_allocated INTEGER;
    v_total_tokens_consumed INTEGER;
    v_total_tokens_available INTEGER;
BEGIN
    -- Verificar que quien ejecuta es admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_admin_id;

    IF NOT v_is_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Admin access required'
        );
    END IF;

    -- Obtener estadísticas
    SELECT COUNT(*) INTO v_total_users FROM public.profiles;
    SELECT COUNT(*) INTO v_total_queries FROM public.queries;
    SELECT SUM(token_balance) INTO v_total_tokens_available FROM public.profiles;
    
    SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)
    INTO v_total_tokens_allocated, v_total_tokens_consumed
    FROM public.token_transactions;

    RETURN jsonb_build_object(
        'success', true,
        'stats', jsonb_build_object(
            'total_users', v_total_users,
            'total_queries', v_total_queries,
            'total_tokens_allocated', v_total_tokens_allocated,
            'total_tokens_consumed', v_total_tokens_consumed,
            'total_tokens_available', v_total_tokens_available
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- OTORGAR PERMISOS
-- ============================================

GRANT EXECUTE ON FUNCTION public.change_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_stats TO authenticated;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver las políticas creadas para admins
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE 'admins%'
ORDER BY tablename, cmd;

-- Ver las funciones creadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('change_user_role', 'delete_user', 'get_system_stats');
