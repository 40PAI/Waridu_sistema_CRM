import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { useEmployees } from "@/hooks/useEmployees";
import { useUsers } from "@/hooks/useUsers";
import { useUserLogs } from "@/hooks/useUserLogs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, UserPlus, Crown, Ban, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const inviteSchema = z.object({
  employeeId: z.string().min(1, "Selecione um funcionário."),
  roleName: z.enum(["Técnico", "Financeiro", "Gestor de Material", "Admin"], { message: "Selecione um role válido." }), // Hardcoded roles específicos
});

type InviteFormValues = z.infer<typeof inviteSchema>;

// Roles específicos que você quer (hardcoded para o dropdown)
const specificRoles = [
  { value: "Técnico", label: "Técnico (acesso a páginas de técnico)" },
  { value: "Financeiro", label: "Financeiro (acesso a páginas financeiras)" },
  { value: "Gestor de Material", label: "Gestor de Material (acesso a materiais e requisições)" },
  { value: "Admin", label: "Admin (acesso total a todas as páginas)" },
] as const;

const InviteMember = () => {
  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const canInvite = !!userRole && hasActionPermission(userRole, "members:invite");
  const canPromote = !!userRole && hasActionPermission(userRole, "members:promote");
  const canBan = !!userRole && hasActionPermission(userRole, "members:ban");
  const canDelete = !!userRole && hasActionPermission(userRole, "members:delete");

  const { employees } = useEmployees();
  const { users, refreshUsers } = useUsers(); // Fixed: Added 'users' to destructuring
  const { logs, loading: logsLoading } = useUserLogs();

  const [inviteSubmitting, setInviteSubmitting] = React.useState(false);
  const [banDialog, setBanDialog] = React.useState<{ open: boolean; userId: string }>({ open: false, userId: '' });
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; userId: string }>({ open: false, userId: '' });
  const [banReason, setBanReason] = React.useState('');
  const [banUntil, setBanUntil] = React.useState('');
  const [deleteReason, setDeleteReason] = React.useState('');

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { employeeId: "", roleName: "Técnico" }, // Default para Técnico
  });

  // Filtrar roles disponíveis baseado no role do usuário logado
  const availableRoles = React.useMemo(() => {
    return specificRoles.filter(role => {
      // Apenas admins podem convidar/promover para Admin
      if (userRole !== 'Admin' && role.value === 'Admin') {
        return false;
      }
      return true;
    });
  }, [userRole]);

  // Filtrar apenas funcionários que ainda não têm usuário associado
  const availableEmployees = React.useMemo(() => {
    const employeesWithUsers = new Set(users.map(u => u.employee?.id).filter(Boolean));
    return employees.filter(e => !employeesWithUsers.has(e.id));
  }, [employees, users]);

  const employeeOptions = React.useMemo(() => availableEmployees.map(e => ({ value: e.id, label: `${e.name} (${e.email})` })), [availableEmployees]);

  const handleInvite = async (values: InviteFormValues) => {
    if (!canInvite) return;
    setInviteSubmitting(true);
    const selectedEmployee = employees.find(e => e.id === values.employeeId);
    if (!selectedEmployee) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("invite-member", {
        body: { 
          email: selectedEmployee.email, 
          roleName: values.roleName, // Role específico selecionado
          employeeId: values.employeeId 
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      showSuccess(`Convite enviado para ${selectedEmployee.email} com role ${values.roleName}! Ele terá acesso às páginas correspondentes.`);
      inviteForm.reset();
      refreshUsers(); // Atualizar lista de usuários após convite
    } catch (err: any) {
      showError(err.message || "Erro ao enviar convite.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handlePromote = async (targetUserId: string, newRole: string) => {
    if (!canPromote) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("promote-user", {
        body: { targetUserId, newRole, reason: `Atribuição de role via dropdown` },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      showSuccess(`Role "${newRole}" atribuído! O membro agora tem acesso às páginas correspondentes.`);
      refreshUsers(); // Recarrega a lista para refletir mudanças
    } catch (err: any) {
      showError(err.message || "Erro ao atualizar role.");
    }
  };

  const handleBan = async () => {
    if (!canBan || !banUntil || !banReason) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("ban-user", {
        body: { targetUserId: banDialog.userId, bannedUntil: banUntil, reason: banReason },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      showSuccess("Usuário banido!");
      setBanDialog({ open: false, userId: '' });
      setBanReason('');
      setBanUntil('');
      refreshUsers();
    } catch (err: any) {
      showError(err.message || "Erro ao banir.");
    }
  };

  const handleDelete = async () => {
    if (!canDelete || !deleteReason) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { targetUserId: deleteDialog.userId, reason: deleteReason },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      showSuccess("Usuário eliminado!");
      setDeleteDialog({ open: false, userId: '' });
      setDeleteReason('');
      refreshUsers();
    } catch (err: any) {
      showError(err.message || "Erro ao eliminar.");
    }
  };

  if (!canInvite) {
    return (
      <div className="flex justify-center items-center flex-1">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso não autorizado</CardTitle>
            <CardDescription>Você não possui permissão para gerenciar membros.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="/">Voltar ao início</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Membros</h1>
        <p className="text-muted-foreground">Convide novos membros ou atribua roles a existentes para controlar acesso às páginas.</p>
      </div>

      <Tabs defaultValue="invite">
        <TabsList>
          <TabsTrigger value="invite">Convidar Novo</TabsTrigger>
          <TabsTrigger value="list">Lista de Membros</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle>Convidar Novo Membro</CardTitle>
              <CardDescription>Selecione um funcionário e atribua um role específico para dar acesso às páginas correspondentes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(handleInvite)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funcionário</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um funcionário para convidar" />
                            </SelectTrigger>
                            <SelectContent>
                              {employeeOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={inviteForm.control}
                    name="roleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role a Atribuir</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o role (acesso a páginas específicas)" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={inviteSubmitting}>
                    {inviteSubmitting ? "Enviando..." : "Enviar Convite"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Membros</CardTitle>
              <CardDescription>Atribua roles diretamente para dar acesso às páginas (ex: Técnico acessa dashboard técnico).</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Role Atual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback>{u.first_name?.[0] || u.email[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.first_name} {u.last_name}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {canPromote ? (
                          <Select
                            value={u.role}
                            onValueChange={(newRole) => handlePromote(u.id, newRole)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Atribuir Role" />
                            </SelectTrigger>
                            <SelectContent>
                              {specificRoles
                                .filter(role => role.value !== u.role) // Exclui o atual
                                .map(role => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{u.role}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === 'active' ? 'default' : u.status === 'banned' ? 'destructive' : 'secondary'}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canBan && u.status !== 'banned' && (
                            <Button variant="outline" size="icon" onClick={() => setBanDialog({ open: true, userId: u.id })}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="outline" size="icon" onClick={() => setDeleteDialog({ open: true, userId: u.id })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ações</CardTitle>
              <CardDescription>Registros de convites, atribuições de roles, bans e deletes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Por</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5}>Carregando...</TableCell>
                    </TableRow>
                  ) : logs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>{format(new Date(l.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                      <TableCell>{l.action_type}</TableCell>
                      <TableCell>{l.actor_name}</TableCell>
                      <TableCell>{l.target_email}</TableCell>
                      <TableCell>{JSON.stringify(l.details)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogos para Ban e Delete (mantidos como antes) */}
      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ ...banDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="ban-until">Data de Fim do Ban</Label>
            <Input 
              id="ban-until" 
              name="ban-until"
              autoComplete="off"
              type="datetime-local" 
              value={banUntil} 
              onChange={(e) => setBanUntil(e.target.value)} 
            />
            <Label htmlFor="ban-reason">Motivo</Label>
            <Textarea 
              id="ban-reason"
              name="ban-reason"
              autoComplete="off"
              value={banReason} 
              onChange={(e) => setBanReason(e.target.value)} 
              placeholder="Motivo obrigatório" 
            />
          </div>
          <DialogFooter>
            <Button onClick={handleBan}>Confirmar Ban</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Usuário</AlertDialogTitle>
            <AlertDialogDescription>Isso é irreversível. Motivo obrigatório.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea 
            id="delete-reason"
            name="delete-reason"
            autoComplete="off"
            value={deleteReason} 
            onChange={(e) => setDeleteReason(e.target.value)} 
            placeholder="Motivo obrigatório" 
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InviteMember;