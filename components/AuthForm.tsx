"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { normalizeAuthError, validateEmail, validatePassword } from "@/lib/auth/password";
import { getSupabaseBrowserClient, isSupabaseAuthConfigured } from "@/lib/auth/supabaseClient";
import { SocialLoginButtons } from "@/components/SocialLoginButtons";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const configured = isSupabaseAuthConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const passwordErrors = useMemo(() => validatePassword(password), [password]);
  const title = mode === "login" ? "로그인" : "회원가입";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!validateEmail(email)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }

    if (passwordErrors.length) {
      setError(passwordErrors[0]);
      return;
    }

    if (mode === "signup" && nickname.trim().length < 2) {
      setError("닉네임은 2자 이상 입력해 주세요.");
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Supabase URL과 Anon Key를 설정하면 실제 회원가입/로그인이 활성화됩니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nickname: nickname.trim(),
              marketingConsent: false,
              notificationConsent: false
            }
          }
        });

        if (signUpError) throw signUpError;
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setError("이미 가입된 이메일일 수 있습니다. 로그인 또는 비밀번호 재설정을 이용해 주세요.");
          return;
        }

        setMessage("회원가입이 완료되었습니다. 관심 카테고리를 선택해 주세요.");
        window.setTimeout(() => router.push("/onboarding"), 800);
        return;
      }

      const { error: signInError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) throw signInError;
      setMessage("로그인되었습니다.");
      window.setTimeout(() => router.push("/mypage"), 500);
    } catch (authError) {
      setError(normalizeAuthError(authError instanceof Error ? authError.message : ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-xl">
        <div className="p-5 sm:p-7">
          <p className="text-sm font-black text-red-200">할인도사 계정</p>
          <h1 className="mt-2 text-3xl font-black">{title}</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
            회원가입하면 관심 특가를 저장하고, 찜한 상품과 가격 하락 알림을 받을 수 있어요.
          </p>
        </div>
      </section>

      {!configured ? (
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
          Supabase 환경변수가 아직 비어 있습니다. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 넣으면 실제 인증이 활성화됩니다.
        </div>
      ) : null}

      <SocialLoginButtons mode={mode} />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-black text-slate-400">또는 이메일로 계속</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-4">
          {mode === "signup" ? (
            <label className="block">
              <span className="text-sm font-black text-slate-700">닉네임</span>
              <span className="mt-2 flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-red-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-50">
                <UserRound size={18} className="text-slate-400" />
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="예: 특가탐험가"
                  className="w-full bg-transparent text-sm font-bold outline-none"
                  autoComplete="nickname"
                />
              </span>
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm font-black text-slate-700">이메일</span>
            <span className="mt-2 flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-red-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-50">
              <Mail size={18} className="text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm font-bold outline-none"
                autoComplete="email"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-700">비밀번호</span>
            <span className="mt-2 flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-red-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-50">
              <LockKeyhole size={18} className="text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="영문+숫자 포함 8자 이상"
                className="w-full bg-transparent text-sm font-bold outline-none"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </span>
            <p className="mt-2 text-xs font-bold leading-relaxed text-slate-500">
              비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.
            </p>
          </label>
        </div>

        {error ? <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-dossa-red">{error}</p> : null}
        {message ? <p role="status" className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-dossa-red px-5 py-4 text-sm font-black text-white transition hover:bg-dossa-deep disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "처리 중" : title}
          <ArrowRight size={17} />
        </button>

        <p className="mt-4 text-center text-sm font-bold text-slate-500">
          {mode === "login" ? "아직 계정이 없나요?" : "이미 계정이 있나요?"}{" "}
          <Link href={mode === "login" ? "/signup" : "/login"} className="font-black text-dossa-red">
            {mode === "login" ? "회원가입" : "로그인"}
          </Link>
        </p>
      </form>
    </div>
  );
}
