"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { Role } from "@/App";

interface InviteMemberProps {
  roles: Role[];
  onInviteMember: (email: string, roleId: string) => Promise<{ ok: boolean; error?: string }>;
}

const InviteMember = ({ roles, onInviteMember }: InviteMemberProps) => {
  const [email, setEmail] = React.useState("");
  const [selectedRoleId, setSelectedRoleId] = React.useState("");
  const [loading, setLoading] = React.useState(false);

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
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId} required>
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