export interface VerifiedProductImage {
  url: string;
  checkedAt: string;
  source: "official_cdn" | "og_image" | "schema_image" | "official_page_image";
  evidence: string;
}

// Official product/event images extracted from verified purchase or benefit pages.
// Keep this curated list separate from mock deal copy so future partner feeds can
// replace it with API-provided imageUrl/thumbnail fields without touching UI data.
export const verifiedProductImages: Record<string, VerifiedProductImage> = {
  d001: {
    url: "https://contents.lotteon.com/itemimage/20251219045206/LO/22/52/51/69/87/_2/25/25/16/98/8/LO2252516987_2252516988_1.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "롯데온 상품 상세 og:image"
  },
  d005: {
    url: "https://benebedding.com/web/product/big/202604/1a16382526927e353eb85291631e99f6.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "베네베딩 공식 상품 상세 대표 이미지"
  },
  d015: {
    url: "https://cdn.011st.com/11dims/resize/600x600/quality/75/11src/product/7045626876/B.webp?38588346",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "11번가 상품 상세 og:image"
  },
  d018: {
    url: "https://product-image.kurly.com/product/image/20e4589f-15ef-4a2c-b087-711aefe23683.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "schema_image",
    evidence: "마켓컬리 상품 상세 구조화 이미지"
  },
  d020: {
    url: "https://image.msscdn.net/images/goods_img/20210412/1893766/1893766_17147213060440_500.jpeg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "무신사 상품 상세 대표 이미지"
  },
  d021: {
    url: "https://media.triple.guide/triple-cms/c_limit,f_auto,h_1024,w_1024/6cca126a-962b-4077-8cad-90e627c723d3.jpeg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "인터파크투어 공식 여행 상품 상세 대표 이미지"
  },
  d023: {
    url: "https://ecimg.cafe24img.com/pg1501b28865008006/ipraves/web/product/big/20250522/40d9ebc4b626096da2dec4f82409e304.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "아이프라브 공식 상품 상세 대표 이미지"
  },
  d026: {
    url: "https://static1.e-himart.co.kr/contents/goods/00/46/59/01/99/0046590199__OMEN-AM0121TX__M_220_220.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "하이마트 상품 상세 og:image"
  },
  d027: {
    url: "https://static.m-gs.kr/planprd/banner_NEW_SUB/827815711_01.png",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "official_page_image",
    evidence: "GS SHOP 공식 기획전 상세 이미지"
  },
  d033: {
    url: "http://www.korailtravel.com/images/good_img/KQ01215936/KQ01215936_006A.jpg",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "official_page_image",
    evidence: "코레일관광 공식 여행 상품 상세 이미지"
  },
  d036: {
    url: "https://static1.e-himart.co.kr/contents/goods/00/41/36/50/90/0041365090__A20173622__M_220_220.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "하이마트 상품 상세 og:image"
  },
  d037: {
    url: "https://image.msscdn.net/images/goods_img/20200520/1455894/1455894_9_500.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "무신사 상품 상세 대표 이미지"
  },
  d038: {
    url: "https://static.m-gs.kr/planprd/banner_NEW_SUB/827815711_01.png",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "official_page_image",
    evidence: "GS SHOP 공식 기획전 상세 이미지"
  },
  d039: {
    url: "https://ticketimage.interpark.com/TicketImage/notice_poster/20/2026052617475727.jpg",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "official_page_image",
    evidence: "인터파크 티켓 공식 공연 포스터 이미지"
  },
  d042: {
    url: "https://hpsimg.gsretail.com/medias/sys_master/images/images/h8d/he4/9141109162014.png",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "GS25 공식 이벤트 상세 이미지"
  },
  d048: {
    url: "https://cdn.011st.com/11dims/resize/600x600/quality/75/11src/dl/v2/8/3/2/7/7/0/LvAcF/1087832770_192188191.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "11번가 상품 상세 og:image"
  },
  d051: {
    url: "https://tourimage.interpark.com/product/tour/00161/R60/500/R6010684_1_353.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "인터파크투어 상품 상세 대표 이미지"
  },
  d055: {
    url: "https://static.toss.im/illusts/img-tosspay-tossfeed.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "토스 공식 혜택 상세 이미지"
  },
  d056: {
    url: "https://www.cjone.com/cjmweb/upfile/20260511_19e14795bc941.jpg",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "official_page_image",
    evidence: "CJ ONE 공식 이벤트 상세 이미지"
  },
  d059: {
    url: "https://images-kr.amoremall.com/fileupload/plandisplay/2023/03/31/MO_HM_BANNER_6438_2304_1w.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "아모레몰 공식 이벤트 상세 이미지"
  },
  d064: {
    url: "https://sui.ssgcdn.com/ui/grocery/img/service/event_top_banner.png",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "official_page_image",
    evidence: "이마트몰 공식 쓱배송 이벤트 페이지 이미지"
  },
  d065: {
    url: "https://www.yogiyo.co.kr/mobile/image/app_img_560x292_v2.png",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "og_image",
    evidence: "요기요 공식 혜택 페이지 og:image"
  },
  d067: {
    url: "https://membership.kt.com/pc/images/membership/kt_membership_og_image.png",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "og_image",
    evidence: "KT멤버십 공식 혜택 페이지 og:image"
  },
  d068: {
    url: "https://www.lguplus.com/static/pc-static/indv/images/contents/mem-grade-5-v2.png",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "official_page_image",
    evidence: "U+멤버십 공식 혜택 페이지 이미지"
  },
  d070: {
    url: "https://m.i-challenge.co.kr/Images/free/free_img01.jpg",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "official_page_image",
    evidence: "아이챌린지 공식 무료체험 페이지 이미지"
  },
  d072: {
    url: "https://ssl.pstatic.net/static/nid/membership/membershipOG_241022.png",
    checkedAt: "2026-06-06T09:20:00.000Z",
    source: "og_image",
    evidence: "네이버플러스 멤버십 공식 혜택 og:image"
  },
  d081: {
    url: "https://cdn.011st.com/11dims/resize/600x600/quality/75/11src/product/2463145821/B.webp?464982105",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "11번가 상품 상세 og:image"
  },
  d082: {
    url: "https://img-cf.kurly.com/shop/data/goods/1624587123171z0.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "schema_image",
    evidence: "마켓컬리 상품 상세 구조화 이미지"
  },
  d083: {
    url: "https://sitem.ssgcdn.com/72/92/31/item/1000035319272_i1_250.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "SSG 상품 상세 대표 이미지"
  },
  d086: {
    url: "https://image.msscdn.net/images/goods_img/20260306/6092416/6092416_17774685143733_500.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "무신사 상품 상세 대표 이미지"
  },
  d090: {
    url: "https://static1.e-himart.co.kr/contents/goods/00/00/02/65/70/0000026570__HIMCAB-H1.8GR-HM__M_220_220.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "하이마트 상품 상세 og:image"
  },
  d095: {
    url: "https://img-cf.kurly.com/shop/data/goods/1637655320806z0.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "schema_image",
    evidence: "마켓컬리 상품 상세 구조화 이미지"
  },
  d102: {
    url: "https://cdn.011st.com/11dims/resize/600x600/quality/75/11src/product/880122427/B.jpg?777000000",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "11번가 상품 상세 og:image"
  },
  d112: {
    url: "https://image.msscdn.net/images/goods_img/20260402/6245413/6245413_17764141460455_500.jpg",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "무신사 상품 상세 대표 이미지"
  },
  d119: {
    url: "https://cdn.011st.com/11dims/resize/600x600/quality/75/11src/product/7947620012/B.jpg?393120541",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "11번가 상품 상세 og:image"
  },
  d123: {
    url: "https://cdn.011st.com/11dims/resize/600x600/quality/75/11src/product/3008342629/B.png?570000000",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "11번가 상품 상세 og:image"
  },
  d128: {
    url: "https://cdn.011st.com/11dims/resize/600x600/quality/75/11src/product/8716931635/B.webp?769841787",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "11번가 상품 상세 og:image"
  },
  d133: {
    url: "https://cdn.011st.com/11dims/resize/600x600/quality/75/11src/product/9039746479/B.webp?645510740",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "11번가 상품 상세 og:image"
  },
  d137: {
    url: "https://cdn.011st.com/11dims/resize/600x600/quality/75/11src/pd/v2/2/8/1/9/7/9/cBkMe/9087281979_B.webp",
    checkedAt: "2026-06-06T08:20:00.000Z",
    source: "og_image",
    evidence: "11번가 상품 상세 og:image"
  }
};
