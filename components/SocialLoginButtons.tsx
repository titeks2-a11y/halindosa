"use client";

import { useState } from "react";
import { Chrome, MessageCircle, Search } from "lucide-react";
import { getRuntimeAuthRedirectUrl } from "@/lib/auth/redirect";
import { getSupabaseBrowserClient, isSupabaseAuthConfigured } from "@/lib/auth/supabaseClient";
import { normalizeAuthError } from "@/lib/auth/password";

interface SocialLoginButtonsProps {
  mode: "login" | "signup";
}

const socialProviders = [
  {
    id: "google",
    label: "구글로 3초 만에 시작하기",
    shortLabel: "Google",
    icon: Chrome,
    enabled: true,
    nextPath: "/onboarding"
  },
  {
    id: "kakao",
    label: "카카오로 계속하기",
    shortLabel: "Kakao",
    icon: MessageCircle,
    enabled: true,
    nextPath: "/onboarding"
  },
  {
    id: "naver",
    label: "네이버로 계속하기",
    shortLabel: "Naver",
    icon: Search,
    enabled: false,
    nextPath: "/onboarding"
  }
] as const;

type SupportedProvider = "google" | "kakao";

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const configured = isSupabaseAuthConfigured();
  const [error, setError] = useState("");
  const [loadingProvider, setLoadingProvider] = useState("");

  const startOAuth = async (provider: (typeof socialProviders)[number]) => {
    setError("");

    if (!provider.enabled) {
      setError("네이버 로그인은 현재 준비 중입니다. 지금은 이메일, 구글, 카카오 로그인 또는 비회원 탐색을 이용해주세요.");
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!configured || !client) {
      setError("현재 빠른 로그인 준비 중입니다. 특가 탐색은 비회원으로 계속 이용할 수 있습니다.");
      return;
    }

    setLoadingProvider(provider.id);

    try {
      const { error: oauthError } = await client.auth.signInWithOAuth({
        provider: provider.id as SupportedProvider,
        options: {
          redirectTo: await getRuntimeAuthRedirectUrl(mode === "signup" ? provider.nextPath : "/")
        }
      });

      if (oauthError) throw oauthError;
    } catch (authError) {
      setError(normalizeAuthError(authError instanceof Error ? authError.message : ""));
      setLoadingProvider("");
    }
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="space-y-2">
        <p className="text-sm font-black text-slate-950">빠른 시작</p>
        <p className="text-xs font-bold leading-5 text-slate-500">
          {mode === "signup"
            ? "가입하면 찜한 특가와 관심 카테고리를 이어서 볼 수 있어요."
            : "자주 보는 특가와 찜 목록을 계정으로 이어보세요."}
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        {socialProviders.map((provider) => {
          const Icon = provider.icon;
          const loading = loadingProvider === provider.id;

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => void startOAuth(provider)}
              disabled={loading}
              className={`flex min-h-13 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition disabled:cursor-wait disabled:opacity-70 ${
                provider.id === "kakao"
                  ? "border-yellow-200 bg-yellow-300 text-slate-950 hover:bg-yellow-200"
                  : provider.id === "naver"
                    ? "border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "border-slate-200 bg-white text-slate-900 hover:border-red-100 hover:bg-red-50"
              }`}
            >
              <Icon size={18} />
              {loading ? "연결 중" : provider.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black leading-5 text-dossa-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
