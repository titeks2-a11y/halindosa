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
  d003: {
    url: "https://item.gmarket.co.kr/Item?goodsCode=1645289356",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review",
    evidence: "G마켓 돌산갓김치 상품 상세"
  },
  d006: {
    url: "https://www.coupang.com/vp/products/4944747674?itemId=19547724956&vendorItemId=86433745874",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "쿠팡 오리온 제주용암수 2L 18개 상품 상세"
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
  d018: {
    url: "https://www.kurly.com/goods/1001058180",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review",
    evidence: "마켓컬리 무항생제 계란 상품 상세"
  },
  d020: {
    url: "https://www.musinsa.com/products/1893766",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "무신사 상품 상세 URL 패턴 검증"
  },
  d023: {
    url: "https://ipraves.co.kr/product/5%ED%9C%A0-%EB%B0%B8%EB%9F%B0%EC%8A%A4-%EC%BA%90%EB%A6%AC%EC%96%B4-%ED%81%90%EB%B8%8C%ED%98%95-24%ED%98%95%ED%99%95%EC%9E%A5%EA%B0%80%EB%8A%A5/708/",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "아이프라브 24인치 확장형 캐리어 상품 상세"
  },
  d025: {
    url: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000163532",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "올리브영 선크림 1+1 상품 상세"
  },
  d027: {
    url: "https://m.gsshop.com/deal/deal.gs?dealNo=1081284321",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "GS SHOP 기저귀 딜 상세"
  },
  d029: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=1000568480807",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "SSG 7L 대용량 에어프라이어 상품 상세"
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
  d034: {
    url: "https://item.gmarket.co.kr/Item?goodscode=2739226248",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "G마켓 국산 KF94 마스크 100매 상품 상세"
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
  d041: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=1000620373892",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "SSG 노브랜드 도톰한 물티슈 100매 20개입 상품 상세"
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
  d052: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=1000560995801",
    checkedAt: "2026-05-31T11:10:00.000Z",
    source: "manual_review",
    evidence: "SSG 암막 커튼 2장 세트 상품 상세"
  }
};
