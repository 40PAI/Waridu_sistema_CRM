"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleManager } from "@/components/settings/RoleManager";
import CategoryManager from "@/components/settings/CategoryManager";
import PipelineStageManager from "@/components/settings/PipelineStageManager";
import { useServices } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import AdminServicesPage from "@/pages/admin/Services";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge"; // Import Badge

// Note: keep small, focused file that composes existing components into tabs.
export default function AdminSettings() {
  const { services } = useServices();
  const { clients } = useClients();
  const { user } = useAuth();

  const canManageServices = user?.profile?.role ? hasActionPermission(user.profile.role, "services:manage") : false;
  const isAdmin = user?.profile?.role === "Admin";

  // Small local state for global toggles (UI-only; real persistence is out of scope)
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [userRegistration, setUserRegistration] = React.useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie roles, categorias, fases do pipeline, serviços e configurações gerais.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* quick actions or global buttons could be placed here */}
          {isAdmin && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Recarregar Configurações
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="roles">Funções</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="pipeline">Fases do Pipeline</TabsTrigger>
          <TabsTrigger value="locations">Localizações</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="pt-6">
          <RoleManager
            roles={[]} // RoleManager internally shows toasts and expects handlers; in real app hook populates; leaving empty to preserve current usage pattern
            onAddRole={() => {}}
            onUpdateRole={() => {}}
            onDeleteRole={() => {}}
          />
        </TabsContent>

        <TabsContent value="categories" className="pt-6">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="pipeline" className="pt-6">
          <PipelineStageManager />
        </TabsContent>

        <TabsContent value="locations" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Localizações</CardTitle>
              <CardDescription>Gerencie os locais físicos de inventário usados pelo sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Esta seção mostra as localizações existentes; para editar/criar localizações utilize o painel de Localizações na área administrativa específica.
              </p>

              <div className="grid gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="location-name" className="sr-only">Nova Localização</Label>
                    <Input id="location-name" placeholder="Nome da nova localização (usar painel específico)" disabled />
                  </div>
                  <Button variant="outline" onClick={() => window.alert("Gerencie localizações via a seção dedicada.")}>Abrir</Button>
                </div>

                <div className="rounded-md border divide-y">
                  {/* lightweight listing for visibility */}
                  {(clients || []).slice(0, 6).map((c, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email || "—"}</div>
                      </div>
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover item?</AlertDialogTitle>
                              <p className="text-sm text-muted-foreground">Esta ação é apenas ilustrativa nesta aba por enquanto.</p>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => window.alert("Remoção simulada")}>Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {(clients || []).length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground text-center">Nenhuma localização cadastrada ainda.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="pt-6">
          {canManageServices ? (
            <AdminServicesPage />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Serviços (Acesso restrito)</CardTitle>
                <CardDescription>Você não tem permissão para gerenciar serviços aqui.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Lista rápida de serviços cadastrados:</div>
                <div className="mt-4 space-y-2">
                  {services.slice(0, 8).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.description || "—"}</div>
                      </div>
                      <Badge variant="outline">Ver</Badge>
                    </div>
                  ))}
                  {services.length === 0 && <div className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</div>}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="general" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Opções Gerais</CardTitle>
              <CardDescription>Configurações de sistema rápidas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Modo de Manutenção</Label>

                  <div className="text-sm text-muted-foreground">Ativa/Desativa acesso público (ilustrativo).</div>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={(v) => setMaintenanceMode(!!v)} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Permitir Registro de Usuários</Label>
                  <div className="text-sm text-muted-foreground">Quando desativado, novos registros são bloqueados.</div>
                </div>
                <Switch checked={userRegistration} onCheckedChange={(v) => setUserRegistration(!!v)} />
              </div>

              <div>
                <Label>Chaves de API</Label>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <Input value="************************" readOnly />
                  <Input value="************************" readOnly />
                </div>
                <div className="mt-3">
                  <Button variant="outline" onClick={() => window.alert("Gerar novas chaves (ilustrativo)")}>Gerar Novas Chaves</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}