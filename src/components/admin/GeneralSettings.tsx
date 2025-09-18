import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const GeneralSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Gerais</CardTitle>
        <CardDescription>Gerencie as configurações gerais do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="maintenance-mode" className="flex flex-col space-y-1">
            <span>Modo de Manutenção</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Desative o acesso público ao site para manutenção.
            </span>
          </Label>
          <Switch id="maintenance-mode" />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="user-registration" className="flex flex-col space-y-1">
            <span>Permitir Registro de Usuários</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Permita que novos usuários se cadastrem na plataforma.
            </span>
          </Label>
          <Switch id="user-registration" defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
};

export const ApiSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de API</CardTitle>
        <CardDescription>Gerencie suas chaves de API para integrações.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="api-key">Chave da API</Label>
          <Input id="api-key" defaultValue="******************" readOnly />
        </div>
        <div>
          <Label htmlFor="secret-key">Chave Secreta</Label>
          <Input id="secret-key" defaultValue="******************" readOnly />
        </div>
        <Button>Gerar Novas Chaves</Button>
      </CardContent>
    </Card>
  );
};