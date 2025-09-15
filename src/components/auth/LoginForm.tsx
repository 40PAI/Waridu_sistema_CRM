"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";
import { Package2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface LoginFormProps {
  onForgotPasswordClick: () => void;
}

export const LoginForm = ({ onForgotPasswordClick }: LoginFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          showError("Email ou senha incorretos.");
        } else {
          showError(error.message);
        }
        return;
      }

      showSuccess("Login realizado com sucesso!");
      navigate("/", { replace: true });
    } catch (error: any) {
      showError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Package2 className="h-8 w-8" />
            <span className="text-2xl font-bold">Sua Empresa</span>
          </div>
          <CardTitle className="text-2xl">Acessar Painel</CardTitle>
          <CardDescription>Faça login para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Endereço de e-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Sua senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              type="button"
              onClick={onForgotPasswordClick}
              className="text-sm p-0 h-auto"
              disabled={loading}
            >
              Esqueci minha senha
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};