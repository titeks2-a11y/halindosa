import { Deal } from "@/types/deal";
import { validatePurchaseLink } from "@/lib/deals/linkValidator";
import { verifiedPurchaseLinks } from "./verifiedPurchaseLinks";

const now = Date.now();
const hour = 60 * 60 * 1000;

function buildMarketplaceSearchUrl(mall: string, title: string) {
  const normalizedMall = mall.toLowerCase();
  const query = encodeURIComponent(title);

  if (/쿠팡|coupang/.test(normalizedMall)) return `https://www.coupang.com/np/search?q=${query}`;
  if (/네이버|naver/.test(normalizedMall)) return `https://search.shopping.naver.com/search/all?query=${query}`;
  if (/11번가|11st/.test(normalizedMall)) return `https://search.11st.co.kr/Search.tmall?kwd=${query}`;
  if (/g마켓|지마켓|gmarket/.test(normalizedMall)) return `https://browse.gmarket.co.kr/search?keyword=${query}`;
  if (/옥션|auction/.test(normalizedMall)) return `https://browse.auction.co.kr/search?keyword=${query}`;
  if (/ssg|쓱/.test(normalizedMall)) return `https://www.ssg.com/search.ssg?target=all&query=${query}`;
  if (/이마트/.test(normalizedMall)) return `https://emart.ssg.com/search.ssg?target=all&query=${query}`;
  if (/올리브영|olive/.test(normalizedMall)) return `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${query}`;
  if (/무신사|musinsa/.test(normalizedMall)) return `https://www.musinsa.com/search/goods?keyword=${query}`;
  if (/알리|ali/.test(normalizedMall)) return `https://ko.aliexpress.com/w/wholesale-${query}.html`;
  if (/하이마트|himart/.test(normalizedMall)) return `https://www.e-himart.co.kr/app/search/totalSearch?query=${query}`;
  if (/롯데온|lotte/.test(normalizedMall)) return `https://www.lotteon.com/search/search/search.ecn?render=search&platform=pc&q=${query}`;
  if (/마켓컬리|컬리|kurly/.test(normalizedMall)) return `https://www.kurly.com/search?sword=${query}`;
  if (/오늘의집/.test(normalizedMall)) return `https://ohou.se/productions/feed?query=${query}`;
  if (/인터파크/.test(normalizedMall)) return `https://shopping.interpark.com/search/all?keyword=${query}`;
  if (/gs25|cu|세븐일레븐|편의점/.test(normalizedMall)) return `https://search.shopping.naver.com/search/all?query=${query}`;

  return `https://search.shopping.naver.com/search/all?query=${query}`;
}

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
  const shippingInfo = tags.some((tag) => /무료배송|무배|네멤무료/.test(tag)) ? "무료배송" : "판매처 조건부 배송";
  const description = `${mall}에서 확인된 ${title} 특가입니다. 할인율, 배송 조건, 쿠폰 적용 여부를 함께 비교해 볼 만한 상품입니다.`;
  const notice = "가격, 재고, 쿠폰, 배송 조건은 판매처 사정에 따라 달라질 수 있습니다. 구매 전 판매처 상세 페이지에서 최종 조건을 확인하세요.";
  const expiresAt = new Date(now + expiresInHours * hour).toISOString();
  const createdAt = new Date(now - offsetHours * hour).toISOString();
  const fallbackUrl = buildMarketplaceSearchUrl(mall, title);
  const verifiedOverride = verifiedPurchaseLinks[id];
  const checkedAt = verifiedOverride?.checkedAt ?? new Date(now - Math.max(5, Math.round(offsetHours * 18)) * 60 * 1000).toISOString();
  const validation = validatePurchaseLink({
    url: verifiedOverride?.url ?? link,
    fallbackUrl,
    mallName: mall,
    title,
    checkedAt
  });
  const purchaseUrl = validation.finalPurchaseUrl;

  return {
    id,
    title,
    description,
    originalPrice,
    salePrice,
    discountRate,
    mallName: mall,
    category,
    thumbnail: imageUrl,
    link: purchaseUrl,
    url: purchaseUrl,
    productUrl: validation.linkVerified ? validation.finalPurchaseUrl : "",
    searchUrl: validation.linkVerified ? fallbackUrl : validation.finalPurchaseUrl,
    originalUrl: link,
    purchaseUrl,
    finalUrl: validation.finalUrl,
    finalPurchaseUrl: validation.finalPurchaseUrl,
    linkType: validation.linkType,
    linkStatus: validation.linkStatus,
    linkLabel: validation.linkVerified ? "구매 페이지 검증 완료" : "판매처 검색으로 확인",
    linkVerified: validation.linkVerified,
    checkedAt: validation.checkedAt,
    purchaseConfidence: validation.purchaseConfidence,
    purchaseStatus: validation.linkStatus === "verified" ? "available" : validation.linkStatus,
    purchaseLinkVerified: validation.purchaseLinkVerified,
    verifiedAt: validation.linkVerified ? checkedAt : undefined,
    priceCheckedAt: checkedAt,
    shipping: shippingInfo,
    createdAt,
    expireAt: expiresAt,
    tags,
    isFreeShipping: shippingInfo === "무료배송",
    discountAmount: originalPrice - salePrice,
    source: "mock",
    notice,
    ...flags,
    popularityScore,
    clickCount: Math.round(popularityScore * 13),
    likeCount: Math.round(popularityScore * 3.2),
    isSoldOut: false,
    updatedAt: checkedAt,
    mall,
    imageUrl,
    shippingInfo,
    expiresAt
  };
}

export const mockDeals: Deal[] = [
  deal("d001", "롯데온", "삼성 86인치 4K 스마트 UHD TV", "전자기기", 1201350, 26, 0.1, 18, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "핫딜", "무료배송"], 99, "/deal-images/live-707648.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707648"),
  deal("d002", "지마켓", "새우깡 8봉 + 매운새우깡 8봉", "식품", 19160, 25, 0.2, 12, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "무료배송", "인기"], 95, "/deal-images/live-707791.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707791"),
  deal("d003", "g마켓", "국내산 돌산갓김치 1.5kg", "식품", 11080, 24, 0.3, 10, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "무배", "오늘만"], 92, "/deal-images/live-707790.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707790"),
  deal("d004", "쿠팡", "JMW 에이플로 온도 센서 플라즈마 미니 드라이기", "뷰티", 109000, 36, 0.4, 9, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "무료배송", "뷰티"], 91, "/deal-images/live-707788.jpg", "https://www.coupang.com/vp/products/9536028933?itemId=28441768456&vendorItemId=95392511443"),
  deal("d005", "베네베딩", "베네베딩 여름 냉감 침대 패드", "생활용품", 76000, 65, 0.5, 8, { isHot: true, isNew: true, isEndingSoon: true }, ["실시간", "무료배송", "마감임박"], 90, "/deal-images/live-707787.jpg", "https://benebedding.com/product/%EB%B2%A0%EB%84%A4%EB%B2%A0%EB%94%A9-%EC%97%AC%EB%A6%84-%EB%83%89%EA%B0%90-%EC%B9%A8%EB%8C%80-%ED%8C%A8%EB%93%9C/87/category/51/display/1/"),
  deal("d006", "쿠팡", "닥터유 제주용암수 2L 18병", "식품", 13940, 29, 0.6, 14, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "무료배송", "생활필수"], 89, "/deal-images/live-707786.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707786"),
  deal("d007", "토스", "돼지목살 양념구이 600g X 4팩", "식품", 27500, 28, 0.7, 7, { isHot: true, isNew: true, isEndingSoon: true }, ["실시간", "무료배송", "한정수량"], 88, "/deal-images/live-707785.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707785"),
  deal("d008", "LF몰", "아이더 POP ON 남성 여름 냉감 폴로 티셔츠", "의류", 42190, 27, 0.8, 20, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "무배", "패션"], 87, "/deal-images/live-707784.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707784"),
  deal("d009", "지마켓", "신라면+너구리+짜파게티+오징어짬뽕 총 20봉", "식품", 19780, 26, 0.9, 11, { isHot: true, isNew: true, isEndingSoon: false }, ["실시간", "쿠폰적용", "무배"], 86, "/deal-images/live-707783.jpg", "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&page=1&divpage=112&no=707783"),
  deal("d010", "쿠팡", "알리사 급속 냉각 에어컨 무선 휴대용 선풍기", "가전", 27210, 25, 1, 6, { isHot: true, isNew: true, isEndingSoon: true }, ["실시간", "무료배송", "마감임박"], 85, "/deal-images/live-707782.jpg", "https://www.coupang.com/vp/products/7999681537?itemId=22273718645&vendorItemId=92858534546"),
  deal("d011", "SSG닷컴", "프리미엄 한우 불고기 600g", "식품", 53000, 34, 2, 28, { isHot: false, isNew: true, isEndingSoon: false }, ["카드할인", "무료배송"], 79),
  deal("d012", "올리브영", "세라마이드 보습 크림 기획세트", "뷰티", 48000, 37, 1, 20, { isHot: true, isNew: true, isEndingSoon: false }, ["쿠폰적용", "인기"], 92, "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0021/A00000021699702ko.jpg?l=ko", "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000216997"),
  deal("d013", "하이마트", "삼성 55형 4K UHD TV", "가전", 899000, 40, 11, 30, { isHot: true, isNew: false, isEndingSoon: false }, ["카드할인", "역대가"], 89),
  deal("d014", "쿠팡", "애플워치 호환 스포츠 밴드", "전자기기", 19900, 55, 2, 14, { isHot: false, isNew: true, isEndingSoon: false }, ["무료배송", "한정수량"], 76),
  deal("d015", "11번가", "대용량 캡슐세제 80개입", "생활용품", 44900, 43, 13, 7, { isHot: false, isNew: false, isEndingSoon: true }, ["마감임박", "오늘만"], 81),
  deal("d016", "G마켓", "농심 신라면 120g X 20봉", "식품", 20510, 48, 9, 26, { isHot: true, isNew: false, isEndingSoon: false }, ["인기", "쿠폰적용"], 87),
  deal("d017", "G마켓", "아이클레보 올인원 로봇청소기 Ultra 365 Max", "가전", 699000, 33, 4, 50, { isHot: false, isNew: false, isEndingSoon: false }, ["카드할인", "무료배송"], 80, "", "https://item.gmarket.co.kr/Item?goodscode=3579809715"),
  deal("d018", "마켓컬리", "무항생제 계란 30구", "식품", 17900, 24, 1, 10, { isHot: false, isNew: true, isEndingSoon: false }, ["오늘만", "무료배송"], 72),
  deal("d019", "오늘의집", "원목 수납장 3단", "생활용품", 219000, 61, 15, 21, { isHot: true, isNew: false, isEndingSoon: false }, ["역대가", "한정수량"], 85),
  deal("d020", "무신사", "아웃도어 프로덕츠 3PACK 티셔츠", "의류", 79000, 64, 18, 11, { isHot: true, isNew: false, isEndingSoon: true }, ["마감임박", "인기"], 95),
  deal("d021", "인터파크투어", "제주 왕복 항공권 주중 특가", "여행/티켓", 110000, 57, 3, 13, { isHot: false, isNew: true, isEndingSoon: false }, ["오늘만", "쿠폰적용"], 83),
  deal("d022", "올리브영", "JMW BLDC 에어원 드라이어 MC4B03C", "뷰티", 89000, 41, 12, 32, { isHot: false, isNew: false, isEndingSoon: false }, ["카드할인", "무료배송"], 78, "", "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000188040"),
  deal("d023", "아이프라브", "확장형 5휠 밸런스 큐브 캐리어 24인치", "기타", 159000, 49, 6, 24, { isHot: true, isNew: false, isEndingSoon: false }, ["역대가", "무료배송"], 84),
  deal("d024", "SSG닷컴", "프리미엄 생수 2L 24병", "식품", 24900, 10, 5, 17, { isHot: false, isNew: false, isEndingSoon: false }, ["무료배송", "인기"], 69),
  deal("d025", "올리브영", "선크림 1+1 기획", "뷰티", 36000, 45, 2, 4, { isHot: true, isNew: true, isEndingSoon: true }, ["마감임박", "오늘만"], 94),
  deal("d026", "하이마트", "게이밍 노트북 RTX 특가", "전자기기", 1699000, 27, 7, 44, { isHot: true, isNew: false, isEndingSoon: false }, ["카드할인", "한정수량"], 88),
  deal("d027", "GS SHOP", "군 기저귀 프리미엄 팬티 대형 4팩", "육아", 128000, 36, 9, 19, { isHot: false, isNew: false, isEndingSoon: false }, ["무료배송", "쿠폰적용"], 73),
  deal("d028", "쿠팡", "워터픽 나노 패밀리팩 구강세정기", "생활용품", 99000, 39, 2, 29, { isHot: false, isNew: true, isEndingSoon: false }, ["카드할인", "인기"], 75, "", "https://www.coupang.com/vp/products/45447044?itemId=162348092&vendorItemId=3383614966"),
  deal("d029", "SSG닷컴", "422 올스텐 에어프라이어 7L 대용량", "가전", 149000, 53, 14, 6, { isHot: true, isNew: false, isEndingSoon: true }, ["마감임박", "역대가"], 90),
  deal("d030", "쿠팡", "Apple 2025 아이패드 A16 11세대 128GB Wi-Fi", "전자기기", 529000, 16, 1, 40, { isHot: false, isNew: true, isEndingSoon: false }, ["카드할인", "무료배송"], 71, "", "https://www.coupang.com/vp/products/8640169010"),
  deal("d031", "쿠팡", "원목 수납장 3단 다용도 월넛 유리 거실장", "생활용품", 59000, 80, 21, 27, { isHot: false, isNew: false, isEndingSoon: false }, ["역대가", "쿠폰적용"], 68),
  deal("d032", "SSG닷컴", "명품 향수 50ml", "뷰티", 179000, 26, 3, 15, { isHot: false, isNew: true, isEndingSoon: false }, ["인기", "한정수량"], 76),
  deal("d033", "코레일관광", "부산 주말 KTX 연계 숙박 패키지", "여행/티켓", 189000, 35, 1, 72, { isHot: true, isNew: true, isEndingSoon: false }, ["여행", "쿠폰적용", "한정수량"], 82),
  deal("d034", "G마켓", "국산 황사방역용 KF94 마스크 대형 100매", "생활용품", 24900, 44, 2, 36, { isHot: false, isNew: true, isEndingSoon: false }, ["무료배송", "생활필수", "인기"], 78),
  deal("d035", "쿠팡", "로켓프레시 친환경 토마토 2kg", "식품", 19800, 30, 0.5, 8, { isHot: true, isNew: true, isEndingSoon: true }, ["무료배송", "오늘만", "신선식품"], 91),
  deal("d036", "하이마트", "허밍 무선청소기 HML-VC2502W 물걸레 세트", "가전", 329000, 46, 6, 48, { isHot: true, isNew: false, isEndingSoon: false }, ["카드할인", "무료배송", "역대가"], 86, "", "https://www.e-himart.co.kr/app/goods/goodsDetail?goodsNo=0041365090"),
  deal("d037", "무신사", "여름 기능성 반팔 티셔츠 3팩", "의류", 69000, 52, 4, 18, { isHot: false, isNew: true, isEndingSoon: true }, ["무배", "패션", "마감임박"], 83),
  deal("d038", "GS SHOP", "군 기저귀 프리미엄 팬티 대형 32P 4팩", "육아", 92000, 38, 7, 30, { isHot: false, isNew: false, isEndingSoon: false }, ["무료배송", "쿠폰적용", "육아"], 77),
  deal("d039", "인터파크", "뮤지컬 평일 공연 R석 타임세일", "여행/티켓", 140000, 50, 3, 11, { isHot: true, isNew: true, isEndingSoon: true }, ["오늘만", "마감임박", "티켓"], 88),
  deal("d040", "올리브영", "클렌징폼 1+1 대용량 기획", "뷰티", 32000, 41, 1, 22, { isHot: false, isNew: true, isEndingSoon: false }, ["쿠폰적용", "인기", "오늘만"], 80)
  ,
  deal("d041", "이마트몰", "노브랜드 물티슈 100매 20팩", "편의점/마트", 29900, 31, 1.5, 16, { isHot: true, isNew: true, isEndingSoon: false }, ["마트딜", "생활필수", "무료배송"], 84),
  deal("d042", "GS25", "편의점 도시락 1+1 모바일 쿠폰", "쿠폰/이벤트", 9000, 50, 0.4, 5, { isHot: true, isNew: true, isEndingSoon: true }, ["0원딜", "쿠폰", "마감임박"], 93),
  deal("d043", "알리익스프레스", "USB-C 100W 멀티 충전 케이블 3팩", "전자기기", 15900, 62, 3, 36, { isHot: true, isNew: false, isEndingSoon: false }, ["해외직구", "무료배송", "인기"], 82),
  deal("d044", "옥션", "국내산 냉동 블루베리 1kg", "식품", 18900, 42, 2, 13, { isHot: false, isNew: true, isEndingSoon: true }, ["쿠폰적용", "무료배송", "간편식"], 79),
  deal("d045", "SSG닷컴", "스타벅스 아메리카노 모바일 교환권", "쿠폰/이벤트", 4500, 100, 0.2, 6, { isHot: true, isNew: true, isEndingSoon: true }, ["0원딜", "쿠폰", "오늘만"], 96),
  deal("d046", "쿠팡", "탐사수 무라벨 2L 24병", "편의점/마트", 16800, 29, 1, 20, { isHot: false, isNew: true, isEndingSoon: false }, ["무료배송", "생활필수", "로켓배송"], 81, "", "https://www.coupang.com/vp/products/5625704601?vendorItemId=79548063314"),
  deal("d047", "네이버쇼핑", "주유권 5만원권 카드 청구할인", "쿠폰/이벤트", 50000, 12, 3, 30, { isHot: false, isNew: false, isEndingSoon: false }, ["카드할인", "쿠폰", "생활비절약"], 74),
  deal("d048", "11번가", "키즈 여름 샌들 2켤레 세트", "육아", 49900, 56, 5, 9, { isHot: true, isNew: false, isEndingSoon: true }, ["마감임박", "무료배송", "키즈"], 86),
  deal("d049", "G마켓", "캠핑 접이식 웨건 대형", "생활용품", 129000, 47, 6, 26, { isHot: false, isNew: true, isEndingSoon: false }, ["레저", "쿠폰적용", "무료배송"], 77),
  deal("d050", "올리브영", "멀티비타민 90정 기획세트", "뷰티", 39000, 35, 2, 18, { isHot: false, isNew: true, isEndingSoon: false }, ["헬스", "오늘만", "인기"], 78),
  deal("d051", "인터파크투어", "오사카 왕복 항공권 타임세일", "여행/티켓", 289000, 41, 1, 12, { isHot: true, isNew: true, isEndingSoon: true }, ["여행", "마감임박", "한정수량"], 90),
  deal("d052", "SSG닷컴", "암막 커튼 2장 세트 와인 132x160cm", "생활용품", 79000, 58, 4, 42, { isHot: true, isNew: false, isEndingSoon: false }, ["역대가", "무료배송", "홈스타일링"], 83)
];

export const categories = ["전체", "식품", "전자기기", "생활용품", "의류", "육아", "여행/티켓", "뷰티", "가전", "편의점/마트", "쿠폰/이벤트", "기타"] as const;
