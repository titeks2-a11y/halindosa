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
    "대형 TV 고할인 특가. 무료배송 조건과 재고 변동 확인 필요.",
    "전자기기",
    ["특가", "무료배송", "고할인"],
    99,
    6,
    "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707648",
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
    "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707791",
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
    "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707788",
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
    "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707787",
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
    "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707783",
    "/deal-images/live-707783.jpg"
  )
];
