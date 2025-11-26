-- ============================================
-- MIGRATION FIX - CORRECCIONES Y ADICIONES
-- ============================================
-- Este archivo contiene SOLO las correcciones necesarias
-- para el esquema existente en supabase-schema.sql
-- ============================================

-- NOTA: Ejecuta este archivo DESPUÉS de haber ejecutado supabase-schema.sql
-- O ejecuta solo las secciones que necesites si ya tienes algunas tablas creadas

-- ============================================
-- VERIFICAR SI LAS TABLAS EXISTEN
-- ============================================

-- Para verificar qué tablas ya existen, ejecuta:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ============================================
-- CORRECCIÓN 1: Asegurar que el trigger funcione correctamente
-- ============================================

-- Si el trigger on_auth_user_created ya existe pero no funciona,
-- primero eliminarlo y recrearlo:

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CORRECCIÓN 2: Crear perfiles para usuarios existentes
-- ============================================

-- Si ya tienes usuarios en auth.users pero no tienen perfil en profiles,
-- ejecuta esto para crearlos:

INSERT INTO public.profiles (id, email, role, token_balance)
SELECT 
    id, 
    email, 
    'user', 
    100
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CORRECCIÓN 3: Asegurar que la extensión UUID esté habilitada
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VERIFICACIÓN: Consultas útiles para verificar el estado
-- ============================================

-- Ver todos los perfiles:
-- SELECT * FROM public.profiles;

-- Ver usuarios de auth sin perfil:
-- SELECT u.id, u.email 
-- FROM auth.users u 
-- LEFT JOIN public.profiles p ON u.id = p.id 
-- WHERE p.id IS NULL;

-- Ver el balance de tokens de todos los usuarios:
-- SELECT email, token_balance, role FROM public.profiles ORDER BY created_at DESC;

-- ============================================
-- OPCIONAL: Convertir un usuario en admin
-- ============================================

-- Reemplaza 'tu-email@ejemplo.com' con el email del usuario que quieres hacer admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';

-- ============================================
-- OPCIONAL: Asignar tokens adicionales a un usuario
-- ============================================

-- Ejemplo: Asignar 500 tokens adicionales a un usuario
-- UPDATE public.profiles SET token_balance = token_balance + 500 WHERE email = 'usuario@ejemplo.com';
