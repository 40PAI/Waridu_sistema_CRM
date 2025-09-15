import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const AuthCallback = () => {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          showError("Erro ao processar autenticação.");
          window.location.href = "/login";
          return;
        }

        if (data?.session) {
          showSuccess("Autenticação bem-sucedida!");
          window.location.href = "/";
        } else {
          window.location.href = "/login";
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        showError("Erro inesperado ao processar autenticação.");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Processando autenticação...</p>
      </div>
    );
  }

  return null;
};

export default AuthCallback;