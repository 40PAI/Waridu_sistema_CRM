import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: (User & { profile: { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null; role: string } | null }) | null;
  session: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<(User & { profile: { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null; role: string } | null }) | null>>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthContextType["user"]>(null);
  const [session, setSession] = React.useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    navigate("/login");
  };

  React.useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Initial session error:", sessionError);
        return;
      }

      if (initialSession?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url, role")
          .eq("id", initialSession.user.id)
          .single();

        if (profileError) {
          console.error("Auth state profile error:", profileError);
        }

        // Se não tem role, redireciona para welcome
        if (!profileData?.role) {
          navigate("/welcome");
          setUser({ ...initialSession.user, profile: null });
          return;
        }

        setUser({
          ...initialSession.user,
          profile: profileData,
        });
        setSession(initialSession);
      } else {
        setUser(null);
        setSession(null);
      }
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === "SIGNED_IN" && nextSession?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url, role")
          .eq("id", nextSession.user.id)
          .single();

        if (profileError) {
          console.error("Auth state profile error:", profileError);
        }

        // Se não tem role, redireciona para welcome
        if (!profileData?.role) {
          navigate("/welcome");
          setUser({ ...nextSession.user, profile: null });
          return;
        }

        setUser({
          ...nextSession.user,
          profile: profileData,
        });
        setSession(nextSession);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, session, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};