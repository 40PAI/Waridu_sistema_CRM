UPDATE public.profiles
SET role = 'Financeiro'
WHERE id = (SELECT id FROM auth.users WHERE email = 'financeiro@gmail.com');