import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Role } from "@/types"; // use Role type from centralized types (DB shape)
import { Edit, Trash2, Plus } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { RoleManager } from "@/components/settings/RoleManager";
import CategoryManager from "@/components/settings/CategoryManager";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PipelinePhaseManager from "@/components/settings/PipelinePhaseManager"; // Import the new component

interface Location {
  id: string;
  name: string;
}

interface AdminSettingsProps {
  roles: Role[];
  onAddRole: (name: string) => void;
  onUpdateRole: (id: string, name: string) => void;
  onDeleteRole: (id: string) => void;

  locations: Location[];
  onAddLocation: (name: string) => void;
  onUpdateLocation: (id: string, name: string) => void;
  onDeleteLocation: (id: string) => void;
}

const AdminSettings = ({ roles, onAddRole, onUpdateRole, onDeleteRole, locations, onAddLocation, onUpdateLocation, onDeleteLocation }: AdminSettingsProps) => {
  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const canManageCategories = userRole ? hasActionPermission(userRole, "categories:manage") : false;
  const canManageServices = userRole ? hasActionPermission(userRole, "services:manage") : false;
  const canManagePipeline = userRole === 'Admin'; // Only Admin can manage pipeline phases

  const { services, createService, updateService, deleteService } = useServices();

  const [editingService, setEditingService] = React.useState<any>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = React.useState(false);
  const [serviceName, setServiceName] = React.useState("");
  const [serviceDescription, setServiceDescription] = React.useState("");
  const [savingService, setSavingService] = React.useState(false);

  const handleAddService = () => {
    setEditingService(null);
    setServiceName("");
    setServiceDescription("");
    setIsServiceDialogOpen(true);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceDescription(service.description || "");
    setIsServiceDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceName.trim()) {
      showError("Nome do serviço é obrigatório.");
      return;
    }

    setSavingService(true);
    try {
      if (editingService) {
        await updateService(editingService.id, { name: serviceName.trim(), description: serviceDescription.trim() || undefined });
        showSuccess("Serviço atualizado com sucesso!");
      } else {
        await createService({ name: serviceName.trim(), description: serviceDescription.trim() || undefined });
        showSuccess("Serviço criado com sucesso!");
      }
      setIsServiceDialogOpen(false);
    } catch (error: any) {
      showError(error.message || "Erro ao salvar serviço.");
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteService(serviceId);
      showSuccess("Serviço removido com sucesso!");
    } catch (error: any) {
      showError(error.message || "Erro ao remover serviço.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações do Admin</h1>
      <p className="text-muted-foreground">Gerencie as configurações gerais do sistema, roles, categorias e pipeline.</p>

      <Tabs defaultValue="roles">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <TabsTrigger value="roles">Funções</TabsTrigger>
          <TabsTrigger value="categories">Categorias de Técnicos</TabsTrigger>
          <TabsTrigger value="locations">Localizações</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          {canManagePipeline && <TabsTrigger value="pipeline-config">Configuração do Pipeline</TabsTrigger>}
        </TabsList>

        <TabsContent value="roles">
          <RoleManager roles={roles} onAddRole={onAddRole} onUpdateRole={onUpdateRole} onDeleteRole={onDeleteRole} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Localizações de Inventário</CardTitle>
              <CardDescription>Gerencie os locais onde seus materiais estão armazenados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input placeholder="Ex: Armazém Central" />
                <Button onClick={() => {}}>Adicionar</Button>
              </div>
              <div className="rounded-md border divide-y">
                {locations.map(loc => (
                  <div key={loc.id} className="flex items-center justify-between p-3">
                    <span className="text-sm">{loc.name}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover localização?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Os materiais nesta localização serão movidos para outra disponível. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteLocation(loc.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {locations.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground text-center">Nenhuma localização cadastrada.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          {canManageServices ? (
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Serviços</CardTitle>
                <CardDescription>Crie, edite ou remova serviços disponíveis para clientes e projetos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-end">
                  <Button onClick={handleAddService}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Serviço
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map(service => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>{service.description || "—"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditService(service)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remover
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Serviço?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Isso removerá o serviço de todos os clientes e projetos. Tem certeza?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

              </CardContent>
            </Card>
          ) : (
            <p>Permissão negada para gerenciar serviços.</p>
          )}
        </TabsContent>

        {canManagePipeline && (
          <TabsContent value="pipeline-config">
            <PipelinePhaseManager />
          </TabsContent>
        )}
      </Tabs>

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

      {/* Modal para criar/editar serviço */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nome *</Label>
              <Input
                id="service-name"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Ex: Sonorização"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-description">Descrição</Label>
              <Textarea
                id="service-description"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="Descrição opcional..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveService} disabled={savingService}>
              {savingService ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettings;