import { Deal } from "@/types/deal";
import { buildBenefitSummary, inferDealBenefitType } from "@/lib/deals/benefits";
import { buildBenefitClaimGuide } from "@/lib/deals/claimGuide";
import { deriveProductImageUrlFromPurchaseUrl } from "@/lib/deals/imageResolver";
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
  if (/홈플러스|homeplus/.test(normalizedMall)) return `https://front.homeplus.co.kr/search?entry=direct&keyword=${query}`;
  if (/요기요|yogiyo/.test(normalizedMall)) return `https://www.yogiyo.co.kr/mobile/#/search/${query}`;
  if (/스타벅스|starbucks/.test(normalizedMall)) return `https://www.starbucks.co.kr/search/search.do?search=${query}`;
  if (/kt멤버십|kt membership/.test(normalizedMall)) return `https://membership.kt.com/discount/discountList.do`;
  if (/유플러스|uplus/.test(normalizedMall)) return `https://www.uplus.co.kr/benefit-membership`;
  if (/맘큐|momq/.test(normalizedMall)) return `https://www.momq.co.kr/search?keyword=${query}`;
  if (/아이챌린지/.test(normalizedMall)) return `https://www.i-challenge.co.kr/Event/`;
  if (/현대카드|hyundaicard/.test(normalizedMall)) return `https://www.hyundaicard.com/cpc/cr/CPCCR0101_01.hc`;
  if (/신한카드|shinhancard/.test(normalizedMall)) return `https://www.shinhancard.com/pconts/html/benefit/event/MOBFM220/MOBFM220R01.html`;
  if (/롯데시네마|lottecinema/.test(normalizedMall)) return `https://www.lottecinema.co.kr/NLCHS/Event`;
  if (/메가|mega/.test(normalizedMall)) return `https://www.mega-mgccoffee.com/bbs/?bbs_category=3`;
  if (/카카오톡|선물하기/.test(normalizedMall)) return `https://gift.kakao.com/page/event`;
  if (/티켓링크|ticketlink/.test(normalizedMall)) return `https://www.ticketlink.co.kr/event`;

  return `https://search.shopping.naver.com/search/all?query=${query}`;
}

function getHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isCommunitySource(value: string) {
  const host = getHost(value);

  return [
    "ppomppu.co.kr",
    "fmkorea.com",
    "quasarzone.com",
    "algumon.com",
    "clien.net",
    "ruliweb.com"
  ].some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function isUsableSourceUrl(value: string) {
  const host = getHost(value);

  return Boolean(value && host && !host.includes("example.com"));
}

const categoryFallbackImages: Record<Deal["category"], string> = {
  "식품": "/deal-images/category-food.svg",
  "전자기기": "/deal-images/category-digital.svg",
  "생활용품": "/deal-images/category-living.svg",
  "의류": "/deal-images/category-fashion.svg",
  "육아": "/deal-images/category-baby.svg",
  "여행/티켓": "/deal-images/category-travel.svg",
  "뷰티": "/deal-images/category-beauty.svg",
  "가전": "/deal-images/category-appliance.svg",
  "편의점/마트": "/deal-images/category-coupon.svg",
  "쿠폰/이벤트": "/deal-images/category-coupon.svg",
  "기타": "/deal-images/category-etc.svg"
};

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
  link = ""
): Deal {
  const salePrice = Math.round((originalPrice * (100 - discountRate)) / 100 / 10) * 10;
  const shippingInfo = tags.some((tag) => /무료배송|무배|네멤무료/.test(tag)) ? "무료배송" : "판매처 조건부 배송";
  const description = `${mall}에서 확인된 ${title} 특가입니다. 할인율, 배송 조건, 쿠폰 적용 여부를 함께 비교해 볼 만한 상품입니다.`;
  const notice = "가격, 재고, 쿠폰, 배송 조건은 판매처 사정에 따라 달라질 수 있습니다. 구매 전 판매처 상세 페이지에서 최종 조건을 확인하세요.";
  const expiresAt = new Date(now + expiresInHours * hour).toISOString();
  const createdAt = new Date(now - offsetHours * hour).toISOString();
  const fallbackUrl = buildMarketplaceSearchUrl(mall, title);
  const rawSourceUrl = isUsableSourceUrl(link) ? link : fallbackUrl;
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
  const dealType = inferDealBenefitType({ title, category, tags, shipping: shippingInfo, salePrice, originalPrice, discountRate });
  const isExpired = new Date(expiresAt).getTime() <= now;
  const reliabilityScore = Math.min(100, Math.round(validation.purchaseConfidence + (verifiedOverride ? 8 : 0) + (popularityScore >= 85 ? 3 : 0)));
  const text = [title, category, ...tags].join(" ");
  const isFirstComeFirstServed = /선착순|한정수량|오늘만|마감임박/.test(text);
  const requiresSignup = /첫 구매|신규 가입|체험단|포인트|앱테크|무료체험/.test(text);
  const shippingFee = shippingInfo === "무료배송" ? "무료배송" : dealType === "freebie" || dealType === "experience" ? "배송비 확인" : "판매처 조건부";
  const couponCondition = dealType === "coupon" || dealType === "foodDelivery" || dealType === "point" ? "판매처 쿠폰/결제 조건 확인" : undefined;
  const minimumOrderAmount = dealType === "coupon" || dealType === "foodDelivery" ? Math.max(0, Math.round(salePrice / 1000) * 1000) : undefined;
  const claimCta = dealType === "freebie" || dealType === "experience" || dealType === "point" ? "혜택 받기" : dealType === "coupon" || dealType === "foodDelivery" ? "쿠폰 받기" : "판매처 확인";
  const claimGuide = buildBenefitClaimGuide({
    title,
    dealType,
    requiresSignup,
    isFirstComeFirstServed,
    isFreeShipping: shippingInfo === "무료배송",
    isEndingSoon: flags.isEndingSoon,
    shippingFee,
    couponCondition,
    minimumOrderAmount,
    isStackable: /중복|카드할인|쿠폰적용/.test(text)
  });
  const derivedProductImageUrl = deriveProductImageUrlFromPurchaseUrl(validation.finalPurchaseUrl);
  const displayImageUrl = imageUrl || derivedProductImageUrl || categoryFallbackImages[category] || categoryFallbackImages["기타"];

  return {
    id,
    title,
    description,
    brand: mall,
    price: salePrice,
    originalPrice,
    salePrice,
    discountRate,
    mallName: mall,
    subCategory: tags[0],
    category,
    thumbnail: displayImageUrl,
    link: purchaseUrl,
    url: purchaseUrl,
    productUrl: validation.linkVerified ? validation.finalPurchaseUrl : "",
    verifiedProductUrl: validation.linkVerified ? validation.finalPurchaseUrl : "",
    searchUrl: validation.linkVerified ? fallbackUrl : validation.finalPurchaseUrl,
    originalUrl: link,
    purchaseUrl,
    finalUrl: validation.finalUrl,
    finalPurchaseUrl: validation.finalPurchaseUrl,
    sourceName: isCommunitySource(rawSourceUrl) ? "할인도사 원문 확인" : mall,
    sourceUrl: rawSourceUrl,
    linkType: validation.linkType,
    linkStatus: validation.linkStatus,
    linkLabel: validation.linkVerified ? "구매 페이지 검증 완료" : "링크 확인 필요",
    linkVerified: validation.linkVerified,
    checkedAt: validation.checkedAt,
    purchaseConfidence: validation.purchaseConfidence,
    purchaseStatus: validation.linkStatus === "verified" ? "available" : validation.linkStatus,
    purchaseLinkVerified: validation.purchaseLinkVerified,
    verifiedAt: validation.linkVerified ? checkedAt : undefined,
    lastVerifiedAt: validation.linkVerified ? checkedAt : undefined,
    priceCheckedAt: checkedAt,
    dealType,
    benefitSummary: buildBenefitSummary({ title, category, tags, shipping: shippingInfo, salePrice, originalPrice, discountRate }, dealType),
    reliabilityScore,
    isVerified: validation.linkVerified,
    isExpired,
    savingsAmount: originalPrice - salePrice,
    savingsRate: discountRate,
    isFirstComeFirstServed,
    requiresSignup,
    shippingFee,
    couponCondition,
    minimumOrderAmount,
    isStackable: /중복|카드할인|쿠폰적용/.test(text),
    claimCta,
    eligibilityChecklist: claimGuide.eligibilityChecklist,
    claimSteps: claimGuide.claimSteps,
    claimWarning: claimGuide.claimWarning,
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
    viewCount: Math.round(popularityScore * 21),
    reportCount: validation.linkVerified ? 0 : 1,
    isSoldOut: false,
    updatedAt: checkedAt,
    mall,
    imageUrl: displayImageUrl,
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
  deal("d021", "인터파크투어", "[제주] 제주투어패스 타임제로 자유이용권", "여행/티켓", 28000, 36, 3, 13, { isHot: false, isNew: true, isEndingSoon: false }, ["오늘만", "쿠폰적용", "입장권"], 83),
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
  deal("d039", "인터파크", "뮤지컬 태권 날아올라 R석 타임세일", "여행/티켓", 66000, 40, 3, 11, { isHot: true, isNew: true, isEndingSoon: true }, ["오늘만", "마감임박", "티켓"], 88),
  deal("d040", "올리브영", "아이보들 CCP 크림 1+1 기획", "뷰티", 30000, 19, 1, 22, { isHot: false, isNew: true, isEndingSoon: false }, ["쿠폰적용", "인기", "오늘만"], 80)
  ,
  deal("d041", "이마트몰", "노브랜드 물티슈 100매 20팩", "편의점/마트", 29900, 31, 1.5, 16, { isHot: true, isNew: true, isEndingSoon: false }, ["마트딜", "생활필수", "무료배송"], 84),
  deal("d042", "GS25", "편의점 도시락 1+1 모바일 쿠폰", "쿠폰/이벤트", 9000, 50, 0.4, 5, { isHot: true, isNew: true, isEndingSoon: true }, ["0원딜", "쿠폰", "마감임박"], 93),
  deal("d043", "알리익스프레스", "USB-C 100W 멀티 충전 케이블 3팩", "전자기기", 15900, 62, 3, 36, { isHot: true, isNew: false, isEndingSoon: false }, ["해외직구", "무료배송", "인기"], 82),
  deal("d044", "옥션", "국내산 냉동 블루베리 1kg", "식품", 18900, 42, 2, 13, { isHot: false, isNew: true, isEndingSoon: true }, ["쿠폰적용", "무료배송", "간편식"], 79),
  deal("d045", "SSG닷컴", "스타벅스 아메리카노 모바일 교환권", "쿠폰/이벤트", 4500, 100, 0.2, 6, { isHot: true, isNew: true, isEndingSoon: true }, ["0원딜", "쿠폰", "오늘만"], 96),
  deal("d046", "쿠팡", "탐사수 무라벨 2L 24병", "편의점/마트", 16800, 29, 1, 20, { isHot: false, isNew: true, isEndingSoon: false }, ["무료배송", "생활필수", "로켓배송"], 81, "", "https://www.coupang.com/vp/products/5625704601?vendorItemId=79548063314"),
  deal("d047", "네이버쇼핑", "주유권 5만원권 카드 청구할인", "쿠폰/이벤트", 50000, 12, 3, 30, { isHot: false, isNew: false, isEndingSoon: false }, ["카드할인", "쿠폰", "생활비절약"], 74),
  deal("d048", "11번가", "메듀즈 키즈 아쿠아샌들 젤리슈즈", "육아", 49900, 56, 5, 9, { isHot: true, isNew: false, isEndingSoon: true }, ["마감임박", "무료배송", "키즈"], 86),
  deal("d049", "G마켓", "캠핑 접이식 웨건 대형", "생활용품", 129000, 47, 6, 26, { isHot: false, isNew: true, isEndingSoon: false }, ["레저", "쿠폰적용", "무료배송"], 77),
  deal("d050", "올리브영", "멀티비타민 90정 기획세트", "뷰티", 39000, 35, 2, 18, { isHot: false, isNew: true, isEndingSoon: false }, ["헬스", "오늘만", "인기"], 78),
  deal("d051", "인터파크투어", "오사카 왕복 항공권 타임세일", "여행/티켓", 289000, 41, 1, 12, { isHot: true, isNew: true, isEndingSoon: true }, ["여행", "마감임박", "한정수량"], 90),
  deal("d052", "SSG닷컴", "암막 커튼 2장 세트 와인 132x160cm", "생활용품", 79000, 58, 4, 42, { isHot: true, isNew: false, isEndingSoon: false }, ["역대가", "무료배송", "홈스타일링"], 83),
  deal("d053", "네이버페이", "네이버페이 첫 결제 3천 포인트 적립 이벤트", "쿠폰/이벤트", 3000, 100, 0.3, 30, { isHot: true, isNew: true, isEndingSoon: false }, ["포인트", "첫 구매", "앱테크", "페이"], 91, "", "https://new-m.pay.naver.com/member/benefit/event"),
  deal("d054", "카카오페이", "카카오페이 편의점 결제 2천원 쿠폰", "쿠폰/이벤트", 2000, 100, 0.6, 18, { isHot: true, isNew: true, isEndingSoon: true }, ["쿠폰", "편의점", "페이", "마감임박"], 90, "", "https://www.kakaopay.com/benefits"),
  deal("d055", "토스", "토스 출석체크 매일 포인트 적립", "쿠폰/이벤트", 1000, 100, 1, 72, { isHot: true, isNew: false, isEndingSoon: false }, ["출석체크", "포인트", "앱테크", "오늘만"], 88, "", "https://toss.im/event"),
  deal("d056", "PAYCO", "PAYCO 브랜드 공식몰 5천원 할인 쿠폰팩", "쿠폰/이벤트", 5000, 100, 2, 48, { isHot: false, isNew: true, isEndingSoon: false }, ["브랜드 공식몰", "쿠폰", "중복", "페이"], 82, "", "https://www.payco.com/event.nhn"),
  deal("d057", "T멤버십", "T멤버십 커피 무료 사이즈업 쿠폰", "쿠폰/이벤트", 1500, 100, 0.5, 8, { isHot: true, isNew: true, isEndingSoon: true }, ["통신사", "멤버십", "커피", "무료 쿠폰"], 89, "", "https://www.tmembership.co.kr/web/html/main/benefit.html"),
  deal("d058", "배달의민족", "배달앱 첫 주문 5천원 할인 쿠폰", "쿠폰/이벤트", 5000, 100, 0.4, 12, { isHot: true, isNew: true, isEndingSoon: true }, ["배달", "외식", "첫 구매", "쿠폰"], 92, "", "https://www.baemin.com/event/"),
  deal("d059", "아모레몰", "아모레몰 기초케어 무료 샘플 체험단", "뷰티", 9900, 100, 3, 36, { isHot: false, isNew: true, isEndingSoon: false }, ["무료 샘플", "체험단", "배송비 확인", "뷰티"], 78, "", "https://www.amoremall.com/kr/ko/event"),
  deal("d060", "CGV", "CGV 영화 시사회 무료 초대권 응모", "여행/티켓", 14000, 100, 2, 20, { isHot: true, isNew: true, isEndingSoon: false }, ["무료 초대권", "영화", "이벤트", "선착순"], 85, "", "https://www.cgv.co.kr/culture-event/event/"),
  deal("d061", "CU", "CU 커피·음료 1+1 모바일 쿠폰 행사", "편의점/마트", 2400, 50, 0.4, 9, { isHot: true, isNew: true, isEndingSoon: true }, ["편의점", "1+1", "쿠폰", "오늘만"], 92, "", "https://cu.bgfretail.com/event/plus.do?category=event&depth2=1&sf=N"),
  deal("d062", "세븐일레븐", "세븐일레븐 도시락 2+1 멤버십 행사", "편의점/마트", 5900, 67, 0.6, 14, { isHot: true, isNew: true, isEndingSoon: false }, ["편의점", "2+1", "모바일쿠폰", "생활비절약"], 88, "", "https://www.7-eleven.co.kr/event/eventList.asp"),
  deal("d063", "홈플러스", "홈플러스 첫 장보기 무료배송 쿠폰팩", "편의점/마트", 4000, 100, 1, 30, { isHot: true, isNew: true, isEndingSoon: false }, ["무료배송", "첫 구매", "쿠폰", "마트"], 87, "", "https://front.homeplus.co.kr/event"),
  deal("d064", "이마트몰", "이마트몰 쓱배송 장보기 무료배송 이벤트", "편의점/마트", 3000, 100, 1.5, 24, { isHot: true, isNew: true, isEndingSoon: false }, ["무료배송", "마트", "장보기", "쿠폰"], 86, "", "https://emart.ssg.com/event/eventMain.ssg"),
  deal("d065", "요기요", "요기요 첫 주문 7천원 할인 쿠폰", "쿠폰/이벤트", 7000, 100, 0.7, 10, { isHot: true, isNew: true, isEndingSoon: true }, ["배달", "외식", "첫 구매", "쿠폰"], 93, "", "https://www.yogiyo.co.kr/mobile/#/event/"),
  deal("d066", "스타벅스", "스타벅스 앱 이벤트 음료 쿠폰 확인", "쿠폰/이벤트", 4500, 100, 2, 40, { isHot: false, isNew: true, isEndingSoon: false }, ["커피", "무료 쿠폰", "이벤트", "앱가입"], 82, "", "https://www.starbucks.co.kr/whats_new/campaign_list.do"),
  deal("d067", "KT멤버십", "KT멤버십 영화·외식 할인 쿠폰 모음", "쿠폰/이벤트", 8000, 100, 3, 72, { isHot: false, isNew: true, isEndingSoon: false }, ["통신사", "멤버십", "영화", "외식"], 80, "", "https://membership.kt.com/discount/discountList.do"),
  deal("d068", "유플러스멤버십", "U+멤버십 편의점·카페 할인 혜택", "쿠폰/이벤트", 5000, 100, 3, 60, { isHot: false, isNew: true, isEndingSoon: false }, ["통신사", "멤버십", "편의점", "카페"], 79, "", "https://www.uplus.co.kr/benefit-membership"),
  deal("d069", "맘큐", "맘큐 육아용품 샘플팩·체험 이벤트", "육아", 9900, 100, 4, 48, { isHot: true, isNew: true, isEndingSoon: false }, ["육아", "무료 샘플", "체험단", "배송비 확인"], 84, "", "https://www.momq.co.kr/display/eventList"),
  deal("d070", "아이챌린지", "아이챌린지 유아 학습지 무료 체험 키트", "육아", 12000, 100, 4, 96, { isHot: false, isNew: true, isEndingSoon: false }, ["육아", "무료체험", "체험단", "선착순"], 81, "", "https://www.i-challenge.co.kr/Event/"),
  deal("d071", "카카오페이", "카카오페이 결제 리워드 스탬프 이벤트", "쿠폰/이벤트", 3000, 100, 0.5, 16, { isHot: true, isNew: true, isEndingSoon: true }, ["페이", "포인트", "리워드", "앱테크"], 91, "", "https://www.kakaopay.com/benefits"),
  deal("d072", "네이버플러스", "네이버플러스 멤버십 무료 체험 혜택", "쿠폰/이벤트", 4900, 100, 1.2, 36, { isHot: true, isNew: true, isEndingSoon: false }, ["무료체험", "멤버십", "포인트", "첫 구매"], 89, "", "https://nid.naver.com/membership/join?m=benefit"),
  deal("d073", "현대카드", "현대카드 M포인트 외식·쇼핑 할인 혜택", "쿠폰/이벤트", 10000, 100, 0.8, 26, { isHot: true, isNew: true, isEndingSoon: false }, ["카드사 할인", "포인트", "외식", "쇼핑몰 쿠폰"], 86, "", "https://www.hyundaicard.com/cpc/cr/CPCCR0101_01.hc"),
  deal("d074", "신한카드", "신한카드 생활비 캐시백 이벤트 모음", "쿠폰/이벤트", 8000, 100, 1.1, 40, { isHot: false, isNew: true, isEndingSoon: false }, ["카드사 할인", "캐시백", "생활비절약", "쿠폰"], 83, "", "https://www.shinhancard.com/pconts/html/benefit/event/MOBFM220/MOBFM220R01.html"),
  deal("d075", "롯데시네마", "롯데시네마 시사회·영화 할인 이벤트", "여행/티켓", 15000, 100, 0.9, 22, { isHot: true, isNew: true, isEndingSoon: false }, ["무료 초대권", "영화", "시사회", "이벤트"], 84, "", "https://www.lottecinema.co.kr/NLCHS/Event"),
  deal("d076", "메가MGC커피", "메가MGC커피 앱 쿠폰·음료 이벤트", "쿠폰/이벤트", 2500, 100, 0.4, 12, { isHot: true, isNew: true, isEndingSoon: true }, ["커피", "음료", "무료 쿠폰", "앱가입"], 88, "", "https://www.mega-mgccoffee.com/bbs/?bbs_category=3"),
  deal("d077", "카카오톡 선물하기", "카카오톡 선물하기 첫 구매 쿠폰 이벤트", "쿠폰/이벤트", 5000, 100, 0.5, 18, { isHot: true, isNew: true, isEndingSoon: true }, ["첫 구매", "친구 초대", "쿠폰", "선물하기"], 90, "", "https://gift.kakao.com/page/event"),
  deal("d078", "티켓링크", "티켓링크 전시·공연 할인 이벤트", "여행/티켓", 20000, 100, 1.4, 42, { isHot: false, isNew: true, isEndingSoon: false }, ["전시", "공연", "무료 초대권", "티켓"], 82, "", "https://www.ticketlink.co.kr/event"),
  deal("d079", "쿠팡", "탐사 고평량 종이컵 디자인 380ml 100개입", "생활용품", 9400, 31, 0.7, 30, { isHot: true, isNew: true, isEndingSoon: false }, ["로켓배송", "생활필수", "무료배송"], 87, "", "https://www.coupang.com/vp/products/8943433269"),
  deal("d080", "G마켓", "CJ 햇반 즉석밥 210g 24개", "식품", 30900, 14, 1.8, 28, { isHot: true, isNew: true, isEndingSoon: false }, ["간편식", "쿠폰적용", "무료배송"], 84, "", "https://item.gmarket.co.kr/Item?goodscode=920731222"),
  deal("d081", "11번가", "베이직 무향 엠보싱 물티슈 캡형 100매 20팩", "생활용품", 18900, 25, 2.2, 24, { isHot: false, isNew: true, isEndingSoon: false }, ["생활필수", "무배", "인기"], 80, "", "https://www.11st.co.kr/products/2463145821"),
  deal("d082", "마켓컬리", "My Basic 매일 좋은 1A 우유 900mL", "식품", 2550, 10, 0.9, 8, { isHot: false, isNew: true, isEndingSoon: true }, ["신선식품", "샛별배송", "오늘만"], 76, "", "https://www.kurly.com/goods/5070677"),
  deal("d083", "SSG닷컴", "다우니 대용량 섬유유연제 2.8L / 8.5L 모음", "생활용품", 35900, 5, 3.5, 50, { isHot: false, isNew: true, isEndingSoon: false }, ["세제", "생활필수", "쿠폰적용"], 75, "", "https://www.ssg.com/item/dealItemView.ssg?itemId=1000035319272"),
  deal("d084", "하이마트", "LG 오브제 칸 스탠드에어컨 FQ18EK1HA1M", "가전", 499000, 28, 4.2, 72, { isHot: true, isNew: false, isEndingSoon: false }, ["가전", "설치상품", "카드할인"], 82, "", "https://www.e-himart.co.kr/app/goods/goodsDetail?goodsNo=0023645183"),
  deal("d085", "11번가", "하기스 매직컴포트 팬티형 기저귀 5단계 42매", "육아", 29900, 18, 1.3, 32, { isHot: false, isNew: true, isEndingSoon: false }, ["육아", "기저귀", "쿠폰적용"], 78, "", "https://www.11st.co.kr/products/2635032094"),
  deal("d086", "무신사", "빈폴 멘 Essential 피케 칼라넥 반소매 티셔츠", "의류", 89000, 20, 2.7, 36, { isHot: false, isNew: true, isEndingSoon: false }, ["패션", "무료배송", "브랜드"], 79, "", "https://www.musinsa.com/products/6092416"),
  deal("d087", "G마켓", "맥심 모카골드 리필커피 오리지날 500g", "식품", 21900, 15, 2.4, 26, { isHot: false, isNew: true, isEndingSoon: false }, ["커피", "쿠폰적용", "생활필수"], 77, "", "https://item.gmarket.co.kr/Item?goodscode=1503733317"),
  deal("d088", "쿠팡", "샤오미 미밴드 9 스마트밴드", "전자기기", 59900, 20, 1.6, 44, { isHot: true, isNew: true, isEndingSoon: false }, ["디지털", "무료배송", "인기"], 85, "", "https://www.coupang.com/vp/products/8263119298"),
  deal("d089", "G마켓", "홈매트 리퀴드 홈솔루션 훈증기 + 리필 2입 3개", "생활용품", 21000, 18, 5, 30, { isHot: false, isNew: true, isEndingSoon: false }, ["생활필수", "여름용품", "쿠폰적용"], 76, "", "https://item.gmarket.co.kr/Item?goodscode=2439050806"),
  deal("d090", "하이마트", "HDMI 케이블 10종 HIMCAB-H1.8 1.8m", "전자기기", 9900, 25, 3.2, 60, { isHot: false, isNew: true, isEndingSoon: false }, ["디지털", "소모품", "오늘만"], 72, "", "https://www.e-himart.co.kr/app/goods/goodsDetail?goodsNo=0000066953"),
  deal("d091", "쿠팡", "탐사수 1L 12개입 생수", "식품", 9960, 29, 0.5, 18, { isHot: true, isNew: true, isEndingSoon: false }, ["로켓배송", "생활필수", "무료배송"], 86, "", "https://www.coupang.com/vp/products/27613130"),
  deal("d092", "G마켓", "CJ비비고 왕교자 1.05kg X 2 + 새우왕교자 315g X 2", "식품", 30000, 12, 1.1, 26, { isHot: true, isNew: true, isEndingSoon: false }, ["간편식", "쿠폰적용", "인기"], 83, "", "https://item.gmarket.co.kr/Item?goodscode=4208551428"),
  deal("d093", "SSG닷컴", "오뚜기 진라면 매운맛 120g x 40봉", "식품", 30000, 18, 1.4, 30, { isHot: false, isNew: true, isEndingSoon: false }, ["라면", "장보기", "카드할인"], 78, "", "https://www.ssg.com/item/itemView.ssg?itemId=1000005089075"),
  deal("d094", "올리브영", "라운드랩 1025 독도 토너 300ml 더블 기획", "뷰티", 41000, 31, 0.8, 22, { isHot: true, isNew: true, isEndingSoon: false }, ["올영픽", "오늘드림", "쿠폰적용"], 88, "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0024/A00000024677411ko.jpg?l=ko", "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000246774"),
  deal("d095", "마켓컬리", "Better me 오리지널 닭가슴살 600g", "식품", 14800, 12, 2.1, 20, { isHot: false, isNew: true, isEndingSoon: false }, ["샛별배송", "식단관리", "단백질"], 75, "", "https://www.kurly.com/goods/5006227"),
  deal("d096", "G마켓", "국산 개별 절전형 멀티탭 2구~6구 모음", "생활용품", 26000, 69, 2.6, 28, { isHot: true, isNew: true, isEndingSoon: false }, ["생활필수", "쿠폰적용", "오늘출발"], 84, "", "https://item.gmarket.co.kr/Item?goodscode=2066504211"),
  deal("d097", "G마켓", "CJ 스팸 클래식 200g x 10개", "식품", 33800, 15, 1.7, 24, { isHot: false, isNew: true, isEndingSoon: false }, ["통조림", "쿠폰적용", "장보기"], 80, "", "https://item.gmarket.co.kr/Item?goodscode=2953970256"),
  deal("d098", "G마켓", "리챔 오리지널 200g 10캔", "식품", 34400, 28, 0.9, 16, { isHot: true, isNew: true, isEndingSoon: true }, ["통조림", "중복쿠폰", "마감임박"], 87, "", "https://item.gmarket.co.kr/Item?goodscode=2809510617"),
  deal("d099", "SSG닷컴", "피코크 떡갈비 450g x 3팩", "식품", 24000, 24, 3.1, 34, { isHot: false, isNew: true, isEndingSoon: false }, ["냉동식품", "간편식", "장보기"], 77, "", "https://www.ssg.com/item/itemView.ssg?itemId=1000601459551"),
  deal("d100", "쿠팡", "트리오 항균 주방세제 3kg 2개", "생활용품", 13500, 23, 2.4, 32, { isHot: false, isNew: true, isEndingSoon: false }, ["생활필수", "주방세제", "무료배송"], 79, "", "https://www.coupang.com/vp/products/6499690442?itemId=18173261121&vendorItemId=85322534161"),
  deal("d101", "G마켓", "T 담은정 국산 포기김치 10kg", "식품", 42200, 28, 0.7, 18, { isHot: true, isNew: true, isEndingSoon: false }, ["김치", "쿠폰적용", "무료배송"], 84, "", "https://item.gmarket.co.kr/Item?goodsCode=4476089680"),
  deal("d102", "11번가", "피죤 섬유유연제 핑크로즈 3100ml 4개", "생활용품", 24000, 13, 1.4, 30, { isHot: false, isNew: true, isEndingSoon: false }, ["생활필수", "세제", "인기"], 78, "", "https://www.11st.co.kr/products/880122427"),
  deal("d103", "G마켓", "2080 퓨어 마운틴 솔트 치약 핑크 120g 12개", "생활용품", 25000, 34, 0.9, 24, { isHot: true, isNew: true, isEndingSoon: false }, ["생활필수", "쿠폰적용", "오늘출발"], 86, "", "https://item.gmarket.co.kr/Item?goodscode=1771516558"),
  deal("d104", "쿠팡", "습기타파 대용량 제습제 280g 24개", "생활용품", 22900, 20, 1.1, 26, { isHot: false, isNew: true, isEndingSoon: false }, ["장마대비", "생활필수", "무료배송"], 80, "", "https://www.coupang.com/vp/products/8874782036?itemId=25896029282&vendorItemId=92904466881"),
  deal("d105", "쿠팡", "모나미 153 볼펜 0.5mm 블랙 12자루", "기타", 4800, 25, 2.2, 40, { isHot: false, isNew: true, isEndingSoon: false }, ["문구", "로켓배송", "생활필수"], 72, "", "https://www.coupang.com/vp/products/6133165754"),
  deal("d106", "G마켓", "듀라셀 알카라인 건전지 AA 20개입", "전자기기", 22500, 21, 1.8, 28, { isHot: false, isNew: true, isEndingSoon: false }, ["건전지", "쿠폰적용", "오늘출발"], 79, "", "https://item.gmarket.co.kr/Item?goodscode=2763212387"),
  deal("d107", "G마켓", "벡셀 알카라인 건전지 AA 20개 + AAA 20개", "전자기기", 21390, 15, 2.4, 36, { isHot: false, isNew: true, isEndingSoon: false }, ["건전지", "무료배송", "생활필수"], 77, "", "https://item.gmarket.co.kr/Item?goodsCode=4261528217"),
  deal("d108", "G마켓", "행복이온 포기김치 10kg", "식품", 63900, 6, 2.8, 42, { isHot: false, isNew: true, isEndingSoon: false }, ["김치", "무료배송", "장보기"], 73, "", "https://item.gmarket.co.kr/Item?goodscode=4236933731"),
  deal("d109", "G마켓", "2080 클래식 치약 170g x 5개", "생활용품", 12600, 10, 3.1, 32, { isHot: false, isNew: true, isEndingSoon: false }, ["치약", "쿠폰적용", "생활필수"], 71, "", "https://item.gmarket.co.kr/Item?goodscode=2745012476"),
  deal("d110", "쿠팡", "모나미 153 볼펜 1.0mm Red 60개", "기타", 21000, 14, 3.6, 48, { isHot: false, isNew: true, isEndingSoon: false }, ["문구", "대용량", "로켓배송"], 70, "", "https://www.coupang.com/vp/products/9358422?itemId=19687297735&vendorItemId=90791761130"),
  deal("d111", "G마켓", "지오다노 코튼 크루넥 반팔 티셔츠 3팩", "의류", 39900, 33, 1.2, 30, { isHot: true, isNew: true, isEndingSoon: false }, ["패션", "무료배송", "오늘출발"], 82, "", "https://item.gmarket.co.kr/Item?goodscode=3560262554"),
  deal("d112", "무신사", "커버낫 쿨 코튼 그래픽 티셔츠", "의류", 49000, 31, 1.8, 28, { isHot: false, isNew: true, isEndingSoon: false }, ["패션", "브랜드", "무배"], 78, "", "https://www.musinsa.com/products/4011120"),
  deal("d113", "쿠팡", "코멧 자동 장우산 2개 세트", "기타", 15900, 28, 0.9, 26, { isHot: false, isNew: true, isEndingSoon: false }, ["우산", "로켓배송", "생활필수"], 76, "", "https://www.coupang.com/vp/products/186524064"),
  deal("d114", "G마켓", "듀라셀 코인 리튬 건전지 CR2032 10개", "기타", 9900, 24, 1.4, 32, { isHot: false, isNew: true, isEndingSoon: false }, ["건전지", "소모품", "무료배송"], 74, "", "https://item.gmarket.co.kr/Item?goodscode=2667091230"),
  deal("d115", "BHC", "BHC 앱 치킨 첫 주문 5천원 할인 쿠폰", "쿠폰/이벤트", 5000, 100, 0.5, 14, { isHot: true, isNew: true, isEndingSoon: true }, ["배달", "외식", "첫 구매", "쿠폰"], 91, "", "https://www.bhc.co.kr/event/ingList.asp"),
  deal("d116", "무신사", "무신사 신규 가입 웰컴 0원 쿠폰팩", "쿠폰/이벤트", 1000, 100, 0.6, 24, { isHot: true, isNew: true, isEndingSoon: false }, ["0원", "무료", "신규 가입", "쿠폰"], 88, "", "https://www.musinsa.com/app/campaign/index/benefit"),
  deal("d117", "메가MGC커피", "메가MGC커피 앱 가입 무료 사이즈업 쿠폰", "쿠폰/이벤트", 1000, 100, 0.4, 12, { isHot: true, isNew: true, isEndingSoon: true }, ["무료", "커피", "앱가입", "오늘만"], 87, "", "https://www.mega-mgccoffee.com/bbs/?bbs_category=3"),
  deal("d118", "G마켓", "제주 삼다수 2L 24병 생수", "식품", 25920, 18, 0.8, 26, { isHot: true, isNew: true, isEndingSoon: false }, ["생수", "생활필수", "무료배송", "장보기"], 85, "", "https://item.gmarket.co.kr/Item?goodscode=2910475736"),
  deal("d119", "11번가", "종근당건강 락토핏 생유산균 골드 50포 2통", "뷰티", 39900, 22, 1.6, 32, { isHot: false, isNew: true, isEndingSoon: false }, ["헬스", "건강", "쿠폰적용", "무료배송"], 78, "", "https://www.11st.co.kr/products/7947620012"),
  deal("d120", "G마켓", "제주 삼다수 2L 12병 한정수량 특가", "식품", 14800, 24, 0.9, 10, { isHot: true, isNew: true, isEndingSoon: true }, ["생수", "마감임박", "생활필수", "무료배송"], 88, "", "https://item.gmarket.co.kr/Item?goodsCode=4285817639"),
  deal("d121", "쿠팡", "코멧 홈 물걸레 청소포 대형 리필 30매 10개", "생활용품", 18900, 20, 0.7, 28, { isHot: false, isNew: true, isEndingSoon: false }, ["청소용품", "생활필수", "로켓배송"], 77, "", "https://www.coupang.com/vp/products/4739246363"),
  deal("d122", "G마켓", "오뚜기 맛있는 오뚜기밥 210g 24개", "식품", 28900, 12, 1.1, 30, { isHot: false, isNew: true, isEndingSoon: false }, ["즉석밥", "간편식", "쿠폰적용"], 78, "", "https://item.gmarket.co.kr/Item?goodsCode=4412121040"),
  deal("d123", "11번가", "크리넥스 3겹 클린케어 30M 30롤 3팩", "생활용품", 69900, 18, 1.6, 34, { isHot: false, isNew: true, isEndingSoon: false }, ["화장지", "생활필수", "무료배송"], 79, "", "https://www.11st.co.kr/products/3008342629"),
  deal("d124", "올리브영", "닥터지 레드 블레미쉬 클리어 수딩 크림 70ml 기획", "뷰티", 36000, 29, 0.9, 24, { isHot: true, isNew: true, isEndingSoon: false }, ["수분진정", "오늘드림", "쿠폰적용"], 84, "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0023/A00000023006301ko.jpg?l=ko", "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000230063"),
  deal("d125", "SSG닷컴", "노브랜드 김자반 60g", "편의점/마트", 2980, 10, 1.4, 42, { isHot: false, isNew: true, isEndingSoon: false }, ["노브랜드", "장보기", "쓱배송"], 72, "", "https://www.ssg.com/item/itemView.ssg?itemId=1000032939693"),
  deal("d126", "쿠팡", "코멧 깨끗한 천연펄프 키친타월 150매 16개", "생활용품", 19900, 20, 0.6, 30, { isHot: false, isNew: true, isEndingSoon: false }, ["키친타월", "생활필수", "로켓배송"], 79, "", "https://www.coupang.com/vp/products/169280610?itemId=18366710784&vendorItemId=85510322367"),
  deal("d127", "G마켓", "동원 EPA참치 150g x 10캔", "식품", 36990, 5, 1.2, 34, { isHot: false, isNew: true, isEndingSoon: false }, ["참치", "통조림", "쿠폰적용"], 73, "", "https://item.gmarket.co.kr/Item?goodscode=2349292374"),
  deal("d128", "11번가", "리스테린 쿨민트 마우스워시 750ml 2개", "생활용품", 33980, 10, 1.5, 28, { isHot: false, isNew: true, isEndingSoon: false }, ["가글", "구강청결", "생활필수"], 74, "", "https://www.11st.co.kr/products/8716931635"),
  deal("d129", "SSG닷컴", "리벤스 오리지널 소프트 저자극 물티슈 캡형 100매 10팩", "생활용품", 7900, 15, 0.9, 24, { isHot: true, isNew: true, isEndingSoon: false }, ["물티슈", "장보기", "쓱배송"], 82, "", "https://www.ssg.com/item/itemView.ssg?itemId=2097001847275"),
  deal("d130", "쿠팡", "국산 세이프크린 KF94 대형 마스크 100매", "생활용품", 21000, 24, 0.8, 22, { isHot: true, isNew: true, isEndingSoon: false }, ["마스크", "KF94", "무료배송"], 83, "", "https://www.coupang.com/vp/products/8286305822"),
  deal("d131", "쿠팡", "탐사 샘물 2L 24개", "식품", 14400, 18, 0.5, 18, { isHot: true, isNew: true, isEndingSoon: false }, ["생수", "생활필수", "로켓배송", "무료배송"], 86, "", "https://www.coupang.com/vp/products/7689270513?itemId=20877904748&vendorItemId=87945140914"),
  deal("d132", "G마켓", "팔도 비빔면 130g 20개", "식품", 23900, 8, 1.2, 20, { isHot: false, isNew: true, isEndingSoon: false }, ["라면", "비빔면", "쿠폰적용", "장보기"], 76, "", "https://item.gmarket.co.kr/Item?goodscode=2571643785"),
  deal("d133", "11번가", "크리넥스 3겹 순수소프트 쿠션 화장지 25m 30롤 2팩", "생활용품", 69900, 20, 1.4, 26, { isHot: false, isNew: true, isEndingSoon: false }, ["화장지", "휴지", "무료배송", "생활필수"], 78, "", "https://www.11st.co.kr/products/9039746479"),
  deal("d134", "SSG닷컴", "종가 알찬 포기김치 3.1kg", "식품", 27900, 15, 1.1, 24, { isHot: false, isNew: true, isEndingSoon: false }, ["김치", "장보기", "쓱배송", "신선식품"], 77, "", "https://www.ssg.com/item/itemView.ssg?itemId=1000625953830"),
  deal("d135", "G마켓", "농심 순한너구리 120g 20개", "식품", 24700, 25, 1.8, 34, { isHot: false, isNew: true, isEndingSoon: false }, ["라면", "너구리", "쿠폰적용", "무료배송"], 76, "", "https://item.gmarket.co.kr/Item?goodscode=3055540533"),
  deal("d136", "쿠팡", "코카콜라 제로콜라/스프라이트 제로 355ml 24캔", "식품", 26500, 10, 1.3, 28, { isHot: true, isNew: true, isEndingSoon: false }, ["탄산음료", "제로콜라", "무료배송", "간식"], 82, "", "https://www.coupang.com/vp/products/5594587350"),
  deal("d137", "11번가", "페브리즈 섬유탈취제 다우니 실내건조 370ml 3개", "생활용품", 22000, 18, 1.7, 32, { isHot: false, isNew: true, isEndingSoon: false }, ["탈취제", "생활필수", "세탁", "쿠폰적용"], 76, "", "https://www.11st.co.kr/products/9087281979"),
  deal("d138", "SSG닷컴", "햇반 현미쌀밥 210g 36입", "식품", 59940, 10, 2.4, 36, { isHot: false, isNew: true, isEndingSoon: false }, ["햇반", "즉석밥", "장보기", "쓱배송"], 78, "", "https://www.ssg.com/item/itemView.ssg?itemId=1000588225854"),
  deal("d139", "쿠팡", "닥터유 주머니쏙 단백질바 34g 12개", "식품", 12240, 5, 0.6, 18, { isHot: false, isNew: true, isEndingSoon: false }, ["단백질바", "간식", "무료배송", "헬스"], 75, "", "https://www.coupang.com/vp/products/7430740821?vendorItemId=70327608949"),
  deal("d140", "G마켓", "농심 새우깡 90g 20개", "식품", 28000, 4, 1.2, 24, { isHot: false, isNew: true, isEndingSoon: false }, ["새우깡", "과자", "간식", "쿠폰적용"], 74, "", "https://item.gmarket.co.kr/Item?goodscode=3534198074")
];

export const categories = ["전체", "식품", "전자기기", "생활용품", "의류", "육아", "여행/티켓", "뷰티", "가전", "편의점/마트", "쿠폰/이벤트", "기타"] as const;
