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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Valida e normaliza dados do perfil para evitar estados inválidos
  const normalizeProfile = (raw: any, userId: string): UserProfile | null => {
    if (!raw || typeof raw !== "object") return null;
    if (raw.id !== userId) return null;
    if (typeof raw.role !== "string" || !raw.role) return null;
    return {
      id: userId,
      first_name: typeof raw.first_name === "string" ? raw.first_name : null,
      last_name: typeof raw.last_name === "string" ? raw.last_name : null,
      avatar_url: typeof raw.avatar_url === "string" ? raw.avatar_url : null,
      role: raw.role as Role,
    };
  };

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth getSession error:", error);
          if (!mounted) return;
          setSession(null);
          setUser(null);
          return;
        }

        const currentSession = data?.session ?? null;
        if (!mounted) return;
        setSession(currentSession);

        if (currentSession?.user) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, avatar_url, role")
              .eq("id", currentSession.user.id)
              .single();
            if (profileError) {
              console.error("Load profile error:", profileError);
            }
            const normalized = normalizeProfile(profileData, currentSession.user.id);
            setUser({ ...currentSession.user, profile: normalized });
          } catch (innerErr) {
            console.error("Unexpected error loading profile:", innerErr);
            setUser({ ...currentSession.user, profile: null });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Unexpected error in getInitialSession:", err);
        if (!mounted) return;
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        if (!mounted) return;
        setSession(nextSession);
        if (nextSession?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url, role")
            .eq("id", nextSession.user.id)
            .single();

          if (profileError) {
            console.error("Auth state profile error:", profileError);
          }

          const normalized = normalizeProfile(profileData, nextSession.user.id);
          setUser({ ...nextSession.user, profile: normalized });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Unexpected error in onAuthStateChange:", err);
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
    } catch (err) {
      console.error("Unexpected logout error:", err);
    }
  };

  const value = {
    session,
    user,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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