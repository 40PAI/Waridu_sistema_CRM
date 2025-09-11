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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { useEmployees } from "@/hooks/useEmployees";
import { useRoles } from "@/hooks/useRoles";
import { useUsers } from "@/hooks/useUsers";
import { useUserLogs } from "@/hooks/useUserLogs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, UserPlus, Crown, Ban, Trash2 } from "lucide-react";

const inviteSchema = z.object({
  employeeId: z.string().min(1, "Selecione um funcionário."),
  roleId: z.string().min(1, "Selecione uma função."),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const InviteMember = () => {
  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const canInvite = !!userRole && hasActionPermission(userRole, "members:invite");
  const canPromote = !!userRole && hasActionPermission(userRole, "members:promote");
  const canBan = !!userRole && hasActionPermission(userRole, "members:ban");
  const canDelete = !!userRole && hasActionPermission(userRole, "members:delete");

  const { employees } = useEmployees();
  const { roles } = useRoles();
  const { users, loading: usersLoading, refreshUsers } = useUsers();
  const { logs, loading: logsLoading } = useUserLogs();

  const [inviteSubmitting, setInviteSubmitting] = React.useState(false);
  const [promoteDialog, setPromoteDialog] = React.useState<{ open: boolean; userId: string; currentRole: string }>({ open: false, userId: '', currentRole: '' });
  const [banDialog, setBanDialog] = React.useState<{ open: boolean; userId: string }>({ open: false, userId: '' });
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; userId: string }>({ open: false, userId: '' });
  const [banReason, setBanReason] = React.useState('');
  const [banUntil, setBanUntil] = React.useState('');
  const [deleteReason, setDeleteReason] = React.useState('');
  const [newRole, setNewRole] = React.useState('');

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { employeeId: "", roleId: "" },
  });

  // Mostrar TODOS os roles disponíveis (removido o filtro)
  const employeeOptions = React.useMemo(() => employees.map(e => ({ value: e.id, label: `${e.name} (${e.email})` })), [employees]);
  const roleOptions = React.useMemo(() => roles.map(r => ({ value: r.id, label: r.name })), [roles]);

  const handleInvite = async (values: InviteFormValues) => {
    if (!canInvite) return;
    setInviteSubmitting(true);
    const selectedEmployee = employees.find(e => e.id === values.employeeId);
    const selectedRole = roles.find(r => r.id === values.roleId);
    if (!selectedEmployee || !selectedRole) return;

    try {
      const { error } = await supabase.functions.invoke("invite-member", {
        body: { email: selectedEmployee.email, roleId: values.roleId, roleName: selectedRole.name, employeeId: values.employeeId },
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      });
      if (error) throw error;
      showSuccess(`Convite enviado para ${selectedEmployee.email}!`);
      inviteForm.reset();
    } catch (err: any) {
      showError(err.message || "Erro ao enviar convite.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handlePromote = async () => {
    if (!canPromote || !newRole) return;
    try {
      const { error } = await supabase.functions.invoke("promote-user", {
        body: { targetUserId: promoteDialog.userId, newRole, reason: "Promoção via admin" },
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      });
      if (error) throw error;
      showSuccess("Usuário promovido!");
      setPromoteDialog({ open: false, userId: '', currentRole: '' });
      refreshUsers();
    } catch (err: any) {
      showError(err.message || "Erro ao promover.");
    }
  };

  const handleBan = async () => {
    if (!canBan || !banUntil || !banReason) return;
    try {
      const { error } = await supabase.functions.invoke("ban-user", {
        body: { targetUserId: banDialog.userId, bannedUntil: banUntil, reason: banReason },
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
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
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { targetUserId: deleteDialog.userId, reason: deleteReason },
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
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
            <CardDescription>Você não possui permissão para convidar novos membros.</CardDescription>
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
        <p className="text-muted-foreground">Convide, promova, banir ou elimine usuários.</p>
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
              <CardDescription>Selecione um funcionário e função para enviar convite.</CardDescription>
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
                          <Combobox
                            options={employeeOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Buscar funcionário..."
                            searchPlaceholder="Digite nome ou email"
                            emptyMessage="Nenhum funcionário encontrado."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={inviteForm.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Função</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
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
              <CardDescription>Gerencie usuários existentes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5}>Carregando...</TableCell>
                    </TableRow>
                  ) : users.map(u => (
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
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        <Badge variant={u.status === 'active' ? 'default' : u.status === 'banned' ? 'destructive' : 'secondary'}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{u.last_sign_in_at ? format(new Date(u.last_sign_in_at), 'dd/MM/yyyy', { locale: ptBR }) : 'Nunca'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {canPromote && (
                              <DropdownMenuItem onClick={() => setPromoteDialog({ open: true, userId: u.id, currentRole: u.role })}>
                                <Crown className="h-4 w-4 mr-2" /> Promover
                              </DropdownMenuItem>
                            )}
                            {canBan && u.status !== 'banned' && (
                              <DropdownMenuItem onClick={() => setBanDialog({ open: true, userId: u.id })}>
                                <Ban className="h-4 w-4 mr-2" /> Banir
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, userId: u.id })}>
                                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              <CardDescription>Registros de convites, promoções, bans e deletes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Por</TableHead>
                    <TableCell>Alvo</TableCell>
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

      {/* Dialogs */}
      <Dialog open={promoteDialog.open} onOpenChange={(open) => setPromoteDialog({ ...promoteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promover Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Nova Função</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione nova função" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.filter(r => r.label !== promoteDialog.currentRole).map(r => <SelectItem key={r.value} value={r.label}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handlePromote}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ ...banDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Data de Fim do Ban</Label>
            <Input type="datetime-local" value={banUntil} onChange={(e) => setBanUntil(e.target.value)} />
            <Label>Motivo</Label>
            <Textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Motivo obrigatório" />
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
          <Textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} placeholder="Motivo obrigatório" />
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