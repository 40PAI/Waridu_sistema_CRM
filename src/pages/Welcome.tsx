import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { showSuccess } from "@/utils/toast";

const WelcomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.profile?.role || "usuário";

  React.useEffect(() => {
    if (user) {
      showSuccess(`Bem-vindo, ${user.email}! Seu acesso como ${role} foi ativado.`);
    }
  }, [user]);

  const goToDashboard = () => {
    const paths: Record<string, string> = {
      "Técnico": "/technician/dashboard",
      "Financeiro": "/finance/dashboard",
      "Gestor de Material": "/",
      "Admin": "/",
      "Coordenador": "/"
    };
    navigate(paths[role] || "/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo ao Sistema!</CardTitle>
          <CardDescription>
            Seu acesso como <strong>{role}</strong> foi ativado com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Você receberá notificações e poderá acessar as funcionalidades exclusivas do seu perfil.
          </p>
          <Button onClick={goToDashboard} className="w-full">
            Ir para o Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomePage;