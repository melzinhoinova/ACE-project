"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Session, User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  company_name: string;
  avatar_url: string | null;
  niche: string | null;
  phone: string | null;
  role: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil:", error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar perfil:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Busca a sessão atual ao inicializar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Escuta mudanças de estado da autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        setLoading(true);
        await fetchProfile(newSession.user.id);
        setLoading(false);
      } else {
        setProfile(null);
        setLoading(false);
      }

      // Sincroniza cookies para o middleware
      if (event === 'SIGNED_IN') {
        document.cookie = `sb-access-token=${newSession?.access_token || ''}; path=/; max-age=604800; SameSite=Lax`;
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao realizar logout no Supabase:", err);
    }
    // Expira os cookies de autenticação
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
