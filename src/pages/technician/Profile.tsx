import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";

const TechnicianProfile = () => {
  const { user } = useAuth();
  const [name, setName] = React.useState(user?.profile?.first_name || "");
  const [email, setEmail] = React.useState(user?.email || "");
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSave = () => {
    // In a real app, this would call an API to update the user's profile
    showSuccess("Perfil atualizado com sucesso!");
    setIsEditing(false);
  };

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
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {user?.profile?.first_name?.charAt(0) || user?.email?.charAt(0) || "T"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" disabled>Alterar Foto</Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, GIF ou PNG. Tamanho máximo 1MB.
              </p>
            </div>
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
              {isEditing ? (
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              ) : (
                <p className="text-sm">{email}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Função</Label>
            <p className="text-sm">{user?.profile?.role || "Técnico"}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Custo por Dia</Label>
            <p className="text-sm">AOA {(user?.profile?.costPerDay || 0).toLocaleString('pt-AO')}</p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar</Button>
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

export default TechnicianProfile;