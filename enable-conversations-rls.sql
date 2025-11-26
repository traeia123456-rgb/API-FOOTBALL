-- ============================================
-- HABILITAR POLÍTICAS RLS PARA CONVERSATIONS Y MESSAGES
-- ============================================

-- Verificar si las tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'queries');

-- Habilitar RLS en las tablas si no está habilitado
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes de conversations
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'conversations' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.conversations';
    END LOOP;
END $$;

-- Eliminar políticas existentes de messages
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.messages';
    END LOOP;
END $$;

-- Eliminar políticas existentes de queries
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'queries' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.queries';
    END LOOP;
END $$;

-- Crear políticas para CONVERSATIONS
CREATE POLICY "users_select_own_conversations" 
ON public.conversations
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_conversations" 
ON public.conversations
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_conversations" 
ON public.conversations
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_conversations" 
ON public.conversations
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Crear políticas para MESSAGES
CREATE POLICY "users_select_own_messages" 
ON public.messages
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_messages" 
ON public.messages
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_messages" 
ON public.messages
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Crear políticas para QUERIES
CREATE POLICY "users_select_own_queries" 
ON public.queries
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_queries" 
ON public.queries
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Otorgar permisos
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.queries TO authenticated;

-- Verificar que las políticas se crearon
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'queries')
ORDER BY tablename, cmd;
