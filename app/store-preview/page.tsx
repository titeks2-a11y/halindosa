import type { Metadata } from "next";
import Link from "next/link";
import { Camera, CheckCircle2, ExternalLink } from "lucide-react";
import { storeScreenshotScenes } from "@/data/storeScreenshotScenes";

export const metadata: Metadata = {
  title: "할인도사 스토어 스크린샷 촬영 보드",
  robots: {
    index: false,
    follow: false
  }
};

export default function StorePreviewPage() {
  return (
    <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-sm lg:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dossa-red">
            <Camera size={24} />
          </span>
          <div>
            <p className="text-xs font-black text-red-200">스토어 제출 준비</p>
            <h1 className="mt-1 text-2xl font-black">스크린샷 촬영 보드</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-300">
              Play Store와 App Store 등록용 화면을 같은 기준으로 촬영하기 위한 내부 보드입니다. 실제 촬영은 각 링크를 열고 Android Emulator, 실제 Android 기기, iPhone Simulator 또는 실제 iPhone에서 진행합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {storeScreenshotScenes.map((scene, index) => (
          <article key={scene.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-dossa-red">컷 {index + 1}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{scene.title}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{scene.id}</span>
            </div>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{scene.caption}</p>

            <div className="mt-4 rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-black text-slate-500">보여줄 핵심 UI</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {scene.focus.map((item) => (
                  <span key={item} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {scene.checklist.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs font-bold leading-5 text-slate-600">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-dossa-red" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href={scene.route}
              className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-dossa-red"
            >
              촬영 화면 열기
              <ExternalLink size={17} />
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-[22px] border border-red-100 bg-red-50 p-4">
        <h2 className="text-base font-black text-slate-950">촬영 전 공통 기준</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
          외부 결제 화면, 개인정보가 보이는 계정, 내부 운영 지표, 숫자 신뢰도, 가격 보장 문구는 스크린샷에 포함하지 않습니다. 가격과 재고는 판매처에서 변동될 수 있다는 안내가 앱 안에 자연스럽게 보이는 화면을 우선 촬영합니다.
        </p>
      </section>
    </div>
  );
}
