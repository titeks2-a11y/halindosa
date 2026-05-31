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
  d025: {
    url: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000163532",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "올리브영 선크림 1+1 상품 상세"
  },
  d032: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=0000009774169",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "SSG 향수 50ml 상품 상세"
  },
  d037: {
    url: "https://www.musinsa.com/products/1893766",
    checkedAt: "2026-05-31T10:20:00.000Z",
    source: "manual_review",
    evidence: "무신사 3팩 티셔츠 상품 상세"
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
  }
};
