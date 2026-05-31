"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { getSupabaseBrowserClient, isSupabaseAuthConfigured } from "@/lib/auth/supabaseClient";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("로그인 정보를 확인하고 있습니다.");

  useEffect(() => {
    let active = true;

    async function finishAuth() {
      const next = getSafeNextPath(searchParams.get("next"));

      if (!isSupabaseAuthConfigured()) {
        setMessage("계정 로그인을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        setMessage("인증 클라이언트를 초기화하지 못했습니다.");
        return;
      }

      const { data, error } = await client.auth.getSession();
      if (!active) return;

      if (error || !data.session) {
        setMessage("로그인 처리가 완료되지 않았습니다. 다시 시도해 주세요.");
        return;
      }

      setMessage("로그인되었습니다. 할인도사로 이동합니다.");
      window.setTimeout(() => router.replace(next), 500);
    }

    void finishAuth();
    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
          {message.includes("이동") ? <CheckCircle2 size={26} /> : <Loader2 size={26} className="animate-spin" />}
        </span>
        <h1 className="mt-4 text-2xl font-black text-slate-950">소셜 로그인</h1>
        <p role="status" className="mt-3 text-sm font-bold leading-6 text-slate-500">{message}</p>
        <Link href="/login" className="mt-5 inline-flex rounded-2xl bg-dossa-red px-5 py-3 text-sm font-black text-white">
          로그인으로 돌아가기
        </Link>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-10">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
              <Loader2 size={26} className="animate-spin" />
            </span>
            <h1 className="mt-4 text-2xl font-black text-slate-950">소셜 로그인</h1>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-500">로그인 정보를 확인하고 있습니다.</p>
          </section>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
