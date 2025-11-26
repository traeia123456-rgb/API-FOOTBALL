-- ============================================
-- ASIGNAR ROL DE ADMIN
-- ============================================

-- Actualizar el rol a 'admin' para tu usuario específico
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'nelsonandres192016@gmail.com';

-- Verificar el cambio
SELECT email, role, id 
FROM public.profiles 
WHERE email = 'nelsonandres192016@gmail.com';
