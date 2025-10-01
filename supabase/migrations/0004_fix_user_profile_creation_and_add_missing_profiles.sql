-- 1. Update the function to reliably create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- 2. Manually insert profiles for the users you already created
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
WHERE email IN (
  'eduardofrancisco1719@gmail.com',
  'coordenador@example.com',
  'gestor@example.com'
)
ON CONFLICT (id) DO NOTHING;