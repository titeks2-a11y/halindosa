import { HotSignal } from "@/types/hotSignal";

const now = Date.now();
const minute = 60 * 1000;

function signal(
  id: string,
  title: string,
  summary: string,
  category: HotSignal["category"],
  keywords: string[],
  score: number,
  offsetMinutes: number,
  url: string,
  imageUrl: string,
  signalType: HotSignal["signalType"] = "community"
): HotSignal {
  return {
    id,
    title,
    sourceName: "할인도사 브리핑",
    url,
    imageUrl,
    publishedAt: new Date(now - offsetMinutes * minute).toISOString(),
    summary,
    category,
    keywords,
    signalType,
    score
  };
}

export const mockHotSignals: HotSignal[] = [
  signal(
    "briefing-707648",
    "샤오미 86인치 4K 120hz 스마트TV 80만원대",
    "대형 TV 고할인 특가. 무료배송 조건 포함.",
    "전자기기",
    ["특가", "무료배송", "고할인"],
    99,
    6,
    "/?q=%EC%83%A4%EC%98%A4%EB%AF%B8%20%EC%8A%A4%EB%A7%88%ED%8A%B8TV&category=%EC%A0%84%EC%9E%90%EA%B8%B0%EA%B8%B0&verifiedOnly=true&sort=hot",
    "/deal-images/live-707648.jpg"
  ),
  signal(
    "briefing-707791",
    "새우깡 16봉 묶음 무료배송 특가",
    "간식류 대량 묶음 특가. 소액 생필품 기준 우선 확인 대상.",
    "식품",
    ["특가", "무료배송", "생필품"],
    98,
    12,
    "/?q=%EC%83%88%EC%9A%B0%EA%B9%A1&category=%EC%8B%9D%ED%92%88&verifiedOnly=true&sort=hot",
    "/deal-images/live-707791.jpg"
  ),
  signal(
    "briefing-707788",
    "JMW 미니 드라이기 네이버 멤버십 무료배송 특가",
    "생활가전/뷰티 카테고리 가격 하락 신호. 배송 조건 비교 대상.",
    "뷰티",
    ["특가", "무료배송", "가격하락"],
    96,
    24,
    "/?q=JMW%20%EB%AF%B8%EB%8B%88%20%EB%93%9C%EB%9D%BC%EC%9D%B4%EA%B8%B0&category=%EB%B7%B0%ED%8B%B0&verifiedOnly=true&sort=hot",
    "/deal-images/live-707788.jpg"
  ),
  signal(
    "briefing-707787",
    "여름 냉감 침대패드 1만원대 무료배송",
    "계절성 침구 특가. 여름 침구 교체 수요 대상.",
    "생활용품",
    ["특가", "무료배송", "계절특가"],
    95,
    30,
    "/?q=%EB%83%89%EA%B0%90%20%EC%B9%A8%EB%8C%80%ED%8C%A8%EB%93%9C&category=%EC%83%9D%ED%99%9C%EC%9A%A9%ED%92%88&verifiedOnly=true&sort=hot",
    "/deal-images/live-707787.jpg"
  ),
  signal(
    "briefing-707783",
    "라면 20봉 묶음 쿠폰 적용 특가",
    "쿠폰 적용형 식품 묶음 특가. 쿠폰 종료 전 확인 대상.",
    "식품",
    ["쿠폰", "특가", "마감"],
    94,
    54,
    "/?q=%EB%9D%BC%EB%A9%B4%20%EC%BF%A0%ED%8F%B0&category=%EC%8B%9D%ED%92%88&verifiedOnly=true&sort=hot",
    "/deal-images/live-707783.jpg"
  )
];
