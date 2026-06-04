import type { BenefitPreset } from "@/components/BenefitPlaybook";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import type { Deal, DealBenefitType } from "@/types/deal";

export const mallFilters = [
  { id: "all", label: "전체 쇼핑몰" },
  { id: "쿠팡", label: "쿠팡" },
  { id: "naver", label: "네이버" },
  { id: "gmarket", label: "G마켓" },
  { id: "11번가", label: "11번가" },
  { id: "ssg", label: "SSG/이마트" },
  { id: "auction", label: "옥션" },
  { id: "aliexpress", label: "알리익스프레스" },
  { id: "롯데온", label: "롯데온" },
  { id: "interpark", label: "인터파크" },
  { id: "올리브영", label: "올리브영" },
  { id: "무신사", label: "무신사" },
  { id: "하이마트", label: "하이마트" }
];

export const priceBands = [
  { id: "all", label: "전체 가격대", min: 0, max: Number.POSITIVE_INFINITY },
  { id: "under10000", label: "1만원 미만", min: 0, max: 9999 },
  { id: "10000-30000", label: "1만~3만원", min: 10000, max: 30000 },
  { id: "30000-100000", label: "3만~10만원", min: 30000, max: 100000 },
  { id: "over100000", label: "10만원 이상", min: 100000, max: Number.POSITIVE_INFINITY }
] as const;

export type PriceBand = (typeof priceBands)[number]["id"];

export const benefitFilters: Array<{ id: "all" | DealBenefitType; label: string }> = [
  { id: "all", label: "전체 혜택" },
  { id: "freebie", label: "무료혜택" },
  { id: "coupon", label: "쿠폰/이벤트" },
  { id: "freeShipping", label: "무료배송" },
  { id: "experience", label: "체험/샘플" },
  { id: "point", label: "포인트" },
  { id: "convenienceStore", label: "편의점" },
  { id: "mart", label: "마트" },
  { id: "foodDelivery", label: "배달/외식" },
  { id: "discount", label: "오늘특가" }
];

export const searchPurposePresets: Array<{
  title: string;
  label: string;
  copy: string;
  preset: BenefitPreset;
  match: (deal: Deal) => boolean;
}> = [
  {
    title: "무료·0원 먼저",
    label: "무료",
    copy: "샘플, 체험단, 초대권처럼 비용 부담 낮은 혜택",
    preset: { dealType: "freebie", query: "무료", sort: "hot" },
    match: (deal) => ["freebie", "experience"].includes(deal.dealType) || deal.salePrice <= 1000 || /무료|0원|샘플|체험|초대권/.test(`${deal.title} ${deal.tags.join(" ")}`)
  },
  {
    title: "쿠폰 조건 확인",
    label: "쿠폰",
    copy: "첫 구매, 카드, 브랜드, 배달 쿠폰을 결제 전 확인",
    preset: { dealType: "coupon", query: "쿠폰", sort: "hot" },
    match: (deal) => ["coupon", "foodDelivery"].includes(deal.dealType) || /쿠폰|카드|첫 구매|배달|외식/.test(`${deal.title} ${deal.tags.join(" ")}`)
  },
  {
    title: "앱테크 적립",
    label: "적립",
    copy: "출석체크, 페이, 멤버십 포인트 루틴",
    preset: { dealType: "point", query: "포인트", sort: "latest" },
    match: (deal) => deal.dealType === "point" || /출석|포인트|적립|페이|멤버십|리워드/.test(`${deal.title} ${deal.tags.join(" ")}`)
  },
  {
    title: "문화 초대권",
    label: "문화",
    copy: "영화 시사회, 전시, 공연, 티켓 혜택",
    preset: { dealType: "experience", query: "초대권", sort: "endingSoon" },
    match: (deal) => /영화|시사회|전시|공연|초대권|티켓/.test(`${deal.title} ${deal.tags.join(" ")} ${deal.benefitSummary}`)
  },
  {
    title: "검증 링크만",
    label: "신뢰",
    copy: "검색/메인이 아닌 실제 상세 이동 우선",
    preset: { verifiedOnly: true, sort: "hot" },
    match: (deal) => isVerifiedPurchaseLink(deal)
  }
];

export const toastMessages = [
  "🔥 새로운 역대급 특가가 등록되었습니다!",
  "⚡ 마감임박 상품이 빠르게 소진되고 있어요.",
  "🎯 관심 카테고리에 할인율 높은 상품이 올라왔어요!",
  "💳 카드할인 적용 가능한 핫딜을 찾았습니다.",
  "🛒 오늘만 진행되는 쿠폰 특가를 확인해보세요."
];

export const recentSearchStorageKey = "halindosa:recent-search-keywords";

export const highIntentSearchKeywords = [
  "생수",
  "물티슈",
  "계란",
  "우유",
  "닭가슴살",
  "마스크",
  "충전케이블",
  "멀티탭",
  "화장지",
  "청소포",
  "김자반",
  "김치",
  "키친타월",
  "참치",
  "가글",
  "콜라",
  "탈취제",
  "단백질바",
  "새우깡",
  "로켓",
  "지마켓",
  "배달쿠폰",
  "커피쿠폰",
  "라면",
  "햇반",
  "세제",
  "기저귀",
  "선크림",
  "유산균",
  "치킨쿠폰",
  "무료커피",
  "영화무료",
  "패션",
  "우산",
  "아이폰",
  "갤럭시",
  "에어팟",
  "노트북",
  "모니터",
  "보조배터리",
  "피자",
  "분유",
  "바디워시",
  "청소기",
  "선풍기",
  "에어컨",
  "캠핑",
  "호텔",
  "체험단",
  "반값",
  "카드할인",
  "올리브영",
  "컬리",
  "첫구매"
];

export const fallbackInterestCategories = ["무료/체험", "쿠폰/이벤트", "생활용품"];
export const quickInterestOptions = ["무료/체험", "쿠폰/이벤트", "식품", "생활용품", "디지털", "육아", "뷰티", "여행"];
