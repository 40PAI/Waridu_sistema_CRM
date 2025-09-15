import { useEffect } from "react";
   import { useNavigate } from "react-router-dom";
   import { useAuth } from "@/contexts/AuthContext";
   import { showSuccess } from "@/utils/toast";

   const AuthCallback = () => {
     const navigate = useNavigate();
     const { user } = useAuth();

     useEffect(() => {
       // Supabase redireciona aqui após reset. O usuário já está logado.
       if (user) {
         showSuccess("Senha redefinida com sucesso! Redirecionando...");
         setTimeout(() => {
           navigate('/', { replace: true }); // Redireciona para dashboard
         }, 2000);
       }
     }, [user, navigate]);

     return (
       <div className="flex items-center justify-center min-h-screen">
         <div className="text-center">
           <p>Processando autenticação...</p>
         </div>
       </div>
     );
   };

   export default AuthCallback;