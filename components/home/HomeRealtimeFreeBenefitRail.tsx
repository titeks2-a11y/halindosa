"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { HOME_REFRESH_INTERVAL_MS } from "@/lib/homeRealtimeConfig";
import { buildHomeRequestUrl, type HomeResponse } from "@/lib/homeApi";
import { resolveRuntimeApiUrl } from "@/lib/runtimeApi";
import { getRelativeTime, getTimeLeft } from "@/lib/format";
import type { FreeBenefitEvent } from "@/types/freeBenefitEvent";

interface RealtimeState {
  status: "idle" | "loading" | "ready" | "error";
  events: FreeBenefitEvent[];
  updatedAt: string;
  freshnessLabel: string;
  message: string;
}

function isPublishableEvent(event: FreeBenefitEvent) {
  return (
    event.status === "active" &&
    event.validationStatus === "passed" &&
    !event.isHidden &&
    Boolean(event.finalUrl) &&
    event.qualityScore >= 70
  );
}

function getCtaLabel(event: FreeBenefitEvent) {
  if (event.claimCtaLabel) return event.claimCtaLabel;
  if (event.benefitType === "coupon" || /쿠폰/.test(event.title)) return "쿠폰 받기";
  if (event.benefitType === "sample" || /샘플/.test(event.title)) return "샘플 신청";
  if (event.benefitType === "gifticon" || /기프티콘|교환권/.test(event.title)) return "기프티콘 받기";
  if (event.benefitType === "pointCashback" || /포인트|캐시백/.test(event.title)) return "포인트 받기";
  return "무료 혜택 받기";
}

function getTypeLabel(event: FreeBenefitEvent) {
  if (event.isEveryoneReward) return "전원증정";
  if (event.isFirstComeFirstServed) return "선착순";
  if (event.benefitType === "freeTrial") return "무료체험";
  if (event.benefitType === "freeShipping") return "무료배송";
  if (event.benefitType === "pointCashback") return "포인트";
  if (event.benefitType === "brandEvent") return "공식이벤트";
  return event.benefitType === "coupon" ? "쿠폰" : event.benefitType === "sample" ? "샘플" : "무료혜택";
}

function getTypeTone(event: FreeBenefitEvent) {
  if (event.isFirstComeFirstServed) return "border-orange-100 bg-orange-50 text-orange-700";
  if (event.isEveryoneReward) return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (event.benefitType === "coupon") return "border-yellow-100 bg-yellow-50 text-yellow-800";
  if (event.benefitType === "sample" || event.benefitType === "freeTrial") return "border-sky-100 bg-sky-50 text-sky-700";
  if (event.benefitType === "gifticon") return "border-purple-100 bg-purple-50 text-purple-700";
  if (event.benefitType === "pointCashback") return "border-indigo-100 bg-indigo-50 text-indigo-700";
  if (event.benefitType === "freeShipping") return "border-blue-100 bg-blue-50 text-blue-700";
  return "border-rose-100 bg-rose-50 text-rose-700";
}

function getRewardSummary(event: FreeBenefitEvent) {
  return event.rewardValue || event.rewardText || event.description || event.participationCondition || "공식 페이지에서 혜택 조건 확인";
}

function getCustomerFreshnessLabel(label: string, updatedAt: string) {
  if (/재검증|stale|unknown|missing|needs_review/i.test(label)) {
    return updatedAt ? "방금 확인" : "실시간 확인 중";
  }
  return label || "실시간 검증됨";
}

function selectDiverseEvents(events: FreeBenefitEvent[], limit: number) {
  const selected: FreeBenefitEvent[] = [];
  const brandSet = new Set<string>();
  const typeSet = new Set<string>();

  for (const event of events) {
    const brandKey = (event.brandName || event.sourceDomain || event.sourceName).toLowerCase().replace(/\s+/g, "");
    const typeKey = event.benefitType;
    if (selected.length < 3 && (brandSet.has(brandKey) || typeSet.has(typeKey))) continue;
    selected.push(event);
    brandSet.add(brandKey);
    typeSet.add(typeKey);
    if (selected.length >= limit) return selected;
  }

  for (const event of events) {
    if (selected.some((item) => item.id === event.id)) continue;
    selected.push(event);
    if (selected.length >= limit) break;
  }

  return selected;
}

export function HomeRealtimeFreeBenefitRail() {
  const [state, setState] = useState<RealtimeState>({
    status: "idle",
    events: [],
    updatedAt: "",
    freshnessLabel: "실시간 확인 대기",
    message: ""
  });
  const isMountedRef = useRef(true);

  const load = async (silent = false) => {
    if (!silent) {
      setState((current) => ({ ...current, status: current.events.length ? "ready" : "loading", message: "" }));
    }

    try {
      const requestUrl = buildHomeRequestUrl({
        category: "all",
        sort: "latest",
        freeShippingOnly: false,
        hotOnly: false,
        endingSoonOnly: false,
        verifiedOnly: true,
        mallFilter: "all",
        priceBand: "all",
        benefitFilter: "all",
        query: "",
        limit: 4,
        newsLimit: 180,
        freeBenefitLimit: 64,
        timestamp: Date.now()
      });
      const runtimeUrl = await resolveRuntimeApiUrl(requestUrl);
      const response = await fetch(runtimeUrl, {
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) throw new Error(`home_api_${response.status}`);

      const data = (await response.json()) as HomeResponse;
      const events = selectDiverseEvents((data.freeBenefitEvents || []).filter(isPublishableEvent), 4);
      if (!isMountedRef.current) return;

      setState({
        status: "ready",
        events,
        updatedAt: data.updatedAt,
        freshnessLabel: data.freshness?.label || data.freebiesMeta?.freshnessLabel || "방금 업데이트",
        message: events.length ? "" : "현재 검증된 무료혜택을 다시 모으는 중입니다."
      });
    } catch {
      if (!isMountedRef.current) return;
      setState((current) => ({
        ...current,
        status: current.events.length ? "ready" : "error",
        message: "운영 API 연결 후 최신 무료혜택이 자동 갱신됩니다."
      }));
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const initialTimer = window.setTimeout(() => void load(false), 0);
    const refreshTimer = window.setInterval(() => void load(true), HOME_REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const statusCopy = useMemo(() => {
    if (state.status === "loading") return "최신 혜택 확인 중";
    if (state.status === "error") return "정적 혜택 표시 중";
    return getCustomerFreshnessLabel(state.freshnessLabel, state.updatedAt);
  }, [state.freshnessLabel, state.status, state.updatedAt]);

  if (state.status === "idle") return null;

  return (
    <section
      data-home-realtime-free-benefits="true"
      className="rounded-[22px] border border-emerald-100 bg-white p-2.5 shadow-sm"
      aria-label="실시간 무료혜택 업데이트"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[11px] font-black text-emerald-700">
            <Sparkles size={14} />
            실시간 무료혜택
          </p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500">
            {statusCopy}
            {state.updatedAt ? ` · ${getRelativeTime(state.updatedAt)} 확인` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(false)}
          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 text-[11px] font-black text-emerald-700"
          aria-label="실시간 무료혜택 다시 불러오기"
        >
          <RefreshCw size={13} className={state.status === "loading" ? "animate-spin" : ""} />
          새로고침
        </button>
      </div>

      {state.events.length ? (
        <div className="mt-2 grid grid-cols-2 gap-1.5 lg:grid-cols-4">
          {state.events.map((event) => (
            <a
              key={event.id}
              href={`/go/news/${encodeURIComponent(event.id)}?source=home_realtime_free_benefit`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-2 transition hover:border-red-100 hover:bg-red-50"
              aria-label={`${event.title} ${getCtaLabel(event)} 새 탭으로 열기`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-black ${getTypeTone(event)}`}>{getTypeLabel(event)}</span>
                <span className="truncate text-[9px] font-black text-slate-400">{getTimeLeft(event.endAt)}</span>
              </div>
              <p className="mt-1 line-clamp-2 min-h-[2rem] text-[11px] font-black leading-4 text-slate-950">{event.title}</p>
              <p className="mt-1 line-clamp-2 min-h-[1.75rem] text-[9px] font-bold leading-3.5 text-slate-500">{getRewardSummary(event)}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black text-slate-500">{event.brand || event.brandName}</span>
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black text-emerald-700">{event.isOfficial ? "공식" : "승인"}</span>
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black text-slate-500">{event.requiresPurchase ? "구매조건" : "무료조건"}</span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-black text-dossa-red">
                <ShieldCheck size={11} />
                {getCtaLabel(event)}
                <ExternalLink size={11} />
              </p>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          {state.message || "현재 검증된 무료혜택을 불러오는 중입니다."}
        </div>
      )}
    </section>
  );
}
