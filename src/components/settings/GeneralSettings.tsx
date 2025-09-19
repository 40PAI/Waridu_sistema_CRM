"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const LS_KEYS = {
  maintenance: "app:maintenance_mode",
  registration: "app:user_registration",
};

export default function GeneralSettings() {
  const [maintenance, setMaintenance] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEYS.maintenance) === "true";
    } catch {
      return false;
    }
  });
  const [registration, setRegistration] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEYS.registration) !== "false";
    } catch {
      return true;
    }
  });

  const applyChanges = () => {
    try {
      localStorage.setItem(LS_KEYS.maintenance, String(maintenance));
      localStorage.setItem(LS_KEYS.registration, String(registration));
      // For demo purposes we persist to localStorage only
    } catch {
      // ignore
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Gerais</CardTitle>
        <CardDescription>Opções rápidas do sistema (persistência local para demonstração).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Modo de Manutenção</div>
            <div className="text-sm text-muted-foreground">Desativa o acesso público durante manutenção (demo).</div>
          </div>
          <Switch checked={maintenance} onCheckedChange={setMaintenance} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Permitir Registro de Usuários</div>
            <div className="text-sm text-muted-foreground">Controla se registros públicos são permitidos (demo).</div>
          </div>
          <Switch checked={registration} onCheckedChange={setRegistration} />
        </div>

        <div className="flex justify-end">
          <Button onClick={applyChanges}>Salvar</Button>
        </div>
      </CardContent>
    </Card>
  );
}