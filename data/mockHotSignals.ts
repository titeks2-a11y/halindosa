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
  signalType: HotSignal["signalType"] = "community"
): HotSignal {
  return {
    id,
    title,
    sourceName: "할인도사 브리핑",
    url,
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
    "샤오미 86인치 4K 120hz 스마트TV가 80만원대에 올라왔습니다.",
    "대형 TV를 찾는 사용자가 바로 확인할 만한 고가 전자제품 특가입니다. 무료배송 조건과 재고 변동을 함께 확인하세요.",
    "전자기기",
    ["특가", "무료배송", "고할인"],
    99,
    6,
    "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707648"
  ),
  signal(
    "briefing-707791",
    "새우깡 16봉 묶음 특가가 무료배송 조건으로 감지됐습니다.",
    "간식류를 쟁여두기 좋은 가격대입니다. 소액 생필품 특가는 빠르게 품절될 수 있어 우선 확인 대상으로 분류했습니다.",
    "식품",
    ["특가", "무료배송", "생필품"],
    98,
    12,
    "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707791"
  ),
  signal(
    "briefing-707788",
    "JMW 미니 드라이기 특가가 네이버 멤버십 무료배송 조건으로 확인됐습니다.",
    "생활가전/뷰티 카테고리에서 반응이 빠른 가격 신호입니다. 기존 가격과 배송 조건을 함께 비교해보세요.",
    "뷰티",
    ["특가", "무료배송", "가격하락"],
    96,
    24,
    "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707788"
  ),
  signal(
    "briefing-707787",
    "여름 냉감 침대패드가 1만원대 무료배송 특가로 올라왔습니다.",
    "계절성 생활용품은 수요가 몰리면 가격이 빠르게 바뀝니다. 침구 교체를 고려 중이면 확인할 만합니다.",
    "생활용품",
    ["특가", "무료배송", "계절특가"],
    95,
    30,
    "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707787"
  ),
  signal(
    "briefing-707783",
    "라면 20봉 묶음 쿠폰 적용 특가가 감지됐습니다.",
    "쿠폰 적용 후 가격이 낮아지는 식품 묶음 특가입니다. 쿠폰 종료 전 조건을 확인하는 것이 좋습니다.",
    "식품",
    ["쿠폰", "특가", "마감"],
    94,
    54,
    "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707783"
  )
];
