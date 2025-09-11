-- Cria o bucket 'avatars' para armazenar as fotos de perfil, se ainda não existir.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Permite que qualquer pessoa visualize os avatares (necessário para exibi-los no app).
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Permite que usuários autenticados enviem um novo avatar.
-- A política garante que o nome do arquivo comece com o ID do usuário.
CREATE POLICY "Authenticated users can upload their own avatar" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = split_part(name, '.', 1)
);

-- Permite que usuários autenticados atualizem seu próprio avatar.
CREATE POLICY "Authenticated users can update their own avatar" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = split_part(name, '.', 1)
);

-- Permite que usuários autenticados removam seu próprio avatar.
CREATE POLICY "Authenticated users can delete their own avatar" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = split_part(name, '.', 1)
);