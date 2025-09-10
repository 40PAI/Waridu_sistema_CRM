"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { Role as AppRole } from "@/App"; // Renomeado para evitar conflito
import { PAGE_PERMISSIONS, Role as ConfigRole } from "@/config/roles"; // Importar PAGE_PERMISSIONS e Role do config

interface InviteMemberProps {
  roles: AppRole[];
  onInviteMember: (email: string, roleId: string) => Promise<{ ok: boolean; error?: string }>;
}

const InviteMember = ({ roles, onInviteMember }: InviteMemberProps) => {
  const [email, setEmail] = React.useState("");
  const [selectedRoleId, setSelectedRoleId] = React.useState("");
  const [selectedRoleName, setSelectedRoleName] = React.useState<ConfigRole | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setSelectedRoleName(role.name as ConfigRole);
    } else {
      setSelectedRoleName(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedRoleId) {
      showError("Por favor, preencha o e-mail e selecione uma função.");
      return;
    }

    setLoading(true);
    const res = await onInviteMember(email, selectedRoleId);
    setLoading(false);

    if (res.ok) {
      const roleName = roles.find(r => r.id === selectedRoleId)?.name || "desconhecida";
      showSuccess(`Convite enviado para ${email} com a função de ${roleName}!`);
      setEmail("");
      setSelectedRoleId("");
      setSelectedRoleName(null);
    } else {
      showError(res.error || "Falha ao enviar convite. Tente novamente.");
    }
  };

  return (
    <div className="flex justify-center items-center flex-1">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Convidar Novo Membro</CardTitle>
          <CardDescription>
            Digite o e-mail e selecione a função para enviar um convite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  placeholder="nome@exemplo.com" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="role">Função</Label>
                <Select value={selectedRoleId} onValueChange={handleRoleChange} required>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedRoleName && PAGE_PERMISSIONS[selectedRoleName] && (
                <div className="space-y-2 p-4 border rounded-md bg-muted/50">
                  <h3 className="font-semibold text-sm">Páginas acessíveis para "{selectedRoleName}":</h3>
                  <ul className="list-disc list-inside text-xs text-muted-foreground max-h-40 overflow-y-auto">
                    {PAGE_PERMISSIONS[selectedRoleName].map((path, index) => (
                      <li key={index}>{path}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Button className="w-full mt-6" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Convite"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteMember;