import { useEffect } from "react";
   import { useNavigate } from "react-router-dom";
   import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
   import { Button } from "@/components/ui/button";
   import { Badge } from "@/components/ui/badge";
   import { useAuth } from "@/contexts/AuthContext";
   import { showSuccess } from "@/utils/toast";

   const Welcome = () => {
     const navigate = useNavigate();
     const { user } = useAuth();

     useEffect(() => {
       if (!user?.profile?.role) {
         navigate('/login', { replace: true }); // Redireciona se role inválido
       }
     }, [user, navigate]);

     const handleContinue = () => {
       showSuccess("Bem-vindo! Acesse seu dashboard.");
       navigate('/', { replace: true }); // Redireciona para dashboard do role
     };

     if (!user?.profile) return <div>Carregando...</div>;

     return (
       <div className="min-h-screen flex items-center justify-center bg-muted/40">
         <Card className="w-full max-w-md">
           <CardHeader className="text-center">
             <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
             <CardDescription>
               Sua conta foi ativada com sucesso. Aqui estão os detalhes do seu acesso.
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="text-center">
               <p className="text-sm text-muted-foreground">Seu role:</p>
               <Badge variant="default" className="text-lg">{user.profile.role}</Badge>
             </div>
             <div className="text-sm text-muted-foreground">
               <p>Como <strong>{user.profile.role}</strong>, você tem acesso a:</p>
               <ul className="list-disc list-inside mt-2">
                 {user.profile.role === 'Técnico' && (
                   <>
                     <li>Calendário de eventos</li>
                     <li>Lista de tarefas</li>
                     <li>Perfil pessoal</li>
                   </>
                 )}
                 {user.profile.role === 'Financeiro' && (
                   <>
                     <li>Dashboard financeiro</li>
                     <li>Relatórios de rentabilidade</li>
                     <li>Gestão de custos</li>
                   </>
                 )}
                 {user.profile.role === 'Admin' && (
                   <>
                     <li>Acesso total ao sistema</li>
                     <li>Gerenciamento de usuários</li>
                     <li>Configurações avançadas</li>
                   </>
                 )}
               </ul>
             </div>
             <Button onClick={handleContinue} className="w-full">
               Continuar para o Dashboard
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   };

   export default Welcome;