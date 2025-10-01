"use client";

import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useEffect, useState } from "react";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState<'form' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = React.useState("");

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || window.location.origin;

  // Debug logs - Mantenha estes para sempre ou remova após resolver
  useEffect(() => {
    console.log("=== DEBUG RESET PASSWORD LOADED ===");
    console.log("URL completa:", window.location.href);
    console.log("Parâmetros extraídos:");
    console.log("- token_hash:", tokenHash ? "PRESENTE" : "AUSENTE");
    console.log("- type:", type || "VAZIO");
    console.log("- next:", next);
  }, []);

  useEffect(() => {
    // Verificar se o link é válido para recuperação de senha
    if (type !== 'recovery') {
      console.log("Validação falhou: type !== 'recovery'. Type recebido:", type);
      setStep('error');
      setErrorMessage(`Link inválido. Type recebido: "${type || 'vazio'}" (esperado: "recovery"). Verifique o email ou solicite um novo link.`);
      return;
    }

    if (!tokenHash) {
      console.log("Validação falhou: token_hash ausente na URL.");
      setStep('error');
      setErrorMessage("Link de recuperação inválido. O token está ausente. Solicite um novo email de recuperação.");
      return;
    }

    console.log("Validação OK. Token e type corretos. Carregando formulário.");
    // Se chegou aqui, mostra o form (sem erros)
  }, [tokenHash, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      console.log("Enviando updateUser com nova senha. Token:", tokenHash ? "PRESENTE" : "AUSENTE");
      
      // Tenta updateUser primeiro (mais direto para recovery)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error("Supabase updateUser error:", error);
        if (error.message.includes('Invalid token') || error.message.includes('Token has expired')) {
          setErrorMessage("O link de recuperação expirou ou já foi usado. Solicite um novo.");
        } else if (error.message.includes('Invalid password')) {
          setErrorMessage("Senha inválida. Digite uma senha com pelo menos 6 caracteres.");
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      console.log("Senha atualizada com sucesso! Redirecionando...");
      showSuccess("Senha atualizada com sucesso! Você será redirecionado para o login.");
      setStep('success');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (error: any) {
      console.error("Unexpected error updating password:", error);
      setErrorMessage("Erro ao atualizar senha. Tente novamente ou solicite um novo link.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  // Se ainda der erro, mostra o form mesmo assim para testes (TEMPORÁRIO - remova após resolver)
  const showFormAnyway = () => {
    console.log("MODO DEBUG: Mostrando form mesmo com validação falhando (para testes).");
    return true;
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <CardTitle className="text-xl">Erro na Recuperação</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleBackToLogin} className="w-full" variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Login
            </Button>
            <Button 
              variant="link" 
              onClick={() => navigate('/login')}
              className="w-full justify-start"
            >
              Solicitar novo link de recuperação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-8 w-8 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-xl">Senha Atualizada</CardTitle>
            <CardDescription>
              Sua senha foi alterada com sucesso. Você será redirecionado para o login em alguns segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleBackToLogin} className="w-full">
              Ir para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário principal (com bypass temporário se necessário)
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Lock className="h-8 w-8 mx-auto mb-4 text-primary" />
          <CardTitle className="text-xl">Nova Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha. O link de recuperação será invalidado após esta operação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Digite novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {errorMessage && (
              <div className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">
                {errorMessage}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar Senha"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              type="button"
              onClick={handleBackToLogin}
              className="text-sm p-0 h-auto"
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2 inline" />
              Voltar ao Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;