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
  imageUrl = ""
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
    link: `https://example.com/deals/${id}`,
    source: "mock",
    expiresAt: new Date(now + expiresInHours * hour).toISOString(),
    createdAt: new Date(now - offsetHours * hour).toISOString(),
    ...flags,
    tags,
    popularityScore
  };
}

export const mockDeals: Deal[] = [
  deal("d001", "쿠팡", "삼겹살 구이용 1kg 냉장 특가", "식품", 28900, 42, 1, 9, { isHot: true, isNew: true, isEndingSoon: false }, ["무료배송", "오늘만", "인기"], 98),
  deal("d002", "11번가", "갤럭시 버즈 FE 무선 이어폰", "전자기기", 119000, 35, 2, 16, { isHot: true, isNew: false, isEndingSoon: false }, ["카드할인", "역대가"], 93),
  deal("d003", "G마켓", "제주 왕복 항공권 주중 한정", "여행/티켓", 99000, 58, 4, 5, { isHot: true, isNew: false, isEndingSoon: true }, ["마감임박", "한정수량"], 91),
  deal("d004", "네이버쇼핑", "LG 퓨리케어 공기청정기", "가전", 499000, 31, 3, 36, { isHot: false, isNew: true, isEndingSoon: false }, ["쿠폰적용", "무료배송"], 82),
  deal("d005", "마켓컬리", "새벽배송 샐러드 도시락 6팩", "식품", 42000, 29, 1, 12, { isHot: false, isNew: true, isEndingSoon: false }, ["오늘만", "쿠폰적용"], 77),
  deal("d006", "오늘의집", "호텔식 차렵이불 세트 Q", "생활용품", 129000, 46, 7, 48, { isHot: true, isNew: false, isEndingSoon: false }, ["무료배송", "인기"], 88),
  deal("d007", "무신사", "베이직 오버핏 후드티", "의류", 69000, 52, 5, 18, { isHot: true, isNew: false, isEndingSoon: false }, ["역대가", "쿠폰적용"], 86),
  deal("d008", "티몬", "키즈 영양제 2개월 세트", "육아", 76000, 38, 10, 6, { isHot: false, isNew: false, isEndingSoon: true }, ["마감임박", "카드할인"], 70),
  deal("d009", "위메프", "물티슈 20팩 대용량 박스", "육아", 35900, 44, 8, 22, { isHot: false, isNew: false, isEndingSoon: false }, ["무료배송", "한정수량"], 74),
  deal("d010", "인터파크", "뮤지컬 R석 평일 공연권", "여행/티켓", 150000, 50, 6, 8, { isHot: true, isNew: false, isEndingSoon: true }, ["마감임박", "오늘만"], 90),
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
  deal("d021", "티몬", "워터파크 종일권 2인", "여행/티켓", 110000, 57, 3, 13, { isHot: false, isNew: true, isEndingSoon: false }, ["오늘만", "쿠폰적용"], 83),
  deal("d022", "위메프", "속건 헤어드라이어 전문가용", "뷰티", 89000, 41, 12, 32, { isHot: false, isNew: false, isEndingSoon: false }, ["카드할인", "무료배송"], 78),
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
