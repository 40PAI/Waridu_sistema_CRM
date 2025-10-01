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

interface RegisterFormProps {
  onBackToLogin: () => void;
}

export const RegisterForm = ({ onBackToLogin }: RegisterFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      showError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      showError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message?.includes?.("User already registered")) {
          showError("Este email já está registrado.");
        } else {
          showError(error.message ?? "Erro ao criar conta.");
        }
        return;
      }

      showSuccess("Conta criada com sucesso! Verifique seu email para confirmar.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Registration unexpected error:", err);
      showError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Package2 className="h-8 w-8" />
          <span className="text-2xl font-bold">Sua Empresa</span>
        </div>
        <CardTitle className="text-2xl">Criar Conta</CardTitle>
        <CardDescription>Preencha os dados para criar sua conta.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-email">Endereço de e-mail</Label>
            <Input
              id="register-email"
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
            <Label htmlFor="register-password">Senha</Label>
            <Input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Senha</Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando conta..." : "Criar Conta"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            type="button"
            onClick={onBackToLogin}
            className="text-sm p-0 h-auto"
            disabled={loading}
          >
            Já tem uma conta? Fazer login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;
