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
import { Combobox } from "@/components/ui/combobox";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { useEmployees } from "@/hooks/useEmployees";
import { useRoles } from "@/hooks/useRoles";

const formSchema = z.object({
  employeeId: z.string().min(1, "Selecione um funcionário."),
  roleId: z.string().min(1, "Selecione uma função."),
});

type FormValues = z.infer<typeof formSchema>;

const InviteMember = () => {
  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const canInvite = !!userRole && hasActionPermission(userRole, "members:invite");

  const { employees } = useEmployees();
  const { roles } = useRoles();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { employeeId: "", roleId: "" },
  });

  const employeeOptions = React.useMemo(() => employees.map(e => ({ value: e.id, label: `${e.name} (${e.email})` })), [employees]);
  const roleOptions = React.useMemo(() => roles.filter(r => ['Admin', 'Coordenador', 'Gestor de Material', 'Financeiro', 'Técnico'].includes(r.name)).map(r => ({ value: r.id, label: r.name })), [roles]);

  const onSubmit = async (values: FormValues) => {
    if (!canInvite) {
      showError("Você não tem permissão para convidar membros.");
      return;
    }

    setSubmitting(true);
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
      form.reset();
    } catch (err: any) {
      showError(err.message || "Erro ao enviar convite.");
    } finally {
      setSubmitting(false);
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
    <div className="flex justify-center items-center flex-1">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Convidar Novo Membro</CardTitle>
          <CardDescription>Digite o e-mail e selecione a função para enviar um convite.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                          {roleOptions.map(r => <SelectItem key={r.value} value={r.label}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full mt-2" type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar Convite"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteMember;