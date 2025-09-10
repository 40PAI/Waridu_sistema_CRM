"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission, Role as ConfigRole } from "@/config/roles";

type DBRole = { id: string; name: ConfigRole };

const formSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  roleId: z.string().min(1, "Selecione uma função."),
});

type FormValues = z.infer<typeof formSchema>;

const InviteMember = () => {
  const { user } = useAuth();
  const userRole = user?.profile?.role;

  const canInvite = !!userRole && hasActionPermission(userRole, "members:invite");

  const [roles, setRoles] = React.useState<DBRole[]>([]);
  const [rolesLoading, setRolesLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", roleId: "" },
    mode: "onBlur",
  });

  React.useEffect(() => {
    let active = true;
    const loadRoles = async () => {
      setRolesLoading(true);
      const { data, error } = await supabase.from("roles").select("id, name").order("name", { ascending: true });
      if (!active) return;
      if (error) {
        console.error("Erro ao carregar funções:", error);
        showError("Não foi possível carregar as funções.");
        setRoles([]);
      } else {
        setRoles((data || []) as DBRole[]);
      }
      setRolesLoading(false);
    };
    loadRoles();
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (!canInvite) {
      showError("Você não tem permissão para convidar membros.");
      return;
    }

    setSubmitting(true);

    const selectedRole = roles.find((r) => r.id === values.roleId);
    const roleName = selectedRole?.name || "Técnico";

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Erro ao obter sessão:", sessionError);
      showError("Sessão inválida. Faça login novamente.");
      setSubmitting(false);
      return;
    }

    const token = sessionData?.session?.access_token;

    // Chama a edge function (usa o nome da função com o client do Supabase)
    const { error } = await supabase.functions.invoke("invite-member", {
      body: { email: values.email.trim(), roleId: values.roleId, roleName },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (error) {
      console.error("Erro ao enviar convite:", error);
      showError(error.message || "Falha ao enviar convite.");
      setSubmitting(false);
      return;
    }

    showSuccess(`Convite enviado para ${values.email} com a função de ${roleName}!`);
    form.reset();
    setSubmitting(false);
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="nome@exemplo.com"
                        type="email"
                        autoComplete="email"
                        disabled={submitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="role">Função</Label>
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          disabled={rolesLoading || submitting}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="role">
                            <SelectValue placeholder={rolesLoading ? "Carregando..." : "Selecione uma função"} />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button className="w-full mt-2" type="submit" disabled={submitting || rolesLoading}>
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