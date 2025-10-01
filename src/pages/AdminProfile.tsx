import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useDropzone } from "react-dropzone";

const AdminProfile = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Carregar dados do perfil do Supabase
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, avatar_url, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          showError("Erro ao carregar o perfil.");
          return;
        }

        setName(data.first_name || "");
        setAvatarUrl(data.avatar_url);
        setEmail(user.email || "");
      } catch (error) {
        console.error("Unexpected error fetching profile:", error);
        showError("Erro inesperado ao carregar o perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    console.log("Starting avatar upload for file:", file.name, "size:", file.size, "type:", file.type);

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = fileName; // Caminho corrigido

    try {
      // Upload file to Supabase Storage
      console.log("Uploading to path:", filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log("Public URL:", urlData.publicUrl);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }

      // Update local state
      setAvatarUrl(urlData.publicUrl);
      
      // Update user in AuthContext
      if (user && user.profile) {
        setUser(prevUser => {
          if (!prevUser || !prevUser.profile) return prevUser;
          return {
            ...prevUser,
            profile: {
              ...prevUser.profile,
              avatar_url: urlData.publicUrl,
            },
          };
        });
      }
      
      showSuccess("Foto de perfil atualizada com sucesso!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      const errorMessage = error?.message || "Erro desconhecido ao atualizar a foto de perfil.";
      showError(`Erro ao atualizar a foto de perfil: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  }, [user, setUser]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    maxSize: 2097152 // 2MB
  });

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ first_name: name })
        .eq('id', user.id);

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }

      showSuccess("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Unexpected error updating profile:", error);
      showError(`Erro ao atualizar o perfil: ${error?.message || "Erro desconhecido"}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie suas informações pessoais.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize suas informações de contato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <div {...getRootProps()} className="relative cursor-pointer">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback>
                  {name?.charAt(0) || email?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs text-center">Alterar Foto</span>
                </div>
              )}
              <input {...getInputProps()} />
            </div>
            {isDragActive ? (
              <p className="text-sm text-muted-foreground">Solte a imagem aqui...</p>
            ) : isEditing ? (
              <p className="text-xs text-muted-foreground">
                Arraste e solte uma imagem ou clique para selecionar
              </p>
            ) : null}
            {uploading && <p className="text-sm">Enviando...</p>}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              {isEditing ? (
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              ) : (
                <p className="text-sm">{name || "Não informado"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <p className="text-sm">{email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Função</Label>
            <p className="text-sm">{user?.profile?.role || "Admin"}</p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={uploading}>Salvar</Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfile;