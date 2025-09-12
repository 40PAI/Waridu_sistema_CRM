import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  technician_category_id?: string | null;
}

type AuthedUser = User & { profile?: Profile | null };

interface AuthContextType {
  session: Session | null;
  user: AuthedUser | null;
  profile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthedUser | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ? ({ ...(initialSession.user as User) } as AuthedUser) : null);
      if (initialSession?.user) {
        await loadProfile(initialSession.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ? ({ ...(nextSession.user as User) } as AuthedUser) : null);
      if (nextSession?.user) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role, banned_until")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Load profile error:", profileError);
        setProfile(null);
        // still merge null to keep shape
        setUser(prev => prev ? ({ ...prev, profile: null }) as AuthedUser : null);
        return;
      }

      let technician_category_id: string | null = null;
      if (profileData?.role === 'Técnico') {
        const { data: empData, error: empError } = await supabase
          .from('employees')
          .select('technician_category')
          .eq('user_id', userId)
          .maybeSingle();
        if (empError) {
          console.error("Load employee error:", empError);
        } else {
          technician_category_id = empData?.technician_category || null;
        }
      }

      const mergedProfile: Profile = {
        id: profileData?.id || userId,
        first_name: profileData?.first_name ?? null,
        last_name: profileData?.last_name ?? null,
        avatar_url: profileData?.avatar_url ?? null,
        role: profileData?.role || 'Técnico',
        technician_category_id,
      };

      setProfile(mergedProfile);
      setUser(prev => prev ? ({ ...prev, profile: mergedProfile }) as AuthedUser : prev);
    } catch (error) {
      console.error("Unexpected error loading profile:", error);
      setProfile(null);
      setUser(prev => prev ? ({ ...prev, profile: null }) as AuthedUser : prev);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};