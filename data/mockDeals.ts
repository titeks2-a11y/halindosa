import { Deal } from "@/types/deal";

const now = Date.now();
const hour = 60 * 60 * 1000;

function deal(
  id: string,
  mall: string,
  title: string,
  category: Deal["category"],
  originalPrice: number,
  discountRate: number,
  offsetHours: number,
  expiresInHours: number,
  flags: Pick<Deal, "isHot" | "isNew" | "isEndingSoon">,
  tags: string[],
  popularityScore: number,
  imageUrl = "",
  link = `https://example.com/deals/${id}`
): Deal {
  const salePrice = Math.round((originalPrice * (100 - discountRate)) / 100 / 10) * 10;

  return {
    id,
    mall,
    title,
    category,
    originalPrice,
    salePrice,
    discountRate,
    discountAmount: originalPrice - salePrice,
    imageUrl,
    link,
    source: "mock",
    expiresAt: new Date(now + expiresInHours * hour).toISOString(),
    createdAt: new Date(now - offsetHours * hour).toISOString(),
    ...flags,
    tags,
    popularityScore
  };
}

export const mockDeals: Deal[] = [
  deal("d001", "롯데온", "샤오미 86인치 4K 120hz 스마트TV", "전자기기", 1201350, 26, 0.1, 18, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "핫딜", "무료배송"], 99, "/deal-images/live-707648.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707648"),
  deal("d002", "지마켓", "새우깡 8봉 + 매운새우깡 8봉", "식품", 19160, 25, 0.2, 12, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "무료배송", "인기"], 95, "/deal-images/live-707791.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707791"),
  deal("d003", "g마켓", "국내산 돌산갓김치 1.5kg", "식품", 11080, 24, 0.3, 10, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "무배", "오늘만"], 92, "/deal-images/live-707790.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707790"),
  deal("d004", "네이버", "JMW 에이플로 AI 온도 센서 플라즈마 미니 드라이기", "뷰티", 86960, 31, 0.4, 9, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "네멤무료", "뷰티"], 91, "/deal-images/live-707788.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707788"),
  deal("d005", "굿웨어몰", "베네베딩 여름 냉감 쿨 침대패드", "생활용품", 22740, 30, 0.5, 8, { isHot: true, isNew: true, isEndingSoon: true }, ["실시간", "무료배송", "마감임박"], 90, "/deal-images/live-707787.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707787"),
  deal("d006", "롯데온", "닥터유 제주용암수 2L 18병", "식품", 13940, 29, 0.6, 14, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "무료배송", "생활필수"], 89, "/deal-images/live-707786.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707786"),
  deal("d007", "토스", "돼지목살 양념구이 600g X 4팩", "식품", 27500, 28, 0.7, 7, { isHot: true, isNew: true, isEndingSoon: true }, ["실시간", "무료배송", "한정수량"], 88, "/deal-images/live-707785.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707785"),
  deal("d008", "롯데온", "아이더 POP ON 폴로 티셔츠", "의류", 42190, 27, 0.8, 20, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "무배", "패션"], 87, "/deal-images/live-707784.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707784"),
  deal("d009", "지마켓", "신라면+너구리+짜파게티+오징어짬뽕 총 20봉", "식품", 19780, 26, 0.9, 11, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "쿠폰적용", "무배"], 86, "/deal-images/live-707783.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707783"),
  deal("d010", "G마켓", "알리사 급속 냉각 에어컨 무선 휴대용 선풍기", "가전", 27210, 25, 1, 6, { isHot: true, isNew: true, isEndingSoon: true }, ["실시간", "무료배송", "마감임박"], 85, "/deal-images/live-707782.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707782"),
  deal("d011", "SSG닷컴", "프리미엄 한우 불고기 600g", "식품", 53000, 34, 2, 28, { isHot: false, isNew: true, isEndingSoon: false }, ["카드할인", "무료배송"], 79),
  deal("d012", "올리브영", "세라마이드 보습 크림 기획세트", "뷰티", 48000, 37, 1, 20, { isHot: true, isNew: true, isEndingSoon: false }, ["쿠폰적용", "인기"], 92),
  deal("d013", "하이마트", "삼성 55형 4K UHD TV", "가전", 899000, 40, 11, 30, { isHot: true, isNew: false, isEndingSoon: false }, ["카드할인", "역대가"], 89),
  deal("d014", "쿠팡", "애플워치 호환 스포츠 밴드", "전자기기", 19900, 55, 2, 14, { isHot: false, isNew: true, isEndingSoon: false }, ["무료배송", "한정수량"], 76),
  deal("d015", "11번가", "대용량 캡슐세제 80개입", "생활용품", 44900, 43, 13, 7, { isHot: false, isNew: false, isEndingSoon: true }, ["마감임박", "오늘만"], 81),
  deal("d016", "G마켓", "나이키 러닝화 인기 컬러", "의류", 139000, 48, 9, 26, { isHot: true, isNew: false, isEndingSoon: false }, ["인기", "쿠폰적용"], 87),
  deal("d017", "네이버쇼핑", "로봇청소기 자동먼지비움 모델", "가전", 699000, 33, 4, 50, { isHot: false, isNew: false, isEndingSoon: false }, ["카드할인", "무료배송"], 80),
  deal("d018", "마켓컬리", "무항생제 계란 30구", "식품", 17900, 24, 1, 10, { isHot: false, isNew: true, isEndingSoon: false }, ["오늘만", "무료배송"], 72),
  deal("d019", "오늘의집", "원목 수납장 3단", "생활용품", 219000, 61, 15, 21, { isHot: true, isNew: false, isEndingSoon: false }, ["역대가", "한정수량"], 85),
  deal("d020", "무신사", "겨울 패딩 숏다운", "의류", 259000, 64, 18, 11, { isHot: true, isNew: false, isEndingSoon: true }, ["마감임박", "인기"], 95),
  deal("d021", "인터파크투어", "제주 왕복 항공권 주중 특가", "여행/티켓", 110000, 57, 3, 13, { isHot: false, isNew: true, isEndingSoon: false }, ["오늘만", "쿠폰적용"], 83),
  deal("d022", "올리브영", "속건 헤어드라이어 전문가용", "뷰티", 89000, 41, 12, 32, { isHot: false, isNew: false, isEndingSoon: false }, ["카드할인", "무료배송"], 78),
  deal("d023", "인터파크", "캐리어 24인치 확장형", "기타", 159000, 49, 6, 24, { isHot: true, isNew: false, isEndingSoon: false }, ["역대가", "무료배송"], 84),
  deal("d024", "SSG닷컴", "프리미엄 생수 2L 24병", "식품", 24900, 10, 5, 17, { isHot: false, isNew: false, isEndingSoon: false }, ["무료배송", "인기"], 69),
  deal("d025", "올리브영", "선크림 1+1 기획", "뷰티", 36000, 45, 2, 4, { isHot: true, isNew: true, isEndingSoon: true }, ["마감임박", "오늘만"], 94),
  deal("d026", "하이마트", "게이밍 노트북 RTX 특가", "전자기기", 1699000, 27, 7, 44, { isHot: true, isNew: false, isEndingSoon: false }, ["카드할인", "한정수량"], 88),
  deal("d027", "쿠팡", "분유 3단계 4캔 세트", "육아", 128000, 36, 9, 19, { isHot: false, isNew: false, isEndingSoon: false }, ["무료배송", "쿠폰적용"], 73),
  deal("d028", "네이버쇼핑", "전동칫솔 패밀리팩", "생활용품", 99000, 39, 2, 29, { isHot: false, isNew: true, isEndingSoon: false }, ["카드할인", "인기"], 75),
  deal("d029", "G마켓", "에어프라이어 7L 대용량", "가전", 149000, 53, 14, 6, { isHot: true, isNew: false, isEndingSoon: true }, ["마감임박", "역대가"], 90),
  deal("d030", "11번가", "태블릿 10인치 Wi-Fi 모델", "전자기기", 329000, 22, 1, 40, { isHot: false, isNew: true, isEndingSoon: false }, ["카드할인", "무료배송"], 71),
  deal("d031", "오늘의집", "스탠드 조명 무드등", "생활용품", 59000, 80, 21, 27, { isHot: false, isNew: false, isEndingSoon: false }, ["역대가", "쿠폰적용"], 68),
  deal("d032", "SSG닷컴", "명품 향수 50ml", "뷰티", 179000, 26, 3, 15, { isHot: false, isNew: true, isEndingSoon: false }, ["인기", "한정수량"], 76)
];

export const categories = ["전체", "식품", "전자기기", "생활용품", "의류", "육아", "여행/티켓", "뷰티", "가전", "기타"] as const;
