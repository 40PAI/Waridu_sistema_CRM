import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const AuthCallback = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        showError("Erro ao processar autenticação.");
        navigate("/login");
        return;
      }

      if (data?.session) {
        showSuccess("Autenticação bem-sucedida!");
        navigate("/");
      } else {
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Processando autenticação...</p>
    </div>
  );
};

export default AuthCallback;