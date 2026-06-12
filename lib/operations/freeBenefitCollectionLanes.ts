import refreshedNewsDeals from "@/data/refreshedNewsDeals.json";

type BenefitRecord = Record<string, unknown>;

export interface FreeBenefitCollectionLaneCandidate {
  id: string;
  title: string;
  brand: string;
  benefitType: string;
  endDate: string;
  officialUrl: string;
}

export interface FreeBenefitCollectionLaneReportRow {
  id: string;
  label: string;
  envKey: string;
  minimum: number;
  count: number;
  officialCount: number;
  noPurchaseCount: number;
  verifiedCount: number;
  status: "healthy" | "thin" | "empty";
  action: string;
  topBrands: Array<{ name: string; count: number }>;
  topBenefitTypes: Array<{ name: string; count: number }>;
  topCandidates: FreeBenefitCollectionLaneCandidate[];
}

export interface FreeBenefitCollectionLanesReport {
  ok: boolean;
  generatedAt: string;
  source: string;
  summary: {
    totalItems: number;
    visibleOfficialItems: number;
    consumerVisibleItems: number;
    blockedItems: number;
    duplicateGroups: number;
    healthyLanes: number;
    thinLanes: number;
    emptyLanes: number;
    officialHosts: number;
    generatedAt: string;
  };
  lanes: FreeBenefitCollectionLaneReportRow[];
  nextActions: Array<{
    id: string;
    priority: "high" | "medium";
    title: string;
    action: string;
    envKey: string;
  }>;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function textOf(item: BenefitRecord) {
  return [
    item.id,
    item.title,
    item.summary,
    item.description,
    item.merchant,
    item.mallName,
    item.brand,
    item.sourceName,
    item.category,
    item.benefitType,
    ...arrayValue(item.tags)
  ]
    .map((value) => String(value ?? ""))
    .filter(Boolean)
    .join(" ");
}

function hostOf(value: unknown) {
  try {
    return new URL(stringValue(value)).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isExpired(item: BenefitRecord, referenceNow: number) {
  const end = Date.parse(stringValue(item.expiresAt) || stringValue(item.endDate) || stringValue(item.endAt));
  return Number.isFinite(end) && end < referenceNow;
}

function isConsumerFacing(item: BenefitRecord) {
  return !/정부|공공|복지|지자체|교육|강좌|K-?MOOC|HRD|정부24|복지로|서울시|문화가 있는 날/i.test(textOf(item));
}

function isVisibleOfficialBenefit(item: BenefitRecord, referenceNow: number) {
  const finalUrl = stringValue(item.finalUrl) || stringValue(item.officialUrl) || stringValue(item.eventUrl) || stringValue(item.sourceUrl);
  return (
    item.publishable === true &&
    item.isHidden !== true &&
    item.validationStatus === "passed" &&
    item.availability === "active" &&
    stringValue(item.linkType).startsWith("official") &&
    Boolean(finalUrl) &&
    !isExpired(item, referenceNow)
  );
}

function benefitLabel(type: unknown) {
  const key = stringValue(type);
  const labels: Record<string, string> = {
    coupon: "쿠폰",
    freebie: "전원증정",
    sample: "무료 샘플",
    freeTrial: "무료체험",
    gifticon: "기프티콘",
    point: "포인트",
    pointCashback: "포인트/캐시백",
    freeShipping: "무료배송",
    signup: "신규가입",
    checkIn: "출석체크",
    roulette: "룰렛",
    discount: "할인",
    event: "이벤트",
    foodDelivery: "배달/외식",
    convenienceStore: "편의점",
    mart: "마트"
  };
  return labels[key] || key || "기타";
}

function countTop(items: BenefitRecord[], selector: (item: BenefitRecord) => string, limit = 6) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = selector(item).trim() || "기타";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function getBrand(item: BenefitRecord) {
  return stringValue(item.merchant) || stringValue(item.mallName) || stringValue(item.brand) || stringValue(item.sourceName) || "기타";
}

function finalUrlOf(item: BenefitRecord) {
  return stringValue(item.finalUrl) || stringValue(item.officialUrl) || stringValue(item.eventUrl) || stringValue(item.sourceUrl);
}

function deadlineHours(item: BenefitRecord, referenceNow: number) {
  const end = Date.parse(stringValue(item.expiresAt) || stringValue(item.endDate) || stringValue(item.endAt));
  if (!Number.isFinite(end)) return Number.POSITIVE_INFINITY;
  return (end - referenceNow) / (60 * 60 * 1000);
}

export function buildFreeBenefitCollectionLanesReport(referenceNow = Date.now()): FreeBenefitCollectionLanesReport {
  const laneDefinitions = [
    {
      id: "officialEvents",
      label: "공식 이벤트",
      envKey: "OFFICIAL_EVENT_FEED_URLS",
      minimum: 40,
      matches: (item: BenefitRecord) => /official_event|official_benefit/i.test([item.linkType, item.source, item.provider].map(String).join(" "))
    },
    {
      id: "couponsMembership",
      label: "쿠폰·멤버십",
      envKey: "PUBLIC_COUPON_FEED_URLS",
      minimum: 25,
      matches: (item: BenefitRecord) => /쿠폰|멤버십|회원|웰컴|신규|가입|롯데잇츠|해피포인트|CJ\s*ONE|H\.?Point|L\.?POINT/i.test(textOf(item))
    },
    {
      id: "convenienceMart",
      label: "편의점·마트",
      envKey: "CONVENIENCE_BENEFIT_FEED_URLS",
      minimum: 8,
      matches: (item: BenefitRecord) => /GS25|CU|세븐일레븐|이마트24|편의점|마트|홈플러스|이마트|롯데마트|SSG|몰리스|다이소/i.test(textOf(item))
    },
    {
      id: "samplesTrials",
      label: "샘플·무료체험",
      envKey: "BEAUTY_SAMPLE_FEED_URLS",
      minimum: 6,
      matches: (item: BenefitRecord) => /샘플|체험|무료체험|체험팩|키트|아모레|올리브영|닥터지|라운드랩|로얄캐닌|반려동물/i.test(textOf(item))
    },
    {
      id: "pointsCashback",
      label: "포인트·캐시백",
      envKey: "PAY_POINT_BENEFIT_FEED_URLS",
      minimum: 12,
      matches: (item: BenefitRecord) => /포인트|캐시백|페이|pay|토스|카카오페이|네이버페이|PAYCO|OK캐쉬백|신세계포인트|L\.?POINT/i.test(textOf(item))
    },
    {
      id: "deliveryFood",
      label: "배달·외식",
      envKey: "DELIVERY_FOOD_COUPON_FEED_URLS",
      minimum: 10,
      matches: (item: BenefitRecord) => /배민|요기요|쿠팡이츠|롯데잇츠|스타벅스|투썸|이디야|메가|할리스|배스킨|던킨|카페|외식|커피/i.test(textOf(item))
    },
    {
      id: "shippingZero",
      label: "무료배송",
      envKey: "FREE_SHIPPING_FEED_URLS",
      minimum: 4,
      matches: (item: BenefitRecord) => /무료배송|무배|배송비\s*0|배송비\s*무료/i.test(textOf(item))
    },
    {
      id: "deadline",
      label: "오늘·이번주 마감",
      envKey: "DEADLINE_EVENT_FEED_URLS",
      minimum: 1,
      matches: (item: BenefitRecord) => deadlineHours(item, referenceNow) >= 0 && deadlineHours(item, referenceNow) <= 7 * 24
    }
  ];

  const snapshot = refreshedNewsDeals as { allDeals?: BenefitRecord[]; deals?: BenefitRecord[] };
  const allDeals = Array.isArray(snapshot.allDeals) ? snapshot.allDeals : Array.isArray(snapshot.deals) ? snapshot.deals : [];
  const visibleOfficial = allDeals.filter((item) => isVisibleOfficialBenefit(item, referenceNow));
  const consumerVisible = visibleOfficial.filter(isConsumerFacing);
  const blocked = allDeals.filter((item) => !isVisibleOfficialBenefit(item, referenceNow));
  const duplicateKeys = new Map<string, number>();

  for (const item of consumerVisible) {
    const key = [
      stringValue(item.title).toLowerCase().replace(/\s+/g, " ").trim(),
      getBrand(item).toLowerCase(),
      hostOf(finalUrlOf(item)),
      stringValue(item.expiresAt) || stringValue(item.endDate)
    ].join("|");
    duplicateKeys.set(key, (duplicateKeys.get(key) || 0) + 1);
  }

  const lanes = laneDefinitions.map((lane): FreeBenefitCollectionLaneReportRow => {
    const items = consumerVisible.filter(lane.matches);
    const status = items.length >= lane.minimum ? "healthy" : items.length > 0 ? "thin" : "empty";
    return {
      id: lane.id,
      label: lane.label,
      envKey: lane.envKey,
      minimum: lane.minimum,
      count: items.length,
      officialCount: items.filter((item) => stringValue(item.linkType).startsWith("official")).length,
      noPurchaseCount: items.filter((item) => item.requiresPurchase !== true && !/구매|주문|결제|이상 구매/.test(textOf(item))).length,
      verifiedCount: items.filter((item) => item.validationStatus === "passed").length,
      status,
      action:
        status === "healthy"
          ? "현재 홈·카테고리 노출에 충분합니다."
          : status === "thin"
            ? `${lane.envKey}에 공식 이벤트/쿠폰 URL을 추가해 수집폭을 보강하세요.`
            : `${lane.envKey}가 비었습니다. 공식 이벤트 feed 또는 seed 후보를 우선 연결하세요.`,
      topBrands: countTop(items, getBrand),
      topBenefitTypes: countTop(items, (item) => benefitLabel(item.benefitType)),
      topCandidates: items
        .slice()
        .sort((a, b) => numberValue(b.qualityScore) + numberValue(b.priorityScore) - (numberValue(a.qualityScore) + numberValue(a.priorityScore)))
        .slice(0, 5)
        .map((item) => ({
          id: stringValue(item.id),
          title: stringValue(item.title),
          brand: getBrand(item),
          benefitType: benefitLabel(item.benefitType),
          endDate: stringValue(item.expiresAt) || stringValue(item.endDate),
          officialUrl: finalUrlOf(item)
        }))
    };
  });

  const summary = {
    totalItems: allDeals.length,
    visibleOfficialItems: visibleOfficial.length,
    consumerVisibleItems: consumerVisible.length,
    blockedItems: blocked.length,
    duplicateGroups: Array.from(duplicateKeys.values()).filter((count) => count > 1).length,
    healthyLanes: lanes.filter((lane) => lane.status === "healthy").length,
    thinLanes: lanes.filter((lane) => lane.status === "thin").length,
    emptyLanes: lanes.filter((lane) => lane.status === "empty").length,
    officialHosts: new Set(consumerVisible.map((item) => hostOf(finalUrlOf(item))).filter(Boolean)).size,
    generatedAt: new Date(referenceNow).toISOString()
  };

  const ok = summary.consumerVisibleItems >= 120 && summary.healthyLanes >= 6 && summary.emptyLanes === 0 && summary.duplicateGroups === 0;
  return {
    ok,
    generatedAt: new Date(referenceNow).toISOString(),
    source: "data/refreshedNewsDeals.json",
    summary,
    lanes,
    nextActions: lanes
      .filter((lane) => lane.status !== "healthy")
      .map((lane) => ({
        id: lane.id,
        priority: lane.status === "empty" ? "high" : "medium",
        title: `${lane.label} 수집축 보강`,
        action: lane.action,
        envKey: lane.envKey
      }))
  };
}

export function buildFreeBenefitCollectionLanesCsv(report: FreeBenefitCollectionLanesReport) {
  const lines = [
    "\uFEFFsection,id,label,status,count,minimum,officialCount,noPurchaseCount,verifiedCount,envKey,action",
    `summary,total,전체,${report.ok ? "passed" : "needs_review"},${report.summary.consumerVisibleItems},120,${report.summary.visibleOfficialItems},,,${report.source},${report.generatedAt}`,
    ...report.lanes.map((lane) =>
      [
        "lane",
        lane.id,
        lane.label,
        lane.status,
        lane.count,
        lane.minimum,
        lane.officialCount,
        lane.noPurchaseCount,
        lane.verifiedCount,
        lane.envKey,
        lane.action
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
  ];

  return `${lines.join("\n")}\n`;
}
