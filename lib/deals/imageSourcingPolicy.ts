export interface ImageSourcingPolicy {
  key: string;
  label: string;
  recommendedImageSource: string;
  acquisitionChannel: "partner_feed" | "official_feed" | "official_batch" | "manual_review";
  feedFields: string[];
  imageRightsChecklist: string[];
  manualVerification: string;
  prohibitedImageSource: string;
}

export interface ImageSourcingOperation {
  policy: ImageSourcingPolicy;
  sourceSafetyLevel: "official_or_partner_only";
  imageReadyGate: string;
  requiredFeedFields: string[];
  operatorChecklist: string[];
  requestTemplate: string;
}

const defaultPolicy: ImageSourcingPolicy = {
  key: "default",
  label: "판매처 공식 이미지",
  recommendedImageSource: "판매처 상품 상세 또는 승인된 제휴/운영 피드의 대표 imageUrl",
  acquisitionChannel: "manual_review",
  feedFields: ["imageUrl", "thumbnail", "imageSourceUrl", "imageUpdatedAt"],
  imageRightsChecklist: ["판매처 또는 제휴사가 제공한 이미지", "상품명과 옵션이 현재 노출 상품과 일치", "검색 결과 캡처나 커뮤니티 이미지가 아님"],
  manualVerification: "상품 상세의 대표 이미지와 현재 상품명, 옵션, 판매처가 일치하는지 확인",
  prohibitedImageSource: "검색 결과 썸네일, 커뮤니티 캡처, 뉴스 기사 이미지, 무출처 임의 이미지"
};

const policies: Array<{ match: RegExp; policy: ImageSourcingPolicy }> = [
  {
    match: /쿠팡|coupang/i,
    policy: {
      key: "coupang",
      label: "쿠팡 파트너스/상품 API 이미지",
      recommendedImageSource: "쿠팡 파트너스 상품 API 또는 공식 제휴 피드의 productImage/imageUrl",
      acquisitionChannel: "partner_feed",
      feedFields: ["imageUrl", "productImage", "vendorItemId", "itemId", "imageUpdatedAt"],
      imageRightsChecklist: ["쿠팡 파트너스 또는 승인 제휴 feed 제공 이미지", "itemId/vendorItemId가 구매 URL과 일치", "로켓/판매자 옵션 변경 여부 확인"],
      manualVerification: "쿠팡 상품 ID, itemId, vendorItemId와 이미지가 같은 옵션을 가리키는지 확인",
      prohibitedImageSource: "쿠팡 검색 결과 썸네일 수동 복사, 커뮤니티 첨부 이미지, 옵션 불일치 이미지"
    }
  },
  {
    match: /g마켓|지마켓|gmarket/i,
    policy: {
      key: "gmarket",
      label: "G마켓 공식 상품 이미지",
      recommendedImageSource: "G마켓 goodsCode 기반 공식 이미지 CDN 또는 제휴 feed imageUrl",
      acquisitionChannel: "official_feed",
      feedFields: ["imageUrl", "goodsCode", "imageSourceUrl", "imageUpdatedAt"],
      imageRightsChecklist: ["goodsCode가 구매 URL과 일치", "공식 CDN 또는 판매처 feed 제공 이미지", "대표 이미지가 현재 상품 구성과 일치"],
      manualVerification: "goodsCode 기반 이미지가 상품 상세의 대표 이미지와 같은지 확인",
      prohibitedImageSource: "검색 화면 캡처, 커뮤니티 CDN, 판매 종료 상품의 과거 이미지"
    }
  },
  {
    match: /11번가|11st/i,
    policy: {
      key: "elevenst",
      label: "11번가 상품 API 이미지",
      recommendedImageSource: "11번가 Open API/제휴 feed의 productImage 또는 대표 imageUrl",
      acquisitionChannel: "official_feed",
      feedFields: ["imageUrl", "productNo", "productImage", "imageUpdatedAt"],
      imageRightsChecklist: ["productNo가 구매 URL과 일치", "11번가 API 또는 승인 feed 제공 이미지", "옵션/패키지 구성 일치"],
      manualVerification: "products/{productNo} 상세와 이미지, 가격 기준 시각을 함께 확인",
      prohibitedImageSource: "검색 결과 이미지, 블로그 리뷰 이미지, 옵션이 다른 상품 이미지"
    }
  },
  {
    match: /ssg|쓱|이마트|emart/i,
    policy: {
      key: "ssg",
      label: "SSG/이마트 공식 상품 이미지",
      recommendedImageSource: "SSG·이마트몰 상품 feed 또는 itemId와 연결된 공식 대표 이미지",
      acquisitionChannel: "official_batch",
      feedFields: ["imageUrl", "itemId", "siteNo", "imageSourceUrl", "imageUpdatedAt"],
      imageRightsChecklist: ["itemId가 구매 URL과 일치", "SSG/이마트 공식 feed 또는 상품 상세 이미지", "배송 권역·옵션 변경 가능성 확인"],
      manualVerification: "itemId 상세 페이지의 대표 이미지와 현재 상품명이 일치하는지 확인",
      prohibitedImageSource: "행사 배너 이미지, 검색 결과 썸네일, 다른 묶음 구성 이미지"
    }
  },
  {
    match: /올리브영|olive/i,
    policy: {
      key: "oliveyoung",
      label: "올리브영 공식 상품 이미지",
      recommendedImageSource: "올리브영 goodsNo 기반 공식 썸네일 또는 승인 feed imageUrl",
      acquisitionChannel: "official_feed",
      feedFields: ["imageUrl", "goodsNo", "imageSourceUrl", "imageUpdatedAt"],
      imageRightsChecklist: ["goodsNo가 상세 URL과 일치", "공식 상품 썸네일 URL", "기획세트 구성과 이미지 일치"],
      manualVerification: "goodsNo 상세의 대표 썸네일과 기획세트명이 같은지 확인",
      prohibitedImageSource: "리뷰 이미지, 브랜드 화보, 다른 용량/기획 이미지"
    }
  },
  {
    match: /무신사|musinsa/i,
    policy: {
      key: "musinsa",
      label: "무신사 상품 이미지",
      recommendedImageSource: "무신사 상품 번호 기반 공식 대표 이미지 또는 브랜드 승인 feed imageUrl",
      acquisitionChannel: "official_batch",
      feedFields: ["imageUrl", "productNo", "brandName", "imageSourceUrl", "imageUpdatedAt"],
      imageRightsChecklist: ["productNo가 구매 URL과 일치", "브랜드/컬러/사이즈 옵션 확인", "공식 상품 이미지 출처 확인"],
      manualVerification: "상품 번호와 브랜드, 컬러 옵션이 이미지와 일치하는지 확인",
      prohibitedImageSource: "착용 후기 이미지, SNS 이미지, 다른 컬러 옵션 이미지"
    }
  }
];

export function getImageSourcingPolicy(mallName?: string): ImageSourcingPolicy {
  const target = String(mallName ?? "").trim();
  const matched = policies.find((item) => item.match.test(target));

  return matched?.policy ?? defaultPolicy;
}

export function buildImageSourcingOperation(mallName?: string): ImageSourcingOperation {
  const policy = getImageSourcingPolicy(mallName);
  const displayMall = String(mallName ?? "판매처").trim() || "판매처";
  const requiredFeedFields = Array.from(new Set([...policy.feedFields, "imageRights", "priceCheckedAt"]));
  const operatorChecklist = Array.from(
    new Set([
      ...policy.imageRightsChecklist,
      policy.manualVerification,
      "검색 결과 썸네일, 커뮤니티 캡처, 블로그 이미지는 사용하지 않음",
      "상품명, 옵션, 가격 기준 시각이 현재 노출 상품과 일치"
    ])
  );

  return {
    policy,
    sourceSafetyLevel: "official_or_partner_only",
    imageReadyGate: "productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt이 함께 있어야 운영 ready",
    requiredFeedFields,
    operatorChecklist,
    requestTemplate: `${displayMall} 이미지 보강 요청: ${requiredFeedFields.join(", ")} 필드를 공식/제휴 피드로 제공하고, 검색 결과 썸네일·커뮤니티 이미지는 제외`
  };
}
