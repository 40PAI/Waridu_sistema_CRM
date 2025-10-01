-- Assign 'Admin' role
UPDATE public.profiles
SET role = 'Admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'eduardofrancisco1719@gmail.com');

-- Assign 'Coordenador' role
UPDATE public.profiles
SET role = 'Coordenador'
WHERE id = (SELECT id FROM auth.users WHERE email = 'coordenador@example.com');

-- Assign 'Gestor de Material' role
UPDATE public.profiles
SET role = 'Gestor de Material'
WHERE id = (SELECT id FROM auth.users WHERE email = 'gestor@example.com');