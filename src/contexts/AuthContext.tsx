import * as React from "react";
import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { Role } from "@/config/roles";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: Role;
}

interface User extends SupabaseUser {
  profile: UserProfile | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[AuthProvider] Inicializando...");
    let mounted = true;

    const getInitialSession = async () => {
      try {
        console.log("[AuthProvider] Obtendo sessão...");
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[AuthProvider] Erro ao obter sessão:", sessionError);
          throw new Error(`Falha ao obter sessão: ${sessionError.message}`);
        }

        if (!mounted) return;
        
        console.log("[AuthProvider] Sessão obtida:", !!initialSession);
        setSession(initialSession);
        
        if (initialSession?.user) {
          console.log("[AuthProvider] Carregando perfil do usuário...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("[AuthProvider] Erro ao carregar perfil:", profileError);
            throw new Error(`Falha ao carregar perfil: ${profileError.message}`);
          }
          
          if (!mounted) return;
          
          console.log("[AuthProvider] Perfil carregado:", !!profile);
          setUser({ ...initialSession.user, profile: profile as UserProfile });
        }
      } catch (err) {
        console.error("[AuthProvider] Erro crítico:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erro desconhecido no provedor de autenticação");
        }
      } finally {
        if (mounted) {
          console.log("[AuthProvider] Finalizando carregamento...");
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] Estado de autenticação alterado: ${event}`);
      try {
        setSession(session);
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("[AuthProvider] Erro ao carregar perfil em onAuthStateChange:", profileError);
            throw new Error(`Falha ao carregar perfil: ${profileError.message}`);
          }
          
          setUser({ ...session.user, profile: profile as UserProfile });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("[AuthProvider] Erro em onAuthStateChange:", err);
        setError(err instanceof Error ? err.message : "Erro ao atualizar estado de autenticação");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    console.log("[AuthProvider] Realizando logout...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[AuthProvider] Erro ao fazer logout:", error);
      setError(`Falha ao sair: ${error.message}`);
    }
  };

  const value = {
    session,
    user,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};