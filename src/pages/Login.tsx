import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package2 } from "lucide-react";

const LoginPage = () => {
  // Por enquanto, a função de login será apenas um placeholder.
  const handleLogin = () => {
    alert("Lógica de login a ser implementada!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Package2 className="h-8 w-8" />
            <span className="text-2xl font-bold">Sua Empresa</span>
          </div>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Digite seu e-mail para acessar o painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <a href="#" className="ml-auto inline-block text-sm underline">
                  Esqueceu sua senha?
                </a>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" onClick={handleLogin}>
              Entrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;