import { supabase } from "@/integrations/supabase/client";

export const useAuthHelper = () => {
  /**
   * ✅ Helper para limpar sessão durante reset de senha
   * Garante que o usuário não fique logado durante o processo de recuperação
   */
  const clearSessionForReset = async () => {
    try {
      // Tenta fazer logout primeiro
      const { error: logoutError } = await supabase.auth.signOut();
      
      if (logoutError) {
        console.warn("Warning: logout during reset failed:", logoutError);
        // Fallback: limpa o localStorage também
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-email');
      }
      
      console.log("Session cleared for password reset");
      return true;
    } catch (err) {
      console.error("Error clearing session:", err);
      return false;
    }
  };

  /**
   * ✅ Helper para verificar se o usuário está logado
   */
  const isAuthenticated = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (err) {
      return false;
    }
  };

  /**
   * ✅ Helper para verificar se o token de recuperação é válido
   */
  const isValidRecoveryToken = async (tokenHash: string, type: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      });

      return !error && !!data;
    } catch (err) {
      return false;
    }
  };

  return {
    clearSessionForReset,
    isAuthenticated,
    isValidRecoveryToken,
  };
};