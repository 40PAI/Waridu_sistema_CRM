"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package2 } from "lucide-react";

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
        if (error.message?.includes?.("Invalid login credentials")) {
          showError("Email ou senha incorretos.");
        } else {
          showError(error.message ?? "Erro ao fazer login.");
        }
        return;
      }

      showSuccess("Login realizado com sucesso!");
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Login unexpected error:", err);
      showError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Use 'azure' for Microsoft provider (supabase supports 'azure' for Microsoft OAuth)
  const handleOAuthLogin = async (provider: "google" | "azure") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("OAuth error:", err);
      showError(`Erro ao fazer login com ${provider === "azure" ? "Microsoft" : "Google"}. Tente novamente.`);
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin("google")}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.01L15.07 8.34C14.43 8.06 13.72 7.88 12 7.88c-2.86 0-5.29 1.93-6.16 4.53H2.18C3.99 7.47 7.7 5 12 5z" />
              </svg>
              Continuar com Google
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin("azure")}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#00A4EF" d="M12 1h10v10H12z" />
                <path fill="#7FBA00" d="M1 12h10v10H1z" />
                <path fill="#FFB900" d="M12 12h10v10H12z" />
              </svg>
              Continuar com Microsoft
            </Button>
          </div>

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

export default LoginForm;