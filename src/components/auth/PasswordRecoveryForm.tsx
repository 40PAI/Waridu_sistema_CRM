"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const PasswordRecoveryForm = ({ onBackToLogin }: { onBackToLogin: () => void }) => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState<'request' | 'sent'>('request');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.includes('User not found')) {
          showError("Nenhum usuário encontrado com este email.");
        } else {
          showError(error.message);
        }
        return;
      }

      showSuccess("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setStep('sent');
    } catch (error: any) {
      showError("Erro ao enviar email de recuperação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  if (step === 'sent') {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Mail className="h-8 w-8 mx-auto mb-4 text-primary" />
          <CardTitle className="text-2xl">Email Enviado</CardTitle>
          <CardDescription>
            Verifique sua caixa de entrada (e pasta de spam) para o link de recuperação de senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleBackToLogin} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Login
          </Button>
          <Button 
            variant="link" 
            onClick={() => setStep('request')}
            className="w-full justify-start"
          >
            Enviar outro email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <Mail className="h-8 w-8 mx-auto mb-4 text-primary" />
        <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
        <CardDescription>
          Digite seu email para receber instruções de recuperação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recovery-email">Endereço de e-mail</Label>
            <Input
              id="recovery-email"
              name="recovery-email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Link de Recuperação"}
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
            <ArrowLeft className="h-4 w-4 mr-2 inline" />
            Voltar ao Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};