"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseAuthConfigured } from "@/lib/auth/supabaseClient";

interface AuthContextValue {
  configured: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  nickname: string;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseAuthConfigured();
  const [isLoading, setIsLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const client = useMemo(() => getSupabaseBrowserClient(), []);

  const refresh = async () => {
    if (!client) {
      setIsLoading(false);
      setSession(null);
      return;
    }

    setIsLoading(true);
    const { data } = await client.auth.getSession();
    setSession(data.session ?? null);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!client) return;

    client.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setIsLoading(false);
    });
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, [client]);

  const value: AuthContextValue = {
    configured,
    isLoading,
    session,
    user: session?.user ?? null,
    nickname: (session?.user?.user_metadata?.nickname as string | undefined) || (session?.user?.email?.split("@")[0] ?? ""),
    refresh,
    signOut: async () => {
      if (!client) return;
      await client.auth.signOut();
      setSession(null);
    },
    updateNickname: async (nickname: string) => {
      if (!client) return { error: "계정 기능을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요." };
      const cleanNickname = nickname.trim();
      if (cleanNickname.length < 2) return { error: "닉네임은 2자 이상 입력해 주세요." };
      const { error } = await client.auth.updateUser({ data: { nickname: cleanNickname } });
      if (error) return { error: error.message };
      await refresh();
      return {};
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
