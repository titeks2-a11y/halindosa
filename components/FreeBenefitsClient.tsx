"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CalendarDays, CheckCircle2, ExternalLink, Gift, Heart, Search, Share2, ShieldCheck, Sparkles, Timer, Truck } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { readBenefitReturnReservations, writeBenefitReturnReservations } from "@/lib/benefitReturnReservations";
import { readClaimedBenefits, toggleClaimedBenefit } from "@/lib/claimedBenefits";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { formatPrice } from "@/lib/format";
import { buildDealRedirectUrl } from "@/lib/redirectUrl";
import { buildPublicDealShareUrl } from "@/lib/shareUrl";
import { Deal, DealBenefitType } from "@/types/deal";

interface FreeBenefitsClientProps {
  deals: Deal[];
}

const tabs: Array<{ id: "all" | DealBenefitType; label: string }> = [
  { id: "all", label: "전체" },
  { id: "freebie", label: "무료 샘플" },
  { id: "experience", label: "체험단" },
  { id: "coupon", label: "쿠폰" },
  { id: "freeShipping", label: "무료배송" },
  { id: "point", label: "포인트" },
  { id: "convenienceStore", label: "편의점" },
  { id: "mart", label: "마트" },
  { id: "foodDelivery", label: "배달/외식" }
];

type BenefitSort = "recommended" | "endingSoon" | "popular" | "savings";

const fiveMinuteChecklist = [
  {
    title: "무료·0원 먼저 확인",
    description: "무료 샘플, 초대권, 체험단처럼 결제 부담이 낮은 혜택부터 봅니다.",
    preset: "freebie" as const
  },
  {
    title: "결제 전 쿠폰 적용",
    description: "첫 구매, 카드사, 브랜드 쿠폰 조건과 최소 주문 금액을 확인합니다.",
    preset: "coupon" as const
  },
  {
    title: "배송비 줄이기",
    description: "무료배송, 무배 쿠폰, 장보기 조건을 같이 보면 체감 절약이 커집니다.",
    preset: "freeShipping" as const
  },
  {
    title: "마감 전 다시 확인",
    description: "선착순, 기간 한정, 종료 예정 혜택은 판매처에서 최종 상태를 확인합니다.",
    preset: "endingSoon" as const
  }
];

const benefitGuardrails = [
  ["무료 혜택", "배송비, 체험단 조건, 회원가입 필요 여부를 먼저 확인"],
  ["쿠폰/포인트", "최소 주문 금액, 중복 적용, 적립 예정일을 확인"],
  ["편의점/마트", "행사 지점, 앱 쿠폰 발급 여부, 재고 변동 가능성 확인"],
  ["배달/외식", "지역, 시간대, 브랜드별 제외 메뉴와 결제 수단 조건 확인"]
];

function readFavorites() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem("halindosa:favorites") ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  window.localStorage.setItem("halindosa:favorites", JSON.stringify(ids));
}

function getMinimumOrderLabel(deal: Deal) {
  if (!deal.minimumOrderAmount) return "최소 주문 없음";
  return `${formatPrice(deal.minimumOrderAmount)} 이상`;
}

function getPriorityReason(deal: Deal, referenceNow: number) {
  const hoursLeft = (new Date(deal.expireAt).getTime() - referenceNow) / (60 * 60 * 1000);
  if (deal.isExpired) return "종료 가능성이 있어 판매처 상태를 먼저 확인하세요.";
  if (hoursLeft <= 6 || deal.isEndingSoon) return "마감 시간이 가까워 지금 먼저 확인할 혜택입니다.";
  if (deal.dealType === "freebie" || deal.dealType === "experience") return "비용 부담이 낮은 무료·체험 혜택입니다.";
  if (deal.dealType === "coupon" || deal.dealType === "foodDelivery") return "결제 전 쿠폰 조건을 먼저 챙기기 좋습니다.";
  if (deal.dealType === "point") return "출석체크나 페이 적립처럼 매일 반복 확인하기 좋습니다.";
  if (deal.isFreeShipping) return "배송비를 줄일 수 있어 생활비 절약 체감이 큽니다.";
  return "반응과 링크 상태가 좋은 혜택입니다.";
}

function getPriorityScore(deal: Deal, referenceNow: number) {
  const hoursLeft = Math.max(0, (new Date(deal.expireAt).getTime() - referenceNow) / (60 * 60 * 1000));
  const urgencyScore = Math.max(0, 36 - hoursLeft) * 2;
  const benefitScore = deal.dealType === "freebie" || deal.dealType === "experience" ? 22 : deal.dealType === "coupon" || deal.dealType === "point" ? 16 : 8;
  const trustScore = deal.isVerified ? 12 : 0;
  const shippingScore = deal.isFreeShipping ? 8 : 0;
  const engagementScore = Math.min(20, deal.clickCount * 0.18 + deal.likeCount * 0.35);

  return urgencyScore + benefitScore + trustScore + shippingScore + engagementScore + deal.reliabilityScore * 0.08;
}

export function FreeBenefitsClient({ deals }: FreeBenefitsClientProps) {
  const [referenceNow] = useState(() => Date.now());
  const [activeType, setActiveType] = useState<"all" | DealBenefitType>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<BenefitSort>("recommended");
  const [endingSoonOnly, setEndingSoonOnly] = useState(false);
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [noSignupOnly, setNoSignupOnly] = useState(false);
  const [firstComeOnly, setFirstComeOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites());
  const [claimedBenefits, setClaimedBenefits] = useState(() => readClaimedBenefits());
  const [benefitReturnReservations, setBenefitReturnReservations] = useState(() => readBenefitReturnReservations());
  const [message, setMessage] = useState("");

  const filteredDeals = useMemo(() => {
    const searchQuery = query.trim().toLowerCase();
    let source = activeType === "all" ? deals : deals.filter((deal) => deal.dealType === activeType);

    if (searchQuery) {
      source = source.filter((deal) =>
        [
          deal.title,
          deal.mallName,
          deal.category,
          deal.subCategory ?? "",
          deal.benefitSummary,
          deal.couponCondition ?? "",
          ...deal.tags
        ].some((value) => value.toLowerCase().includes(searchQuery))
      );
    }

    if (endingSoonOnly) source = source.filter((deal) => deal.isEndingSoon || new Date(deal.expireAt).getTime() - referenceNow < 12 * 60 * 60 * 1000);
    if (freeShippingOnly) source = source.filter((deal) => deal.isFreeShipping || deal.shippingFee === "무료배송");
    if (noSignupOnly) source = source.filter((deal) => !deal.requiresSignup);
    if (firstComeOnly) source = source.filter((deal) => deal.isFirstComeFirstServed);
    if (activeOnly) source = source.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken");

    return [...source].sort((a, b) => {
      const activeScore = Number(a.isExpired) - Number(b.isExpired);
      if (activeScore !== 0) return activeScore;
      if (sort === "endingSoon") return new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime();
      if (sort === "popular") return b.clickCount - a.clickCount || b.likeCount - a.likeCount;
      if (sort === "savings") return b.savingsAmount - a.savingsAmount || b.savingsRate - a.savingsRate;
      return b.reliabilityScore - a.reliabilityScore || b.clickCount - a.clickCount || new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime();
    });
  }, [activeOnly, activeType, deals, endingSoonOnly, firstComeOnly, freeShippingOnly, noSignupOnly, query, referenceNow, sort]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        tabs.map((tab) => [
          tab.id,
          tab.id === "all" ? deals.length : deals.filter((deal) => deal.dealType === tab.id).length
        ])
      ),
    [deals]
  );

  const benefitRoutines = useMemo(
    () => [
      {
        title: "오늘 먼저 받을 혜택",
        copy: "무료 샘플, 체험단, 초대권처럼 비용 없이 확인할 수 있는 혜택입니다.",
        count: deals.filter((deal) => deal.dealType === "freebie" || deal.dealType === "experience").length,
        action: "무료부터 보기",
        icon: Gift,
        onClick: () => setActiveType("freebie" as const)
      },
      {
        title: "결제 전 쿠폰 챙기기",
        copy: "첫 구매, 카드사, 브랜드 공식몰 쿠폰 조건을 구매 전에 확인합니다.",
        count: deals.filter((deal) => deal.dealType === "coupon" || deal.dealType === "foodDelivery").length,
        action: "쿠폰 모아보기",
        icon: Sparkles,
        onClick: () => setActiveType("coupon" as const)
      },
      {
        title: "앱테크·포인트 적립",
        copy: "출석체크, 페이 리워드, 멤버십 포인트처럼 생활비를 줄이는 혜택입니다.",
        count: deals.filter((deal) => deal.dealType === "point").length,
        action: "포인트 보기",
        icon: Timer,
        onClick: () => setActiveType("point" as const)
      },
      {
        title: "장보기·편의점 행사",
        copy: "편의점 1+1, 마트 무료배송, 장보기 쿠폰을 한 번에 좁혀봅니다.",
        count: deals.filter((deal) => deal.dealType === "convenienceStore" || deal.dealType === "mart" || deal.isFreeShipping).length,
        action: "생활 혜택 보기",
        icon: Truck,
        onClick: () => setActiveType("convenienceStore" as const)
      },
      {
        title: "문화 초대권 찾기",
        copy: "영화 시사회, 전시, 공연, 티켓 초대권처럼 빨리 마감되는 문화 혜택만 바로 좁혀봅니다.",
        count: deals.filter((deal) => /영화|시사회|전시|공연|초대권|티켓/.test(`${deal.title} ${deal.tags.join(" ")} ${deal.benefitSummary}`)).length,
        action: "초대권 보기",
        icon: CalendarDays,
        onClick: () => {
          setActiveType("all");
          setQuery("초대권");
          setActiveOnly(true);
          setSort("endingSoon");
        }
      }
    ],
    [deals]
  );

  const priorityQueue = useMemo(
    () =>
      [...deals]
        .filter((deal) => !deal.isSoldOut && deal.linkStatus !== "broken")
        .sort((a, b) => getPriorityScore(b, referenceNow) - getPriorityScore(a, referenceNow))
        .slice(0, 5),
    [deals, referenceNow]
  );
  const weeklyBenefitPlan = useMemo(
    () => [
      {
        day: "월",
        title: "출석·포인트 적립",
        copy: "한 주 시작에 앱테크와 페이 적립 혜택을 먼저 챙깁니다.",
        count: deals.filter((deal) => deal.dealType === "point").length,
        onClick: () => {
          setActiveType("point");
          setSort("recommended");
          setActiveOnly(true);
        }
      },
      {
        day: "화",
        title: "무료 샘플·체험단",
        copy: "신청형 혜택은 선착순이 많아 초반에 먼저 확인합니다.",
        count: deals.filter((deal) => deal.dealType === "freebie" || deal.dealType === "experience").length,
        onClick: () => {
          setActiveType("freebie");
          setFirstComeOnly(true);
          setActiveOnly(true);
        }
      },
      {
        day: "수",
        title: "쿠폰·배달 할인",
        copy: "외식, 배달, 첫 구매 쿠폰 조건을 결제 전에 점검합니다.",
        count: deals.filter((deal) => deal.dealType === "coupon" || deal.dealType === "foodDelivery").length,
        onClick: () => {
          setActiveType("coupon");
          setSort("popular");
          setActiveOnly(true);
        }
      },
      {
        day: "목",
        title: "마트·편의점 행사",
        copy: "주말 장보기 전 1+1, 마트 행사, 무배 조건을 모아봅니다.",
        count: deals.filter((deal) => deal.dealType === "mart" || deal.dealType === "convenienceStore" || deal.isFreeShipping).length,
        onClick: () => {
          setActiveType("mart");
          setFreeShippingOnly(true);
          setActiveOnly(true);
        }
      },
      {
        day: "금",
        title: "마감 전 최종 확인",
        copy: "주말 전에 끝날 수 있는 혜택을 마감 임박순으로 정리합니다.",
        count: deals.filter((deal) => deal.isEndingSoon || new Date(deal.expireAt).getTime() - referenceNow < 24 * 60 * 60 * 1000).length,
        onClick: () => {
          setActiveType("all");
          setEndingSoonOnly(true);
          setFirstComeOnly(true);
          setSort("endingSoon");
        }
      }
    ],
    [deals, referenceNow]
  );
  const activeBenefitCount = useMemo(
    () => deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken").length,
    [deals]
  );
  const filteredReadinessSummary = useMemo(
    () => [
      {
        title: "바로 받을 가능성",
        value: `${filteredDeals.filter((deal) => !deal.requiresSignup && !deal.isExpired && !deal.isSoldOut).length}개`,
        copy: "가입 없이 받기, 진행 중 상태를 우선 봅니다.",
        action: "가입 없이",
        onClick: () => {
          setNoSignupOnly(true);
          setActiveOnly(true);
        }
      },
      {
        title: "추가 비용 낮음",
        value: `${filteredDeals.filter((deal) => deal.isFreeShipping || deal.shippingFee === "무료배송" || deal.salePrice <= 1000).length}개`,
        copy: "무료배송, 0원, 배송비 부담이 낮은 혜택입니다.",
        action: "무배/0원",
        onClick: () => {
          setFreeShippingOnly(true);
          setActiveOnly(true);
        }
      },
      {
        title: "오늘 먼저 확인",
        value: `${filteredDeals.filter((deal) => deal.isEndingSoon || deal.isFirstComeFirstServed).length}개`,
        copy: "마감 임박, 선착순 가능성이 있는 혜택입니다.",
        action: "마감순",
        onClick: () => {
          setEndingSoonOnly(true);
          setFirstComeOnly(true);
          setSort("endingSoon");
        }
      },
      {
        title: "실제 링크 확인",
        value: `${filteredDeals.filter((deal) => deal.linkStatus === "verified" && deal.finalPurchaseUrl).length}개`,
        copy: "신청/구매 상세로 바로 이동 가능한 혜택입니다.",
        action: "신뢰 링크",
        onClick: () => {
          setActiveOnly(true);
          setSort("recommended");
        }
      }
    ],
    [filteredDeals]
  );
  const filteredRiskReview = useMemo(
    () => [
      {
        title: "숨은 비용 확인",
        value: `${filteredDeals.filter((deal) => !deal.isFreeShipping && deal.shippingFee !== "무료배송" && deal.salePrice > 0).length}개`,
        copy: "무료처럼 보여도 배송비, 옵션가, 최소 주문 금액이 붙을 수 있는 혜택입니다.",
        action: "배송비 보기",
        onClick: () => {
          setFreeShippingOnly(false);
          setActiveOnly(true);
          setSort("savings");
        }
      },
      {
        title: "가입 조건 확인",
        value: `${filteredDeals.filter((deal) => deal.requiresSignup).length}개`,
        copy: "판매처 회원가입, 앱 설치, 신규 가입 조건이 붙을 수 있어 먼저 확인합니다.",
        action: "가입 없는 혜택",
        onClick: () => {
          setNoSignupOnly(true);
          setActiveOnly(true);
        }
      },
      {
        title: "선착순·마감 위험",
        value: `${filteredDeals.filter((deal) => deal.isFirstComeFirstServed || deal.isEndingSoon || deal.isExpired).length}개`,
        copy: "마감 시간, 수량 제한, 종료 가능성을 기준으로 빨리 봐야 할 혜택입니다.",
        action: "마감순 보기",
        onClick: () => {
          setEndingSoonOnly(true);
          setFirstComeOnly(true);
          setSort("endingSoon");
        }
      },
      {
        title: "신고 전 확인",
        value: `${filteredDeals.filter((deal) => deal.reportCount > 0 || deal.linkStatus !== "verified" || deal.isSoldOut).length}개`,
        copy: "신고 누적, 링크 확인 필요, 품절 가능성이 있어 판매처 상태를 다시 봅니다.",
        action: "진행 중만",
        onClick: () => {
          setActiveOnly(true);
          setSort("recommended");
        }
      }
    ],
    [filteredDeals]
  );
  const claimedBenefitIds = useMemo(() => new Set(claimedBenefits.map((record) => record.dealId)), [claimedBenefits]);
  const claimedTodayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return claimedBenefits.filter((record) => record.claimedAt.slice(0, 10) === today).length;
  }, [claimedBenefits]);
  const claimedSavings = useMemo(() => claimedBenefits.reduce((total, record) => total + record.savingsAmount, 0), [claimedBenefits]);
  const savedBenefitCount = useMemo(() => deals.filter((deal) => favorites.includes(deal.id)).length, [deals, favorites]);
  const dailyMissionCards = useMemo(
    () => [
      {
        title: "무료 혜택 1개 챙기기",
        copy: "무료 샘플, 체험단, 초대권처럼 비용 부담이 낮은 혜택을 오늘 하나 확인합니다.",
        done: claimedTodayCount > 0,
        status: claimedTodayCount > 0 ? "완료" : "시작",
        onClick: () => {
          setActiveType("freebie");
          setActiveOnly(true);
          setSort("recommended");
        }
      },
      {
        title: "쿠폰 1개 저장하기",
        copy: "결제 전 다시 쓸 수 있는 쿠폰, 포인트, 배달 혜택을 찜으로 남깁니다.",
        done: savedBenefitCount > 0,
        status: savedBenefitCount > 0 ? "저장됨" : "저장 전",
        onClick: () => {
          setActiveType("coupon");
          setSort("popular");
          setActiveOnly(true);
        }
      },
      {
        title: "내일 볼 루틴 예약",
        copy: "아침 무료 혜택, 저녁 쿠폰 점검, 마감 전 확인 중 하나를 기기에 저장합니다.",
        done: benefitReturnReservations.length > 0,
        status: benefitReturnReservations.length > 0 ? "예약됨" : "예약 전",
        onClick: () => {
          setActiveType("all");
          setEndingSoonOnly(true);
          setSort("endingSoon");
        }
      }
    ],
    [benefitReturnReservations.length, claimedTodayCount, savedBenefitCount]
  );
  const recentClaimedBenefits = claimedBenefits.slice(0, 3);
  const needsFinalCheckCount = deals.length - activeBenefitCount;
  const nextVisitPlan = useMemo(
    () => [
      {
        title: "내일 아침 먼저 볼 혜택",
        copy: "출석체크, 포인트 적립, 무료 샘플처럼 매일 열어볼수록 놓칠 가능성이 줄어드는 혜택입니다.",
        count: deals.filter((deal) => deal.dealType === "point" || deal.dealType === "freebie" || deal.dealType === "experience").length,
        action: "아침 루틴 보기",
        onClick: () => {
          setActiveType("point");
          setActiveOnly(true);
          setSort("recommended");
        }
      },
      {
        title: "퇴근 전 확인할 쿠폰",
        copy: "배달, 외식, 편의점, 마트 쿠폰처럼 시간대와 지점 조건을 다시 확인해야 하는 혜택입니다.",
        count: deals.filter((deal) => deal.dealType === "foodDelivery" || deal.dealType === "coupon" || deal.dealType === "convenienceStore" || deal.dealType === "mart").length,
        action: "저녁 쿠폰 보기",
        onClick: () => {
          setActiveType("coupon");
          setSort("popular");
          setActiveOnly(true);
        }
      },
      {
        title: "마감 전 재확인",
        copy: "선착순, 기간 한정, 종료 가능 혜택은 다음 방문 때도 판매처 상태를 다시 보는 흐름으로 관리합니다.",
        count: deals.filter((deal) => deal.isEndingSoon || deal.isFirstComeFirstServed || deal.isExpired).length,
        action: "마감순 보기",
        onClick: () => {
          setActiveType("all");
          setEndingSoonOnly(true);
          setFirstComeOnly(true);
          setSort("endingSoon");
        }
      }
    ],
    [deals]
  );
  const benefitReturnPlan = useMemo(
    () => [
      {
        id: "morning-free",
        title: "아침 무료 혜택",
        slot: "내일 오전",
        copy: "무료 샘플, 체험단, 초대권처럼 선착순 가능성이 있는 혜택을 아침에 먼저 확인합니다.",
        count: deals.filter((deal) => deal.dealType === "freebie" || deal.dealType === "experience").length,
        action: "무료 루틴 저장",
        onClick: () => {
          setActiveType("freebie");
          setActiveOnly(true);
          setSort("recommended");
        }
      },
      {
        id: "evening-coupon",
        title: "저녁 쿠폰 점검",
        slot: "퇴근 전",
        copy: "배달, 외식, 편의점, 마트 쿠폰처럼 결제 직전에 다시 봐야 할 혜택입니다.",
        count: deals.filter((deal) => ["coupon", "foodDelivery", "convenienceStore", "mart"].includes(deal.dealType)).length,
        action: "쿠폰 루틴 저장",
        onClick: () => {
          setActiveType("coupon");
          setActiveOnly(true);
          setSort("popular");
        }
      },
      {
        id: "deadline-check",
        title: "마감 전 확인",
        slot: "마감 전",
        copy: "오늘 끝날 수 있거나 선착순인 혜택을 다음 방문 때 바로 마감순으로 이어봅니다.",
        count: deals.filter((deal) => deal.isEndingSoon || deal.isFirstComeFirstServed).length,
        action: "마감 루틴 저장",
        onClick: () => {
          setActiveType("all");
          setEndingSoonOnly(true);
          setFirstComeOnly(true);
          setSort("endingSoon");
        }
      }
    ],
    [deals]
  );
  const claimedFollowUpPlan = useMemo(
    () => [
      {
        title: "아직 안 챙긴 무료 혜택",
        value: `${deals.filter((deal) => (deal.dealType === "freebie" || deal.dealType === "experience") && !claimedBenefitIds.has(deal.id)).length}개`,
        copy: "오늘 기록에 없는 샘플, 체험단, 0원 혜택을 먼저 이어봅니다.",
        action: "무료 남은 것 보기",
        onClick: () => {
          setActiveType("freebie");
          setActiveOnly(true);
          setSort("recommended");
        }
      },
      {
        title: "결제 전 다시 볼 쿠폰",
        value: `${deals.filter((deal) => ["coupon", "foodDelivery", "point"].includes(deal.dealType) && !claimedBenefitIds.has(deal.id)).length}개`,
        copy: "쿠폰, 포인트, 배달 혜택은 다음 결제 전에 다시 확인하기 좋습니다.",
        action: "쿠폰 이어보기",
        onClick: () => {
          setActiveType("coupon");
          setActiveOnly(true);
          setSort("popular");
        }
      },
      {
        title: "마감 전 놓치기 쉬운 혜택",
        value: `${deals.filter((deal) => (deal.isEndingSoon || new Date(deal.expireAt).getTime() - referenceNow < 24 * 60 * 60 * 1000) && !claimedBenefitIds.has(deal.id)).length}개`,
        copy: "선착순, 기간 한정, 종료 가능 혜택을 다음 방문 때 먼저 엽니다.",
        action: "마감 전 확인",
        onClick: () => {
          setActiveType("all");
          setEndingSoonOnly(true);
          setFirstComeOnly(true);
          setSort("endingSoon");
        }
      }
    ],
    [claimedBenefitIds, deals, referenceNow]
  );
  const sourceOverview = useMemo(
    () => [
      {
        title: "제공처 확인",
        value: `${new Set(deals.map((deal) => deal.sourceName || deal.mallName)).size}곳`,
        copy: "혜택 제공처를 상품 카드와 이동 전 화면에서 다시 확인합니다."
      },
      {
        title: "실제 링크 확인",
        value: `${deals.filter((deal) => deal.linkStatus === "verified" && deal.finalPurchaseUrl).length}개`,
        copy: "메인/이벤트 홈이 아니라 실제 상품·혜택 상세 이동을 우선 사용합니다."
      },
      {
        title: "조건 요약",
        value: `${deals.filter((deal) => deal.shippingFee || deal.couponCondition || deal.minimumOrderAmount || deal.requiresSignup).length}개`,
        copy: "배송비, 쿠폰 조건, 회원가입 필요 여부를 받기 전에 요약합니다."
      },
      {
        title: "신고 가능",
        value: "상시",
        copy: "종료, 링크 오류, 가격 변경은 카드에서 바로 신고할 수 있습니다."
      }
    ],
    [deals]
  );
  const decisionCards = useMemo(
    () => [
      {
        title: "지금 받을 수 있는 혜택",
        copy: "종료, 품절, 링크 오류 가능성이 낮은 진행 중 혜택만 먼저 봅니다.",
        count: activeBenefitCount,
        icon: ExternalLink,
        onClick: () => {
          setActiveOnly(true);
          setEndingSoonOnly(false);
        }
      },
      {
        title: "가입 없이 받기",
        copy: "회원가입이 필요 없다고 표시된 무료·쿠폰 혜택으로 좁혀봅니다.",
        count: deals.filter((deal) => !deal.requiresSignup).length,
        icon: Gift,
        onClick: () => {
          setNoSignupOnly(true);
          setActiveOnly(true);
        }
      },
      {
        title: "선착순 먼저",
        copy: "수량이 빨리 끝날 수 있는 혜택을 먼저 확인합니다.",
        count: deals.filter((deal) => deal.isFirstComeFirstServed).length,
        icon: Timer,
        onClick: () => {
          setFirstComeOnly(true);
          setSort("endingSoon");
        }
      },
      {
        title: "배송비 부담 낮추기",
        copy: "무료배송 또는 배송비 조건이 낮은 혜택을 먼저 봅니다.",
        count: deals.filter((deal) => deal.isFreeShipping || deal.shippingFee === "무료배송").length,
        icon: Truck,
        onClick: () => {
          setFreeShippingOnly(true);
          setActiveOnly(true);
        }
      }
    ],
    [activeBenefitCount, deals]
  );
  const benefitReadinessPlan = useMemo(
    () => [
      {
        title: "회원가입 없이 받을 혜택",
        value: deals.filter((deal) => !deal.requiresSignup).length,
        copy: "계정 생성 없이 받을 가능성이 높은 혜택을 먼저 확인합니다.",
        action: "가입 없이 보기",
        onClick: () => {
          setNoSignupOnly(true);
          setActiveOnly(true);
          setSort("recommended");
        }
      },
      {
        title: "배송비 부담 없는 혜택",
        value: deals.filter((deal) => deal.isFreeShipping || deal.shippingFee === "무료배송").length,
        copy: "무료처럼 보여도 배송비가 붙는 혜택을 걸러 체감 비용을 낮춥니다.",
        action: "무배만 보기",
        onClick: () => {
          setFreeShippingOnly(true);
          setActiveOnly(true);
          setSort("recommended");
        }
      },
      {
        title: "선착순 먼저 챙길 혜택",
        value: deals.filter((deal) => deal.isFirstComeFirstServed).length,
        copy: "수량 제한이나 조기 종료 가능성이 높은 혜택을 마감순으로 정리합니다.",
        action: "선착순 보기",
        onClick: () => {
          setFirstComeOnly(true);
          setEndingSoonOnly(true);
          setSort("endingSoon");
        }
      },
      {
        title: "쿠폰 조건 확인 필요",
        value: deals.filter((deal) => deal.couponCondition || deal.minimumOrderAmount || deal.isStackable).length,
        copy: "최소 주문 금액, 중복 적용, 결제수단 조건을 확인해야 하는 혜택입니다.",
        action: "쿠폰 조건 보기",
        onClick: () => {
          setActiveType("coupon");
          setSort("savings");
          setActiveOnly(true);
        }
      }
    ],
    [deals]
  );
  const couponEventBoard = useMemo(
    () => [
      {
        title: "쇼핑몰 쿠폰",
        copy: "첫 구매, 브랜드 공식몰, 장바구니 쿠폰을 결제 전에 확인합니다.",
        count: deals.filter((deal) => deal.dealType === "coupon" && !/배달|외식|카드|페이|포인트/.test(`${deal.title} ${deal.tags.join(" ")}`)).length,
        terms: ["최소 주문 금액", "중복 가능 여부", "쿠폰 조건"],
        action: "쇼핑 쿠폰 보기",
        onClick: () => {
          setActiveType("coupon");
          setSort("savings");
          setActiveOnly(true);
        }
      },
      {
        title: "배달앱 쿠폰",
        copy: "첫 주문, 브랜드 외식, 배달앱 할인처럼 시간대와 지역 조건을 확인합니다.",
        count: deals.filter((deal) => deal.dealType === "foodDelivery").length,
        terms: ["최소 주문 금액", "지역/시간 조건", "결제수단"],
        action: "배달 쿠폰 보기",
        onClick: () => {
          setActiveType("foodDelivery");
          setSort("popular");
          setActiveOnly(true);
        }
      },
      {
        title: "페이·카드·포인트",
        copy: "네이버페이, 카카오페이, 토스, 카드사 이벤트와 적립 조건을 모아봅니다.",
        count: deals.filter((deal) => deal.dealType === "point" || /카드|페이|토스|포인트|적립/.test(`${deal.title} ${deal.tags.join(" ")}`)).length,
        terms: ["적립 예정일", "대상 결제수단", "회원가입 필요"],
        action: "포인트 보기",
        onClick: () => {
          setActiveType("point");
          setSort("recommended");
          setActiveOnly(true);
        }
      },
      {
        title: "편의점·마트 행사",
        copy: "1+1, 2+1, 장보기 쿠폰, 무배 조건처럼 생활비 절약 혜택을 확인합니다.",
        count: deals.filter((deal) => deal.dealType === "convenienceStore" || deal.dealType === "mart" || deal.isFreeShipping).length,
        terms: ["행사 지점", "무료배송 조건", "재고 변동"],
        action: "생활 행사 보기",
        onClick: () => {
          setActiveType("convenienceStore");
          setFreeShippingOnly(false);
          setSort("popular");
          setActiveOnly(true);
        }
      }
    ],
    [deals]
  );
  const appTechRewardDeals = useMemo(
    () =>
      deals
        .filter((deal) => deal.dealType === "point" || /출석|포인트|적립|페이|멤버십|리워드|카드/.test(`${deal.title} ${deal.tags.join(" ")} ${deal.benefitSummary}`))
        .filter((deal) => !deal.isSoldOut && deal.linkStatus !== "broken")
        .sort((a, b) => Number(b.isHot) - Number(a.isHot) || b.reliabilityScore - a.reliabilityScore || b.clickCount - a.clickCount)
        .slice(0, 6),
    [deals]
  );
  const cultureInviteDeals = useMemo(
    () =>
      deals
        .filter((deal) => /영화|시사회|전시|공연|초대권|티켓/.test(`${deal.title} ${deal.tags.join(" ")} ${deal.benefitSummary}`))
        .filter((deal) => !deal.isSoldOut && deal.linkStatus !== "broken")
        .sort((a, b) => Number(b.isEndingSoon) - Number(a.isEndingSoon) || b.reliabilityScore - a.reliabilityScore || b.clickCount - a.clickCount)
        .slice(0, 4),
    [deals]
  );

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
      writeFavorites(next);
      setMessage(current.includes(id) ? "찜을 해제했습니다." : "혜택을 찜했습니다.");
      window.setTimeout(() => setMessage(""), 2500);
      return next;
    });
  };

  const openDeal = (deal: Deal) => {
    window.open(buildDealRedirectUrl(deal.id, "free-benefits"), "_blank", "noopener,noreferrer");
  };

  const shareDeal = async (deal: Deal) => {
    const url = buildPublicDealShareUrl(deal.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: deal.title, text: deal.benefitSummary, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("공유 링크를 복사했습니다.");
        window.setTimeout(() => setMessage(""), 2500);
      }
    } catch {
      setMessage("공유를 완료하지 못했습니다.");
      window.setTimeout(() => setMessage(""), 2500);
    }
  };

  const toggleClaimed = (deal: Deal) => {
    const next = toggleClaimedBenefit({
      dealId: deal.id,
      title: deal.title,
      mallName: deal.mallName,
      benefitSummary: deal.benefitSummary,
      savingsAmount: deal.savingsAmount,
      claimedAt: new Date().toISOString()
    });
    const wasClaimed = claimedBenefitIds.has(deal.id);

    setClaimedBenefits(next);
    setMessage(wasClaimed ? "챙긴 혜택 기록을 해제했습니다." : "오늘 챙긴 혜택으로 기록했습니다.");
    window.setTimeout(() => setMessage(""), 2500);
  };

  const toggleReturnReservation = (item: (typeof benefitReturnPlan)[number]) => {
    item.onClick();
    setBenefitReturnReservations((current) => {
      const exists = current.some((record) => record.id === item.id);
      const next = exists
        ? current.filter((record) => record.id !== item.id)
        : [{ id: item.id, title: item.title, slot: item.slot, createdAt: new Date().toISOString() }, ...current].slice(0, 5);

      writeBenefitReturnReservations(next);
      setMessage(exists ? "재방문 루틴 저장을 해제했습니다." : "내 혜택 재방문 예약함에 저장했습니다.");
      window.setTimeout(() => setMessage(""), 2500);
      return next;
    });
  };

  const resetFilters = () => {
    setQuery("");
    setActiveType("all");
    setSort("recommended");
    setEndingSoonOnly(false);
    setFreeShippingOnly(false);
    setNoSignupOnly(false);
    setFirstComeOnly(false);
    setActiveOnly(false);
  };

  const applyChecklistPreset = (preset: (typeof fiveMinuteChecklist)[number]["preset"]) => {
    setQuery("");
    setSort(preset === "endingSoon" ? "endingSoon" : "recommended");
    setEndingSoonOnly(preset === "endingSoon");
    setFreeShippingOnly(preset === "freeShipping");
    setNoSignupOnly(false);
    setFirstComeOnly(preset === "endingSoon");
    setActiveOnly(true);
    setActiveType(preset === "endingSoon" || preset === "freeShipping" ? "all" : preset);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 pb-24 pt-4 sm:px-5 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-7xl space-y-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-dossa-red">
          <ArrowLeft size={17} />
          홈으로 돌아가기
        </Link>

        <section className="overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-5 sm:p-7">
              <p className="text-xs font-black text-dossa-red">무료 혜택 전용 탭</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                오늘 받을 수 있는 무료·쿠폰 혜택
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-500">
                무료 샘플, 체험단, 무료배송, 편의점 행사, 포인트 적립을 한곳에 모았습니다. 비회원도 전부 볼 수 있고, 찜과 알림 저장만 로그인으로 이어집니다.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black sm:max-w-lg">
                <span className="rounded-2xl bg-red-50 px-3 py-3 text-dossa-red">전체 {deals.length}개</span>
                <span className="rounded-2xl bg-slate-50 px-3 py-3 text-slate-700">바로 확인 {activeBenefitCount}개</span>
                <span className="rounded-2xl bg-slate-50 px-3 py-3 text-slate-700">마감임박 {deals.filter((deal) => deal.isEndingSoon).length}개</span>
              </div>
              <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
                종료·품절 가능 혜택 {needsFinalCheckCount}개는 자동으로 뒤쪽에 배치되며, 처음 보는 사용자는 진행 중만 보기로 안전하게 좁혀볼 수 있습니다.
              </p>
            </div>
            <div className="flex min-h-64 items-center justify-center bg-dossa-red p-8 text-white">
              <div className="text-center">
                <Gift className="mx-auto" size={58} />
                <p className="mt-4 text-2xl font-black">무료·쿠폰·포인트</p>
                <p className="mt-2 text-sm font-bold text-red-50">구매 전 최종 조건은 판매처에서 확인하세요.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="수령 전 30초 확인">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">수령 전 30초 확인</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">무료 혜택도 조건을 알고 받아야 합니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              선착순, 회원가입, 배송비, 최소 주문 금액을 먼저 확인하도록 정리했습니다. 비회원도 전체 혜택을 볼 수 있습니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["진행 중 혜택", `${activeBenefitCount}개`, "종료·품절·링크 오류 가능성이 낮은 혜택을 우선 표시"],
              ["가입 없이 받기", `${deals.filter((deal) => !deal.requiresSignup).length}개`, "판매처 회원가입이 필요 없다고 표시된 혜택"],
              ["선착순 확인", `${deals.filter((deal) => deal.isFirstComeFirstServed).length}개`, "수량이 빨리 끝날 수 있어 먼저 확인할 혜택"],
              ["배송비 확인", `${deals.filter((deal) => deal.isFreeShipping || deal.shippingFee === "무료배송").length}개`, "무료배송 또는 배송비 부담이 낮은 혜택"]
            ].map(([title, value, copy]) => (
              <div key={title} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-500">{title}</p>
                <p className="mt-2 text-2xl font-black text-dossa-red">{value}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">
            무료, 쿠폰, 포인트 혜택은 판매처 사정에 따라 조기 종료될 수 있습니다. 최종 수령 가능 여부와 비용 발생 조건은 판매처 화면에서 다시 확인하세요.
          </div>
        </section>

        <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="오늘 혜택 미션">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">오늘 혜택 미션</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">하루에 세 가지만 챙기면 충분합니다</h2>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
                비회원도 무료 혜택을 보고, 챙김 기록과 재방문 루틴을 기기에 남길 수 있습니다. 로그인은 찜 동기화와 개인화 저장이 필요할 때만 선택하세요.
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-dossa-red">
              완료 {dailyMissionCards.filter((mission) => mission.done).length}/3
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {dailyMissionCards.map((mission, index) => (
              <button
                key={mission.title}
                type="button"
                onClick={mission.onClick}
                aria-pressed={mission.done}
                className={`min-h-[178px] rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                  mission.done ? "border-red-200 bg-red-50" : "border-slate-100 bg-slate-50 hover:border-red-200 hover:bg-red-50"
                }`}
                aria-label={`${mission.title} ${mission.status}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black shadow-sm ${mission.done ? "bg-dossa-red text-white" : "bg-white text-dossa-red"}`}>
                    {mission.done ? <CheckCircle2 size={20} /> : index + 1}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black shadow-sm ${mission.done ? "bg-slate-950 text-white" : "bg-white text-dossa-red"}`}>
                    {mission.status}
                  </span>
                </span>
                <span className="mt-4 block text-sm font-black text-slate-950">{mission.title}</span>
                <span className="mt-1 line-clamp-3 block text-xs font-bold leading-5 text-slate-500">{mission.copy}</span>
                <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-black text-dossa-red shadow-sm">
                  {mission.done ? "다시 보기" : "바로 시작"}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold leading-5 text-slate-500">
            오늘 혜택 미션은 알림 권한 없이 화면 안에서만 동작합니다. 실제 신청 여부와 최종 가격은 판매처에서 확인하세요.
          </p>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="혜택 준비물 체크">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">혜택 준비물 체크</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">받기 전 필요한 조건만 먼저 정리합니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              무료 혜택은 회원가입, 배송비, 선착순, 쿠폰 조건에서 체감 만족도가 갈립니다. 필요한 준비물별로 바로 좁혀보세요.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {benefitReadinessPlan.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                className="min-h-[164px] rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                aria-label={`${item.title} ${item.value}개 필터 적용`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <CheckCircle2 size={18} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">{item.value}개</span>
                </span>
                <span className="mt-4 block text-sm font-black text-slate-950">{item.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
                <span className="mt-3 inline-flex rounded-full bg-dossa-red px-3 py-1.5 text-xs font-black text-white">{item.action}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black leading-5 text-dossa-deep">
            준비물 체크는 판매처 최종 조건을 대신하지 않습니다. 이동 후 실제 신청 화면의 비용, 기간, 재고, 쿠폰 적용 조건을 다시 확인하세요.
          </p>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="쿠폰 이벤트 조건 보드">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">쿠폰·이벤트 조건 보드</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">결제 전에 조건이 있는 혜택을 먼저 정리합니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              쇼핑몰 쿠폰, 배달앱 쿠폰, 카드사·페이 이벤트, 편의점·마트 행사는 최소 주문 금액과 중복 가능 여부가 핵심입니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {couponEventBoard.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                className="min-h-[190px] rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                aria-label={`${item.title} ${item.count}개 보기`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <Sparkles size={18} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">{item.count}개</span>
                </span>
                <span className="mt-4 block text-sm font-black text-slate-950">{item.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {item.terms.map((term) => (
                    <span key={term} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                      {term}
                    </span>
                  ))}
                </span>
                <span className="mt-3 inline-flex rounded-full bg-dossa-red px-3 py-1.5 text-xs font-black text-white">{item.action}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold leading-5 text-slate-500">
            바로 받기 전에 쿠폰 조건, 최소 주문 금액, 중복 가능 여부, 만료일을 판매처 화면에서 다시 확인하세요.
          </p>
        </section>

        <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="앱테크 페이 멤버십 적립 루틴">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">앱테크·페이·멤버십</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">매일 눌러 챙길 적립 혜택을 따로 모았습니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              출석체크, 첫 결제 포인트, 페이 리워드, 통신사 멤버십은 금액보다 조건과 반복성이 중요합니다. 오늘 받을 수 있는 적립 루틴만 먼저 확인하세요.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {appTechRewardDeals.map((deal) => (
              <article key={deal.id} className="flex min-h-[214px] flex-col rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                    <Sparkles size={13} />
                    적립 루틴
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500 shadow-sm">
                    {deal.requiresSignup ? "가입 조건 확인" : "바로 확인"}
                  </span>
                </div>
                <h3 className="mt-4 line-clamp-2 text-sm font-black leading-snug text-slate-950">{deal.title}</h3>
                <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{deal.benefitSummary}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-black text-slate-600">
                  <span className="rounded-2xl bg-white px-3 py-2">제공처: {deal.mallName}</span>
                  <span className="rounded-2xl bg-white px-3 py-2">조건: {deal.couponCondition ?? (deal.requiresSignup ? "가입 필요 가능" : "간편 확인")}</span>
                  <span className="rounded-2xl bg-white px-3 py-2">만료: {new Date(deal.expireAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</span>
                  <span className="rounded-2xl bg-white px-3 py-2">적립: {formatPrice(deal.savingsAmount)}</span>
                </div>
                <div className="mt-auto grid grid-cols-[1fr_auto_auto] gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => openDeal(deal)}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-dossa-red px-3 text-xs font-black text-white"
                    aria-label={`${deal.title} 앱테크 혜택 바로 받기`}
                  >
                    바로 받기
                    <ExternalLink size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(deal.id)}
                    aria-pressed={favorites.includes(deal.id)}
                    className={`inline-flex min-h-10 items-center justify-center rounded-2xl px-3 text-xs font-black ${
                      favorites.includes(deal.id) ? "bg-red-50 text-dossa-red ring-1 ring-red-100" : "bg-white text-slate-600 shadow-sm"
                    }`}
                    aria-label={`${deal.title} 앱테크 혜택 찜 ${favorites.includes(deal.id) ? "해제" : "추가"}`}
                  >
                    <Heart size={14} fill={favorites.includes(deal.id) ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    onClick={() => shareDeal(deal)}
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-white px-3 text-xs font-black text-slate-600 shadow-sm"
                    aria-label={`${deal.title} 앱테크 혜택 공유`}
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-dossa-deep">
            포인트와 멤버십 혜택은 적립 예정일, 결제수단, 신규/기존 회원 조건이 다를 수 있습니다. 받기 전 제공처 화면에서 조건을 다시 확인하세요.
          </p>
        </section>

        <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="문화 무료 초대권">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">문화 무료 초대권</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">영화·전시·공연 혜택도 놓치지 않게 모았습니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              시사회, 전시, 공연, 티켓 이벤트는 응모 기간과 당첨 조건이 짧습니다. 무료 초대권과 문화 할인 혜택을 먼저 확인하세요.
            </p>
          </div>
          {cultureInviteDeals.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {cultureInviteDeals.map((deal) => (
                <article key={deal.id} className="flex min-h-[210px] flex-col rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                      {deal.dealType === "freebie" || deal.salePrice <= 1000 ? "무료 초대권" : "문화 할인"}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500 shadow-sm">
                      {deal.isEndingSoon ? "마감임박" : "진행 중"}
                    </span>
                  </div>
                  <h3 className="mt-4 line-clamp-2 text-sm font-black leading-snug text-slate-950">{deal.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{deal.benefitSummary}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-black text-slate-600">
                    <span className="rounded-2xl bg-white px-3 py-2">제공처: {deal.mallName}</span>
                    <span className="rounded-2xl bg-white px-3 py-2">선착순: {deal.isFirstComeFirstServed ? "확인" : "응모형"}</span>
                    <span className="rounded-2xl bg-white px-3 py-2">회원가입: {deal.requiresSignup ? "필요 가능" : "불필요"}</span>
                    <span className="rounded-2xl bg-white px-3 py-2">링크: {deal.linkStatus === "verified" ? "확인됨" : "확인 필요"}</span>
                  </div>
                  <div className="mt-auto grid grid-cols-[1fr_auto_auto] gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => openDeal(deal)}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-dossa-red px-3 text-xs font-black text-white"
                      aria-label={`${deal.title} 문화 혜택 바로 확인`}
                    >
                      바로 받기
                      <ExternalLink size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(deal.id)}
                      aria-pressed={favorites.includes(deal.id)}
                      className={`inline-flex min-h-10 items-center justify-center rounded-2xl px-3 text-xs font-black ${
                        favorites.includes(deal.id) ? "bg-red-50 text-dossa-red ring-1 ring-red-100" : "bg-white text-slate-600 shadow-sm"
                      }`}
                      aria-label={`${deal.title} 문화 혜택 찜 ${favorites.includes(deal.id) ? "해제" : "추가"}`}
                    >
                      <Heart size={14} fill={favorites.includes(deal.id) ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => shareDeal(deal)}
                      className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-white px-3 text-xs font-black text-slate-600 shadow-sm"
                      aria-label={`${deal.title} 문화 혜택 공유`}
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link
                      href={`/reports?dealId=${deal.id}&reason=expired`}
                      className="inline-flex min-h-9 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600"
                      aria-label={`${deal.title} 문화 초대권 종료 신고`}
                    >
                      종료 신고
                    </Link>
                    <Link
                      href={`/reports?dealId=${deal.id}&reason=link_error`}
                      className="inline-flex min-h-9 items-center justify-center rounded-2xl border border-red-100 bg-white px-3 text-[11px] font-black text-dossa-red"
                      aria-label={`${deal.title} 문화 초대권 링크 오류 신고`}
                    >
                      링크 오류 신고
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm font-black text-slate-950">현재 노출 가능한 문화 초대권이 없습니다.</p>
              <p className="mt-2 text-xs font-bold text-slate-500">새 시사회, 전시, 공연 혜택이 확인되면 이 영역에 먼저 표시합니다.</p>
            </div>
          )}
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-dossa-deep">
            문화 초대권은 응모형 혜택이 많아 당첨 여부, 좌석, 관람일, 동반 가능 조건을 제공처에서 반드시 확인하세요.
          </p>
        </section>

        <section className="rounded-[28px] border border-red-100 bg-red-50 p-4 shadow-sm sm:p-5" aria-label="내가 챙긴 무료 혜택 기록">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">내가 챙긴 혜택 기록</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">오늘 실제로 챙긴 혜택을 남겨보세요</h2>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-red-900/70">
                비회원도 이 기기에만 기록됩니다. 무료 샘플, 쿠폰, 포인트를 확인한 뒤 `챙김`으로 남기면 다음 방문 때 이어볼 수 있습니다.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
              <span className="rounded-2xl bg-white px-3 py-3 text-dossa-red shadow-sm">
                <b className="block text-xl">{claimedTodayCount}</b>
                오늘 챙김
              </span>
              <span className="rounded-2xl bg-white px-3 py-3 text-slate-700 shadow-sm">
                <b className="block text-xl">{claimedBenefits.length}</b>
                누적 기록
              </span>
              <span className="rounded-2xl bg-white px-3 py-3 text-slate-700 shadow-sm">
                <b className="block text-xl">{formatPrice(claimedSavings)}</b>
                절약 후보
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {recentClaimedBenefits.length ? (
              recentClaimedBenefits.map((record) => (
                <Link key={record.dealId} href={`/deals/${record.dealId}`} className="rounded-2xl bg-white p-3 shadow-sm transition hover:bg-red-100">
                  <span className="block truncate text-sm font-black text-slate-950">{record.title}</span>
                  <span className="mt-1 block truncate text-xs font-bold text-slate-500">{record.mallName} · {record.benefitSummary}</span>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-red-200 bg-white p-4 text-center text-sm font-bold text-red-900/70 md:col-span-3">
                아직 챙긴 혜택 기록이 없습니다. 아래 카드에서 받을 만한 혜택을 확인하고 `챙김`을 눌러보세요.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="챙긴 혜택 다음 방문 이어보기">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">챙긴 혜택 다음 방문 이어보기</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">오늘 기록을 기준으로 내일 볼 혜택을 정리합니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              챙김 기록은 이 기기에 저장됩니다. 가입하지 않아도 다음 방문 때 무료, 쿠폰, 마감 혜택을 이어볼 수 있습니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {claimedFollowUpPlan.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                className="min-h-[164px] rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                aria-label={`${item.title} ${item.value} 이어보기`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <CheckCircle2 size={18} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">{item.value}</span>
                </span>
                <span className="mt-4 block text-sm font-black text-slate-950">{item.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
                <span className="mt-3 inline-flex rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">{item.action}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-dossa-deep">
            오늘 챙긴 혜택이 없어도 무료 혜택, 쿠폰, 마감 임박 순서로 바로 이어볼 수 있습니다.
          </p>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="내일 다시 볼 혜택 예약">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">내일 다시 볼 혜택 예약</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">오늘 챙긴 뒤 다음 방문 순서를 남깁니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              회원가입을 강요하지 않고, 무료·쿠폰·마감 혜택을 다음 방문에도 이어볼 수 있도록 루틴을 제안합니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {nextVisitPlan.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                className="min-h-[170px] rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                aria-label={`${item.title} ${item.count}개 보기`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <CalendarDays size={20} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">{item.count}개</span>
                </span>
                <span className="mt-4 block text-sm font-black text-slate-950">{item.title}</span>
                <span className="mt-1 line-clamp-3 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
                <span className="mt-3 inline-flex rounded-full bg-dossa-red px-3 py-1.5 text-xs font-black text-white">{item.action}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black leading-5 text-dossa-deep">
            찜과 알림 저장은 선택 로그인으로 이어지고, 비회원은 이 화면의 루틴을 그대로 열람할 수 있습니다.
          </p>
        </section>

        <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="내 혜택 재방문 예약함">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">내 혜택 재방문 예약함</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">비회원도 기기에만 다음 방문 루틴을 저장합니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              실제 푸시 권한 요청 없이 무료, 쿠폰, 마감 확인 순서를 이 기기에만 남깁니다. 저장한 루틴은 다음 방문 때 바로 이어볼 수 있습니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {benefitReturnPlan.map((item) => {
              const saved = benefitReturnReservations.some((record) => record.id === item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleReturnReservation(item)}
                  aria-pressed={saved}
                  className={`min-h-[184px] rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                    saved ? "border-red-200 bg-red-50" : "border-slate-100 bg-slate-50 hover:border-red-200 hover:bg-red-50"
                  }`}
                  aria-label={`${item.title} ${saved ? "재방문 예약 해제" : "재방문 예약 저장"}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                      <CalendarDays size={20} />
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">{item.count}개</span>
                  </span>
                  <span className="mt-4 block text-sm font-black text-slate-950">{item.title}</span>
                  <span className="mt-1 block text-xs font-black text-dossa-red">{item.slot}</span>
                  <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
                  <span className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-black ${saved ? "bg-slate-950 text-white" : "bg-dossa-red text-white"}`}>
                    {saved ? "예약됨" : item.action}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black text-dossa-red">저장된 재방문 루틴 {benefitReturnReservations.length}개</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              {benefitReturnReservations.length
                ? benefitReturnReservations.map((record) => `${record.slot} ${record.title}`).join(" · ")
                : "아직 저장된 루틴이 없습니다. 아침 무료 혜택, 저녁 쿠폰 점검, 마감 전 확인 중 하나를 저장해보세요."}
            </p>
          </div>
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-dossa-deep">
            재방문 예약은 알림 발송이 아니라 이 기기 안의 탐색 루틴 저장입니다. 실제 푸시 알림은 향후 별도 동의 후 연결합니다.
          </p>
        </section>

        <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="혜택 출처와 조건 점검">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">혜택 출처·조건 점검</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">받기 전에 출처와 조건을 먼저 봅니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              무료 혜택은 제공처, 회원가입, 배송비, 종료 여부가 자주 바뀝니다. 할인도사는 이동 전 확인할 기준을 카드에 먼저 정리합니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {sourceOverview.map((item) => (
              <div key={item.title} className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <ShieldCheck size={18} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">{item.value}</span>
                </div>
                <p className="mt-4 text-sm font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.copy}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black leading-5 text-dossa-deep">
            무료·쿠폰 혜택도 판매처의 최종 조건이 우선입니다. 신청 전 제공처, 마감일, 배송비, 회원가입 필요 여부를 다시 확인하세요.
          </p>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="오늘 무료 혜택 루틴">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">오늘 무료 혜택 루틴</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">돈 쓰기 전에 이 순서로 챙기세요</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              무료, 쿠폰, 포인트, 장보기 혜택을 먼저 확인하면 같은 소비에서도 체감 절약이 커집니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {benefitRoutines.map((routine) => {
              const Icon = routine.icon;

              return (
                <button
                  key={routine.title}
                  type="button"
                  onClick={routine.onClick}
                  className="min-h-[166px] rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                  aria-label={`${routine.title} ${routine.count}개 보기`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                      <Icon size={21} />
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">{routine.count}개</span>
                  </span>
                  <span className="mt-4 block text-base font-black text-slate-950">{routine.title}</span>
                  <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{routine.copy}</span>
                  <span className="mt-3 inline-flex rounded-full bg-dossa-red px-3 py-1.5 text-xs font-black text-white">{routine.action}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="오늘 우선 확인 큐">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">오늘 우선 확인 큐</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">무료·쿠폰 혜택은 이 순서로 보세요</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              마감 시간, 무료/쿠폰 유형, 링크 확인 상태, 사용자 반응을 함께 보고 오늘 먼저 챙길 혜택을 정리했습니다.
            </p>
          </div>
          <div className="mt-4 grid gap-2">
            {priorityQueue.map((deal, index) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => openDeal(deal)}
                className="group grid min-h-[86px] grid-cols-[auto_1fr_auto] items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-red-200 hover:bg-red-50"
                aria-label={`${deal.title} 오늘 우선 확인`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-dossa-red shadow-sm">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                  <span className="mt-1 block truncate text-xs font-bold text-slate-500">
                    {deal.mallName} · {getBenefitTypeLabel(deal.dealType)} · {deal.claimCta}
                  </span>
                  <span className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{getPriorityReason(deal, referenceNow)}</span>
                </span>
                <span className="hidden shrink-0 rounded-2xl bg-white px-3 py-2 text-xs font-black text-dossa-red shadow-sm sm:inline-flex">
                  바로 확인
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="이번 주 혜택 캘린더">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">이번 주 혜택 캘린더</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">매일 들어와서 챙길 이유를 만들었습니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              출석 포인트, 무료 샘플, 쿠폰, 장보기, 마감 혜택을 요일별 루틴으로 나눠 처음 온 사용자도 바로 따라갈 수 있습니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {weeklyBenefitPlan.map((item) => (
              <button
                key={item.day}
                type="button"
                onClick={item.onClick}
                className="min-h-[168px] rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                aria-label={`${item.day}요일 ${item.title} ${item.count}개 보기`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-dossa-red shadow-sm">
                    {item.day}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                    <CalendarDays size={13} />
                    {item.count}개
                  </span>
                </span>
                <span className="mt-4 block text-sm font-black text-slate-950">{item.title}</span>
                <span className="mt-1 line-clamp-3 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
                <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                  루틴 적용
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="5분 혜택 체크리스트">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">5분 혜택 체크리스트</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">처음 들어온 사용자가 바로 따라할 순서</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              무료 혜택은 조건이 자주 바뀌므로, 받을 수 있는 것부터 좁히고 판매처에서 최종 조건을 확인하는 흐름으로 설계했습니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {fiveMinuteChecklist.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => applyChecklistPreset(step.preset)}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                aria-label={`${step.title} 필터 적용`}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-dossa-red shadow-sm">
                  {index + 1}
                </span>
                <span className="mt-4 block text-sm font-black text-slate-950">{step.title}</span>
                <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{step.description}</span>
                <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-black text-dossa-red shadow-sm">
                  조건 적용
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="혜택별 최종 확인 기준">
          {benefitGuardrails.map(([title, copy]) => (
            <div key={title} className="rounded-3xl border border-red-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-slate-950">{title}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{copy}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveType(tab.id)}
                aria-pressed={activeType === tab.id}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black transition ${
                  activeType === tab.id ? "bg-dossa-red text-white" : "bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-dossa-red"
                }`}
              >
                {tab.label}
                <span className={activeType === tab.id ? "text-red-100" : "text-slate-400"}>{counts[tab.id] ?? 0}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm" aria-label="무료 혜택 검색과 조건 필터">
          <div className="grid gap-3 lg:grid-cols-[1fr_210px]">
            <label className="relative block">
              <span className="sr-only">무료 혜택 검색</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="무료 샘플, 쿠폰, 편의점, 포인트를 검색해보세요"
                className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-200 focus:bg-white focus:ring-4 focus:ring-red-50"
              />
            </label>
            <label>
              <span className="sr-only">무료 혜택 정렬</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as BenefitSort)}
                aria-label="무료 혜택 정렬"
                className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none focus:border-red-200 focus:ring-4 focus:ring-red-50"
              >
                <option value="recommended">추천순</option>
                <option value="endingSoon">마감임박순</option>
                <option value="popular">클릭 많은 순</option>
                <option value="savings">절약금액순</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {[
              ["ending", "마감 임박만", endingSoonOnly, () => setEndingSoonOnly((value) => !value), Timer],
              ["shipping", "배송비 무료", freeShippingOnly, () => setFreeShippingOnly((value) => !value), Truck],
              ["signup", "가입 없이 받기", noSignupOnly, () => setNoSignupOnly((value) => !value), Gift],
              ["first", "선착순 혜택", firstComeOnly, () => setFirstComeOnly((value) => !value), Sparkles],
              ["active", "진행 중만 보기", activeOnly, () => setActiveOnly((value) => !value), ExternalLink]
            ].map(([id, label, active, onClick, Icon]) => {
              const FilterIcon = Icon as typeof Gift;
              return (
                <button
                  key={String(id)}
                  type="button"
                  onClick={onClick as () => void}
                  aria-pressed={Boolean(active)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition ${
                    active ? "border-red-200 bg-red-50 text-dossa-red" : "border-slate-200 bg-white text-slate-600 hover:border-red-100 hover:text-dossa-red"
                  }`}
                >
                  <FilterIcon size={16} />
                  {String(label)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-11 shrink-0 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-500 transition hover:border-red-100 hover:text-dossa-red"
            >
              초기화
            </button>
          </div>
          <p className="mt-3 text-xs font-bold text-slate-500">
            현재 결과 {filteredDeals.length}개 · 조건은 판매처에서 최종 확인해야 하며 종료/품절 가능성이 있습니다.
          </p>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="현재 결과 혜택 판단 요약">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">현재 결과 혜택 판단 요약</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">검색 결과를 받기 쉬운 조건부터 다시 정리합니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              무료 혜택은 가입, 배송비, 선착순, 실제 링크 여부가 중요합니다. 지금 보이는 결과 기준으로 바로 좁혀보세요.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {filteredReadinessSummary.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                className="min-h-[148px] rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                aria-label={`${item.title} ${item.value} 조건 적용`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.action}</span>
                  <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white">{item.value}</span>
                </span>
                <span className="mt-4 block text-sm font-black text-slate-950">{item.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
            이 요약은 현재 필터 결과를 빠르게 고르는 도구입니다. 최종 신청 가능 여부, 배송비, 쿠폰 적용은 판매처 화면에서 다시 확인하세요.
          </p>
        </section>

        <section className="rounded-[28px] border border-red-100 bg-red-50 p-4 shadow-sm sm:p-5" aria-label="무료 혜택 빠른 판단">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">무료 혜택 빠른 판단</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">받기 전에 가장 중요한 조건만 먼저 고르세요</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-red-900/70">
              진행 여부, 회원가입 필요, 선착순, 배송비를 기준으로 바로 좁힙니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {decisionCards.map((card) => {
              const Icon = card.icon;

              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={card.onClick}
                  className="min-h-[152px] rounded-3xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  aria-label={`${card.title} ${card.count}개 조건 적용`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                      <Icon size={20} />
                    </span>
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white">{card.count}개</span>
                  </span>
                  <span className="mt-4 block text-sm font-black text-slate-950">{card.title}</span>
                  <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{card.copy}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-amber-100 bg-white p-4 shadow-sm sm:p-5" aria-label="혜택 헛걸음 방지 점검">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">혜택 헛걸음 방지 점검</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">현재 결과에서 놓치기 쉬운 조건을 먼저 봅니다</h2>
            </div>
            <p className="max-w-md text-sm font-bold leading-6 text-slate-500">
              무료·쿠폰 혜택은 배송비, 회원가입, 선착순, 신고 상태 때문에 체감 가치가 달라질 수 있습니다.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {filteredRiskReview.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                className="min-h-[156px] rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50"
                aria-label={`${item.title} ${item.value} 점검`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
                    <AlertTriangle size={18} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-amber-700 shadow-sm">{item.value}</span>
                </span>
                <span className="mt-4 block text-sm font-black text-slate-950">{item.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
                <span className="mt-3 inline-flex rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">{item.action}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
            이 점검은 혜택을 숨기지 않고 먼저 주의할 조건을 알려주는 안내입니다. 비회원도 전체 혜택을 열람할 수 있고, 최종 조건은 판매처 화면에서 확인하세요.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {[
            ["선착순 여부", "마감 시간이 가까운 혜택을 위로 정렬합니다."],
            ["회원가입 필요 여부", "각 판매처 조건은 이동 후 최종 확인하세요."],
            ["신고 가능", "품절, 종료, 링크 오류는 카드에서 바로 신고할 수 있습니다."]
          ].map(([title, copy]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <Sparkles size={20} className="text-dossa-red" />
              <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{copy}</p>
            </div>
          ))}
        </section>

        {filteredDeals.length ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className={deal.isExpired ? "opacity-55 grayscale-[0.25]" : ""}>
                <div className="mb-2 rounded-3xl border border-red-100 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-dossa-red">혜택 조건 요약</p>
                      <p className="mt-1 line-clamp-2 text-sm font-black text-slate-950">{deal.benefitSummary}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">{deal.claimCta}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-black text-slate-600">
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">선착순: {deal.isFirstComeFirstServed ? "가능성 있음" : "표시 없음"}</span>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">회원가입: {deal.requiresSignup ? "필요 가능" : "불필요"}</span>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">배송비: {deal.shippingFee}</span>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">중복: {deal.isStackable ? "가능성 있음" : "확인 필요"}</span>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">최소금액: {getMinimumOrderLabel(deal)}</span>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">만료: {deal.isEndingSoon ? "마감 임박" : "진행 중"}</span>
                    {deal.couponCondition ? <span className="col-span-2 rounded-2xl bg-red-50 px-3 py-2 text-dossa-red">조건: {deal.couponCondition}</span> : null}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto_auto]">
                    <button
                      type="button"
                      onClick={() => openDeal(deal)}
                      className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dossa-red px-3 text-sm font-black text-white transition hover:bg-dossa-deep sm:col-span-1"
                      aria-label={`${deal.title} ${deal.claimCta}`}
                    >
                      {deal.claimCta}
                      <ExternalLink size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(deal.id)}
                      aria-pressed={favorites.includes(deal.id)}
                      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-3 text-xs font-black transition ${
                        favorites.includes(deal.id) ? "bg-red-50 text-dossa-red ring-1 ring-red-100" : "border border-slate-200 bg-white text-slate-600 hover:border-red-100 hover:text-dossa-red"
                      }`}
                      aria-label={`${deal.title} 혜택 찜 ${favorites.includes(deal.id) ? "해제" : "추가"}`}
                    >
                      <Heart size={15} fill={favorites.includes(deal.id) ? "currentColor" : "none"} />
                      찜
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleClaimed(deal)}
                      aria-pressed={claimedBenefitIds.has(deal.id)}
                      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-3 text-xs font-black transition ${
                        claimedBenefitIds.has(deal.id) ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-red-100 hover:text-dossa-red"
                      }`}
                      aria-label={`${deal.title} 챙긴 혜택 기록 ${claimedBenefitIds.has(deal.id) ? "해제" : "추가"}`}
                    >
                      <CheckCircle2 size={15} />
                      챙김
                    </button>
                    <button
                      type="button"
                      onClick={() => shareDeal(deal)}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-red-100 hover:text-dossa-red"
                      aria-label={`${deal.title} 혜택 공유`}
                    >
                      <Share2 size={15} />
                    </button>
                    <Link
                      href={`/reports?dealId=${deal.id}&reason=expired`}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-red-100 hover:text-dossa-red"
                      aria-label={`${deal.title} 종료 신고`}
                    >
                      종료
                    </Link>
                    <Link
                      href={`/reports?dealId=${deal.id}&reason=link_error`}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-red-100 hover:text-dossa-red"
                      aria-label={`${deal.title} 링크 오류 신고`}
                    >
                      <AlertTriangle size={15} />
                    </Link>
                  </div>
                </div>
                <DealCard
                  deal={deal}
                  isFavorite={favorites.includes(deal.id)}
                  onToggleFavorite={toggleFavorite}
                  onOpenDeal={openDeal}
                  onShareDeal={shareDeal}
                />
              </div>
            ))}
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Gift className="mx-auto text-dossa-red" size={42} />
            <h2 className="mt-4 text-xl font-black text-slate-950">{activeType === "all" ? "표시할 혜택이 없습니다." : `${getBenefitTypeLabel(activeType)} 혜택이 없습니다.`}</h2>
            <p className="mt-2 text-sm font-bold text-slate-500">다른 혜택 유형을 선택하거나 홈에서 전체 특가를 확인해보세요.</p>
          </section>
        )}

        {message ? (
          <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl">
            <Share2 className="mr-2 inline" size={16} />
            {message}
          </div>
        ) : null}
      </div>
    </main>
  );
}
