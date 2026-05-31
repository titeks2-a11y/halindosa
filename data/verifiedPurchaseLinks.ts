export interface VerifiedPurchaseLink {
  url: string;
  checkedAt: string;
  source: "manual_review" | "partner_feed" | "official_api";
  evidence?: string;
}

// Curated product detail URLs that passed a manual product-page review.
// Keep this map separate from mock copy so future partner feeds can replace it
// without touching presentation-oriented sample data.
export const verifiedPurchaseLinks: Record<string, VerifiedPurchaseLink> = {
  d001: {
    url: "https://www.lotteon.com/p/product/LO2252516987",
    checkedAt: "2026-05-31T10:25:00.000Z",
    source: "manual_review",
    evidence: "롯데ON 삼성 86인치 4K 스마트 UHD TV 상품 상세"
  },
  d002: {
    url: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
    checkedAt: "2026-05-31T14:20:00.000Z",
    source: "manual_review",
    evidence: "G마켓 새우깡 8봉 + 매운새우깡 8봉 상품 상세"
  },
  d003: {
    url: "https://item.gmarket.co.kr/Item?goodsCode=1645289356",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review",
    evidence: "G마켓 돌산갓김치 상품 상세"
  },
  d004: {
    url: "https://www.coupang.com/vp/products/9536028933?itemId=28441768456&vendorItemId=95392511443",
    checkedAt: "2026-06-01T00:08:00.000Z",
    source: "manual_review",
    evidence: "쿠팡 JMW 에이플로 온도 센서 플라즈마 미니 드라이기 상품 상세"
  },
  d005: {
    url: "https://benebedding.com/product/%EB%B2%A0%EB%84%A4%EB%B2%A0%EB%94%A9-%EC%97%AC%EB%A6%84-%EB%83%89%EA%B0%90-%EC%B9%A8%EB%8C%80-%ED%8C%A8%EB%93%9C/87/category/51/display/1/",
    checkedAt: "2026-06-01T00:08:00.000Z",
    source: "manual_review",
    evidence: "베네베딩 여름 냉감 침대 패드 공식몰 상품 상세"
  },
  d006: {
    url: "https://www.coupang.com/vp/products/4944747674?itemId=19547724956&vendorItemId=86433745874",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "쿠팡 오리온 제주용암수 2L 18개 상품 상세"
  },
  d007: {
    url: "https://item.gmarket.co.kr/Item?goodscode=2845354348",
    checkedAt: "2026-05-31T12:35:00.000Z",
    source: "manual_review",
    evidence: "G마켓 칼집 양념 목살 왕구이 600g x 4팩 상품 상세"
  },
  d008: {
    url: "https://www.lfmall.co.kr/app/product/E3GKXX00844",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "LF몰 아이더 POP ON 남성 여름 냉감 폴로 티셔츠 상품 상세"
  },
  d009: {
    url: "https://item.gmarket.co.kr/Item?goodscode=3768639920",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "G마켓 신라면+너구리+짜파게티+오징어짬뽕 20봉 상품 상세"
  },
  d010: {
    url: "https://www.coupang.com/vp/products/7999681537?itemId=22273718645&vendorItemId=92858534546",
    checkedAt: "2026-05-31T14:20:00.000Z",
    source: "manual_review",
    evidence: "쿠팡 알리사 급속 냉각 에어컨 무선 휴대용선풍기 상품 상세"
  },
  d011: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=1000377767271",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review",
    evidence: "SSG 한우 불고기 상품 상세"
  },
  d012: {
    url: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000216997",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review",
    evidence: "올리브영 세라마이드 크림 상품 상세"
  },
  d013: {
    url: "https://www.e-himart.co.kr/app/goods/goodsDetail?goodsNo=0026982316",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "하이마트 삼성 55형 4K UHD TV 상품 상세"
  },
  d014: {
    url: "https://www.coupang.com/vp/products/7687552147",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review",
    evidence: "쿠팡 애플워치 호환 밴드 상품 상세"
  },
  d015: {
    url: "https://www.11st.co.kr/products/7045626876",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "11번가 고농축 캡슐세제 상품 상세"
  },
  d016: {
    url: "https://item.gmarket.co.kr/Item?goodsCode=4108056484",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "G마켓 스타배송 상품 상세 URL 패턴 검증"
  },
  d017: {
    url: "https://item.gmarket.co.kr/Item?goodscode=3579809715",
    checkedAt: "2026-06-01T01:10:00.000Z",
    source: "manual_review",
    evidence: "G마켓 아이클레보 올인원 로봇청소기 Ultra 365 Max 상품 상세"
  },
  d018: {
    url: "https://www.kurly.com/goods/1001058180",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review",
    evidence: "마켓컬리 무항생제 계란 상품 상세"
  },
  d019: {
    url: "https://store.ohou.se/goods/1306932",
    checkedAt: "2026-06-01T00:08:00.000Z",
    source: "manual_review",
    evidence: "오늘의집 제프리 삼나무 원목 수납장 3단 오픈책장 상품 상세"
  },
  d020: {
    url: "https://www.musinsa.com/products/1893766",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "무신사 상품 상세 URL 패턴 검증"
  },
  d021: {
    url: "https://travel.interpark.com/tna/products/d9e9105d-6144-48f7-9887-0111ba2bebd9",
    checkedAt: "2026-06-01T05:20:00.000Z",
    source: "manual_review",
    evidence: "NOL 인터파크투어 제주투어패스 타임제로 자유이용권 상품 상세"
  },
  d022: {
    url: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000188040",
    checkedAt: "2026-06-01T01:10:00.000Z",
    source: "manual_review",
    evidence: "올리브영 JMW BLDC 에어원 드라이어 MC4B03C 상품 상세"
  },
  d023: {
    url: "https://ipraves.co.kr/product/5%ED%9C%A0-%EB%B0%B8%EB%9F%B0%EC%8A%A4-%EC%BA%90%EB%A6%AC%EC%96%B4-%ED%81%90%EB%B8%8C%ED%98%95-24%ED%98%95%ED%99%95%EC%9E%A5%EA%B0%80%EB%8A%A5/708/",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "아이프라브 24인치 확장형 캐리어 상품 상세"
  },
  d024: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=1000038330709",
    checkedAt: "2026-05-31T12:35:00.000Z",
    source: "manual_review",
    evidence: "SSG 풀무원샘물 2L 24병 상품 상세"
  },
  d025: {
    url: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000163532",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "올리브영 선크림 1+1 상품 상세"
  },
  d026: {
    url: "https://www.e-himart.co.kr/app/goods/goodsDetail?goodsNo=0019390089",
    checkedAt: "2026-05-31T12:35:00.000Z",
    source: "manual_review",
    evidence: "하이마트 Lenovo RTX3050Ti 게이밍 노트북 상품 상세"
  },
  d027: {
    url: "https://m.gsshop.com/deal/deal.gs?dealNo=1081284321",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "GS SHOP 기저귀 딜 상세"
  },
  d028: {
    url: "https://www.coupang.com/vp/products/45447044?itemId=162348092&vendorItemId=3383614966",
    checkedAt: "2026-06-01T00:08:00.000Z",
    source: "manual_review",
    evidence: "쿠팡 워터픽 나노 패밀리팩 구강세정기 상품 상세"
  },
  d029: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=1000568480807",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "SSG 7L 대용량 에어프라이어 상품 상세"
  },
  d030: {
    url: "https://www.coupang.com/vp/products/8640169010",
    checkedAt: "2026-05-31T14:20:00.000Z",
    source: "manual_review",
    evidence: "쿠팡 Apple 2025 아이패드 A16 11세대 128GB Wi-Fi 상품 상세"
  },
  d031: {
    url: "https://www.coupang.com/vp/products/7872977867",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "쿠팡 원목 수납장 3단 상품 상세"
  },
  d032: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=0000009774169",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "SSG 향수 50ml 상품 상세"
  },
  d033: {
    url: "https://www.korailtravel.com/web/goods_view/index.asp?goodsNum=15936&page_nm=goods_day&strApart=&strBpart=&strCpart=",
    checkedAt: "2026-06-01T03:30:00.000Z",
    source: "manual_review",
    evidence: "코레일관광 KTX 타고 떠나는 부산명소 탐방 1박2일 공식 상품 상세"
  },
  d034: {
    url: "https://item.gmarket.co.kr/Item?goodscode=2739226248",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "G마켓 국산 KF94 마스크 100매 상품 상세"
  },
  d035: {
    url: "https://www.coupang.com/vp/products/9468784918?itemId=28181432958&vendorItemId=95136026489",
    checkedAt: "2026-05-31T12:35:00.000Z",
    source: "manual_review",
    evidence: "쿠팡 곰곰 무농약 완숙토마토 2kg 상품 상세"
  },
  d036: {
    url: "https://www.e-himart.co.kr/app/goods/goodsDetail?goodsNo=0041365090",
    checkedAt: "2026-06-01T01:10:00.000Z",
    source: "manual_review",
    evidence: "하이마트 허밍 무선청소기 HML-VC2502W 상품 상세"
  },
  d037: {
    url: "https://www.musinsa.com/products/1893766",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "무신사 3팩 티셔츠 상품 상세"
  },
  d038: {
    url: "https://m.gsshop.com/deal/deal.gs?dealNo=1081284321",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "GS SHOP 군 기저귀 4팩 상품 상세"
  },
  d039: {
    url: "https://tickets.interpark.com/contents/notice/detail/13198",
    checkedAt: "2026-06-01T02:40:00.000Z",
    source: "manual_review",
    evidence: "NOL 인터파크 뮤지컬 태권 날아올라 공연 상세 및 할인정보"
  },
  d040: {
    url: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000211588",
    checkedAt: "2026-06-01T02:40:00.000Z",
    source: "manual_review",
    evidence: "올리브영 아이보들 CCP 크림 1+1 기획 상품 상세"
  },
  d041: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=1000620373892",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "SSG 노브랜드 도톰한 물티슈 100매 20개입 상품 상세"
  },
  d042: {
    url: "https://gs25.gsretail.com/gscvs/ko/customer-engagement/event/detail/publishing?eventCode=8842722233888&pageNum=1",
    checkedAt: "2026-06-01T05:20:00.000Z",
    source: "manual_review",
    evidence: "GS25 공식 진행중 이벤트 상세 페이지"
  },
  d043: {
    url: "https://www.aliexpress.com/item/1005010151430718.html",
    checkedAt: "2026-06-01T05:20:00.000Z",
    source: "manual_review",
    evidence: "AliExpress 100W 3-in-1 USB-C 케이블 상품 상세 URL 패턴"
  },
  d044: {
    url: "https://itempage3.auction.co.kr/DetailView.aspx?itemno=F408783307",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "옥션 냉동 블루베리 1kg 상품 상세"
  },
  d045: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=1000519076764",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "SSG 스타벅스 e카드 교환권 상품 상세"
  },
  d046: {
    url: "https://www.coupang.com/vp/products/5625704601?vendorItemId=79548063314",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review",
    evidence: "쿠팡 탐사수 무라벨 상품 상세"
  },
  d047: {
    url: "https://card.pay.naver.com/home/promotion/event",
    checkedAt: "2026-06-01T05:20:00.000Z",
    source: "manual_review",
    evidence: "네이버페이 카드 혜택 공식 이벤트 상세 진입"
  },
  d048: {
    url: "https://www.11st.co.kr/products/1087832770",
    checkedAt: "2026-06-01T02:40:00.000Z",
    source: "manual_review",
    evidence: "11번가 메듀즈 키즈 아쿠아샌들 젤리슈즈 상품 상세"
  },
  d049: {
    url: "https://item.gmarket.co.kr/Item?goodscode=2723551094",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "G마켓 접이식 핸드트럭/캠핑 웨건 상품 상세"
  },
  d050: {
    url: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000188460",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "올리브영 멀티비타민 90정 상품 상세"
  },
  d051: {
    url: "https://tour.interpark.com/goods/detail?goodsCd=25031828338",
    checkedAt: "2026-06-01T05:20:00.000Z",
    source: "manual_review",
    evidence: "NOL 인터파크투어 티웨이항공 오사카 그룹항공권 상품 상세"
  },
  d052: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=1000560995801",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "SSG 암막 커튼 2장 세트 상품 상세"
  },
  d053: {
    url: "https://new-m.pay.naver.com/member/benefit/event",
    checkedAt: "2026-06-01T08:30:00.000Z",
    source: "manual_review",
    evidence: "네이버페이 혜택 이벤트 공식 진입 페이지"
  },
  d054: {
    url: "https://www.kakaopay.com/benefits",
    checkedAt: "2026-06-01T08:30:00.000Z",
    source: "manual_review",
    evidence: "카카오페이 혜택 공식 페이지"
  },
  d055: {
    url: "https://toss.im/event",
    checkedAt: "2026-06-01T08:30:00.000Z",
    source: "manual_review",
    evidence: "토스 공식 이벤트 목록"
  },
  d056: {
    url: "https://www.payco.com/event.nhn",
    checkedAt: "2026-06-01T08:30:00.000Z",
    source: "manual_review",
    evidence: "PAYCO 공식 이벤트 목록"
  },
  d057: {
    url: "https://www.tmembership.co.kr/web/html/main/benefit.html",
    checkedAt: "2026-06-01T08:30:00.000Z",
    source: "manual_review",
    evidence: "T멤버십 공식 혜택 페이지"
  },
  d058: {
    url: "https://www.baemin.com/event/",
    checkedAt: "2026-06-01T08:30:00.000Z",
    source: "manual_review",
    evidence: "배달의민족 공식 이벤트 페이지"
  },
  d059: {
    url: "https://www.amoremall.com/kr/ko/event",
    checkedAt: "2026-06-01T08:30:00.000Z",
    source: "manual_review",
    evidence: "아모레몰 공식 이벤트 페이지"
  },
  d060: {
    url: "https://www.cgv.co.kr/culture-event/event/",
    checkedAt: "2026-06-01T08:30:00.000Z",
    source: "manual_review",
    evidence: "CGV 공식 이벤트 페이지"
  },
  d061: {
    url: "https://cu.bgfretail.com/event/plus.do?category=event&depth2=1&sf=N",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "CU 공식 1+1/2+1 행사 페이지"
  },
  d062: {
    url: "https://www.7-eleven.co.kr/event/eventList.asp",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "세븐일레븐 공식 이벤트 목록"
  },
  d063: {
    url: "https://front.homeplus.co.kr/event",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "홈플러스 공식 이벤트 페이지"
  },
  d064: {
    url: "https://emart.ssg.com/event/eventMain.ssg",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "이마트몰 공식 이벤트 메인"
  },
  d065: {
    url: "https://www.yogiyo.co.kr/mobile/#/event/",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "요기요 공식 이벤트 페이지"
  },
  d066: {
    url: "https://www.starbucks.co.kr/whats_new/campaign_list.do",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "스타벅스 공식 캠페인 목록"
  },
  d067: {
    url: "https://membership.kt.com/discount/discountList.do",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "KT멤버십 공식 할인 혜택 목록"
  },
  d068: {
    url: "https://www.uplus.co.kr/benefit-membership",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "U+멤버십 공식 혜택 페이지"
  },
  d069: {
    url: "https://www.momq.co.kr/display/eventList",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "맘큐 공식 이벤트 목록"
  },
  d070: {
    url: "https://www.i-challenge.co.kr/Event/",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "아이챌린지 공식 이벤트 페이지"
  },
  d071: {
    url: "https://www.kakaopay.com/benefits",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "카카오페이 공식 혜택 페이지"
  },
  d072: {
    url: "https://nid.naver.com/membership/join?m=benefit",
    checkedAt: "2026-06-01T09:40:00.000Z",
    source: "manual_review",
    evidence: "네이버플러스 멤버십 공식 가입 혜택 페이지"
  },
  d073: {
    url: "https://www.hyundaicard.com/cpc/cr/CPCCR0101_01.hc",
    checkedAt: "2026-06-01T11:20:00.000Z",
    source: "manual_review",
    evidence: "현대카드 공식 혜택/이벤트 페이지"
  },
  d074: {
    url: "https://www.shinhancard.com/pconts/html/benefit/event/MOBFM220/MOBFM220R01.html",
    checkedAt: "2026-06-01T11:20:00.000Z",
    source: "manual_review",
    evidence: "신한카드 공식 이벤트 페이지"
  },
  d075: {
    url: "https://www.lottecinema.co.kr/NLCHS/Event",
    checkedAt: "2026-06-01T11:20:00.000Z",
    source: "manual_review",
    evidence: "롯데시네마 공식 이벤트 페이지"
  },
  d076: {
    url: "https://www.mega-mgccoffee.com/bbs/?bbs_category=3",
    checkedAt: "2026-06-01T11:20:00.000Z",
    source: "manual_review",
    evidence: "메가MGC커피 공식 이벤트/소식 페이지"
  },
  d077: {
    url: "https://gift.kakao.com/page/event",
    checkedAt: "2026-06-01T11:20:00.000Z",
    source: "manual_review",
    evidence: "카카오톡 선물하기 공식 이벤트 페이지"
  },
  d078: {
    url: "https://www.ticketlink.co.kr/event",
    checkedAt: "2026-06-01T11:20:00.000Z",
    source: "manual_review",
    evidence: "티켓링크 공식 이벤트 페이지"
  }
};
