export interface VerifiedPurchaseLink {
  url: string;
  checkedAt: string;
  source: "manual_review" | "partner_feed" | "official_api";
}

// Curated product detail URLs that passed a manual product-page review.
// Keep this map separate from mock copy so future partner feeds can replace it
// without touching presentation-oriented sample data.
export const verifiedPurchaseLinks: Record<string, VerifiedPurchaseLink> = {
  d003: {
    url: "https://item.gmarket.co.kr/Item?goodsCode=1645289356",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review"
  },
  d011: {
    url: "https://www.ssg.com/item/itemView.ssg?itemId=1000377767271",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review"
  },
  d014: {
    url: "https://www.coupang.com/vp/products/7687552147",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review"
  },
  d018: {
    url: "https://www.kurly.com/goods/1001058180",
    checkedAt: "2026-05-31T10:00:00.000Z",
    source: "manual_review"
  }
};
