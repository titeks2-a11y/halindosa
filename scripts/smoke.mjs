const loopbackHost = ["127", "0", "0", "1"].join(".");
const baseUrl = process.env.SMOKE_BASE_URL ?? `http://${loopbackHost}:3000`;
const smokeFetchTimeoutMs = Number(process.env.SMOKE_FETCH_TIMEOUT_MS ?? 30000);
const nativeFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = async (input, init = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), smokeFetchTimeoutMs);

  try {
    return await nativeFetch(input, {
      ...init,
      signal: init.signal ?? controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
};

const checks = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function check(name, fn) {
  const startedAt = Date.now();

  try {
    await fn();
    checks.push({ name, ok: true, latencyMs: Date.now() - startedAt });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function fetchJson(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const data = await response.json();
  return { response, data };
}

function isUnsafeDealUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const communityHosts = [
      "ppomppu.co.kr",
      "fmkorea.com",
      "quasarzone.com",
      "algumon.com",
      "clien.net",
      "ruliweb.com",
      "dcinside.com",
      "theqoo.net",
      "instiz.net",
      "coolenjoy.net"
    ];

    return (
      !["http:", "https:"].includes(url.protocol) ||
      host === "example.com" ||
      host.endsWith(".example.com") ||
      communityHosts.some((communityHost) => host === communityHost || host.endsWith(`.${communityHost}`) || host.includes(communityHost))
    );
  } catch {
    return true;
  }
}

function isMallHomeOnlyUrl(value) {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "");
    return path === "" || path === "/" || path === "/main" || path === "/index";
  } catch {
    return true;
  }
}

await check("home page", async () => {
  const response = await fetch(`${baseUrl}/`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("할인도사"), "Home page missing brand text");
  assert(text.includes("샤오미 86인치") || text.includes("새우깡"), "Home page missing initial deal cards");
  assert(text.includes("데이터 상태"), "Home page missing data quality summary");
  assert(text.includes("구매 전 판매처 확인"), "Home page missing purchase verification guidance");
  assert(text.includes("판매처 확인"), "Home page deal cards missing visible seller confirmation CTA");
  assert(text.includes("상세 보기"), "Home page deal cards missing visible detail CTA");
  assert(text.includes("구매 전 체크"), "Home page deal cards missing compact purchase check summary");
  assert(text.includes("가격/재고 변동"), "Home page missing price stock risk guidance");
  assert(text.includes("구매 이동 안내"), "Home page missing purchase link overview");
  assert(text.includes("구매처 바로 확인 상품을 먼저 보여드려요"), "Home page missing customer-facing purchase link explanation");
  assert(text.includes("판매처 확인 단계"), "Home page missing review-needed purchase path explanation");
  assert(text.includes("오늘 바로 볼 할인 지도"), "Home page missing quick discovery guide");
  assert(text.includes("구매처 바로 확인"), "Home page missing verified purchase quick filter");
  assert(text.includes("쇼핑몰별 특가 바로가기"), "Home page missing mall discovery section");
  assert(text.includes("자주 쓰는 판매처만 골라보기"), "Home page missing mall discovery guide copy");
  assert(text.includes("구매처 확인"), "Home page missing mall verified purchase link summary");
  assert(text.includes("검색 도우미"), "Home page missing search discovery panel");
  assert(text.includes("인기 검색어") && text.includes("최근 검색어"), "Home page missing popular/recent search keyword sections");
  assert(text.includes("현재 결과"), "Home page missing search result count summary");
  assert(text.includes("최근 기록 관리") && text.includes("찜 목록 보기"), "Home page missing recent deal management actions");
  assert(!text.includes("직접 구매 링크 비율"), "Home page should not expose internal link coverage ratio copy");
  assert(text.includes("aria-pressed="), "Home deal favorite buttons missing pressed state");
  assert(text.includes("판매처 이동 전 확인"), "Home deal open buttons missing accessible purchase label");
  assert(text.includes("네트워크 정상") || text.includes("오프라인 상태"), "Home page missing network status summary");
  assert(text.includes("전체 쇼핑몰") && text.includes("쿠팡 ("), "Home page missing mall filter counts");
  assert(text.includes("전체 가격대") && text.includes("1만원 미만"), "Home page missing price band filter");
});

await check("home query filters", async () => {
  const response = await fetch(`${baseUrl}/?category=식품&sort=discount&q=새우깡`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("할인도사"), "Filtered home missing brand text");
  assert(text.includes("새우깡") || text.includes("검색"), "Filtered home missing query result context");
  assert(text.includes("적용된 조건"), "Filtered home missing active filter summary");
  assert(text.includes("조건 초기화"), "Filtered home missing filter reset action");
});

await check("mypage data controls", async () => {
  const response = await fetch(`${baseUrl}/mypage`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("비회원으로 이용 중") || text.includes("로그인하고 관심 특가"), "Mypage missing account auth panel");
  assert(text.includes("계정 활동 요약"), "Mypage missing account activity summary");
  assert(text.includes("설정 점검 요약"), "Mypage missing settings summary");
  assert(text.includes("내 데이터와 알림을 한눈에 관리"), "Mypage missing data and notification management summary");
  assert(text.includes("빠른 작업"), "Mypage missing quick actions section");
  assert(text.includes("찜한 특가") && text.includes("알림 센터") && text.includes("카테고리"), "Mypage missing quick action links");
  assert(text.includes("기기 데이터 관리"), "Mypage missing local data controls");
  assert(text.includes("찜/최근 본 특가/가격 알림 삭제"), "Mypage missing local deal data delete action");
  assert(text.includes("가격 알림 조건"), "Mypage missing price alert deletion scope");
  assert(text.includes("분석/제휴 동의 초기화"), "Mypage missing consent reset action");
  assert(text.includes("서비스 안내"), "Mypage missing service guide link");
  assert(text.includes("가격/품절 정보 신고"), "Mypage missing report entry point");
  assert(text.includes("support@halindosa.com"), "Mypage missing production support email");
  assert(!text.includes("halindosa.example"), "Mypage still exposes example support email");
  assert(text.includes("개인정보/추적 설정"), "Mypage missing consent settings panel");
  assert(text.includes("삭제 대상"), "Mypage missing local data deletion scope");
  assert(text.includes("가격 신고는 할인 정보 품질 확인 기록"), "Mypage missing report retention notice");
});

await check("auth pages", async () => {
  const [login, signup] = await Promise.all([
    fetch(`${baseUrl}/login`).then(async (response) => ({ response, text: await response.text() })),
    fetch(`${baseUrl}/signup`).then(async (response) => ({ response, text: await response.text() }))
  ]);

  assert(login.response.status === 200, `Expected login 200, got ${login.response.status}`);
  assert(signup.response.status === 200, `Expected signup 200, got ${signup.response.status}`);
  assert(login.text.includes("로그인") && login.text.includes("이메일") && login.text.includes("비밀번호"), "Login page missing email/password form");
  assert(signup.text.includes("회원가입") && signup.text.includes("닉네임") && signup.text.includes("영문+숫자 포함 8자 이상"), "Signup page missing nickname/password policy");
  for (const provider of ["구글", "카카오", "네이버"]) {
    assert(login.text.includes(provider), `Login page missing ${provider} social login entry`);
    assert(signup.text.includes(provider), `Signup page missing ${provider} social login entry`);
  }
  assert(login.text.includes("관심 특가") || signup.text.includes("관심 특가"), "Auth pages missing conversion copy");
});

await check("oauth callback and onboarding pages", async () => {
  const [callback, onboarding] = await Promise.all([
    fetch(`${baseUrl}/auth/callback?next=https://evil.example`).then(async (response) => ({ response, text: await response.text() })),
    fetch(`${baseUrl}/onboarding`).then(async (response) => ({ response, text: await response.text() }))
  ]);

  assert(callback.response.status === 200, `Expected callback 200, got ${callback.response.status}`);
  assert(callback.text.includes("소셜 로그인"), "OAuth callback page missing title");
  assert(callback.text.includes("로그인 정보를 확인"), "OAuth callback page missing safe processing copy");
  assert(onboarding.response.status === 200, `Expected onboarding 200, got ${onboarding.response.status}`);
  assert(onboarding.text.includes("관심 카테고리") && onboarding.text.includes("무료/체험"), "Onboarding page missing category setup");
});

await check("account deletion guard", async () => {
  const badConfirm = await fetchJson("/api/account/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmText: "삭제" })
  });
  assert(badConfirm.response.status === 400, `Expected bad confirm 400, got ${badConfirm.response.status}`);
  assert(badConfirm.data.ok === false, "Bad confirm should fail");

  const noSession = await fetchJson("/api/account/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmText: "탈퇴" })
  });
  assert([401, 503].includes(noSession.response.status), `Expected no-session 401/503, got ${noSession.response.status}`);
  assert(noSession.data.ok === false, "No-session account deletion should fail safely");
});

await check("service guide page", async () => {
  const response = await fetch(`${baseUrl}/guide`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("서비스 안내"), "Guide page missing title");
  assert(text.includes("구매 전 꼭 확인하세요"), "Guide page missing purchase warning");
  assert(text.includes("외부 판매처 이동 방식"), "Guide page missing redirect explanation");
  assert(text.includes("이동 전 판매처 확인"), "Guide page missing pre-purchase destination check explanation");
  assert(text.includes("구매 전 10초 체크"), "Guide page missing purchase safety checklist");
  assert(text.includes("최종 결제 금액") && text.includes("취소·반품"), "Guide page missing safety checklist details");
  assert(text.includes("계정과 데이터 관리"), "Guide page missing account and data management guidance");
  assert(text.includes("회원 탈퇴") && text.includes("가격 알림 데이터"), "Guide page missing account deletion data scope");
  assert(text.includes("신고와 고객 문의") && text.includes("support@halindosa.com"), "Guide page missing report/support guidance");
});

await check("support page", async () => {
  const response = await fetch(`${baseUrl}/support`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("고객센터"), "Support page missing title");
  assert(text.includes("가격 또는 품절 신고"), "Support page missing report entry");
  assert(text.includes("구매 전 확인 기준"), "Support page missing purchase guidance entry");
  assert(text.includes("support@halindosa.com"), "Support page missing support email");
  assert(text.includes("자주 묻는 질문"), "Support page missing FAQ section");
  assert(text.includes("로그인 없이 사용할 수 있나요"), "Support page missing non-member FAQ");
  assert(text.includes("개인정보처리방침") && text.includes("이용약관") && text.includes("마이 설정"), "Support page missing policy and data management links");
});

await check("category and notification pages", async () => {
  const categories = await fetch(`${baseUrl}/categories`);
  const categoriesText = await categories.text();
  assert(categories.status === 200, `Expected categories 200, got ${categories.status}`);
  assert(categoriesText.includes("원하는 할인 정보만 빠르게 보기"), "Categories page missing title");
  assert(categoriesText.includes("전체") && categoriesText.includes("쿠팡") && categoriesText.includes("여행"), "Categories page missing key channels");
  assert(categoriesText.includes("개 특가"), "Categories page missing deal counts");
  assert(categoriesText.includes("구매 링크 확인"), "Categories page missing purchase link quality count");
  assert(categoriesText.includes("대표 특가"), "Categories page missing representative deal summary");
  assert(categoriesText.includes("추천 탐색") && categoriesText.includes("카테고리 묶음"), "Categories page missing grouped discovery sections");
  assert(categoriesText.includes("구매 링크 확인이 많은 영역부터 보기"), "Categories page missing verified-first discovery guide");

  const notifications = await fetch(`${baseUrl}/notifications`);
  const notificationsText = await notifications.text();
  assert(notifications.status === 200, `Expected notifications 200, got ${notifications.status}`);
  assert(notificationsText.includes("알림 센터"), "Notifications page missing title");
  assert(notificationsText.includes("마감임박") && notificationsText.includes("인기") && notificationsText.includes("신규") && notificationsText.includes("무료배송"), "Notifications page missing alert summary chips");
  assert(notificationsText.includes("전체 보기"), "Notifications page missing alert group deep links");
  assert(notificationsText.includes("저장한 가격 알림"), "Notifications page missing saved price alert list");
  assert(notificationsText.includes("실제 푸시 발송은 FCM 연결 후 별도 동의"), "Notifications page missing push readiness copy");
  assert(notificationsText.includes("알림 운영 방식") && notificationsText.includes("권한 요청 없이 먼저 쓸 수 있게 준비했습니다"), "Notifications page missing push readiness operating guide");
  assert(notificationsText.includes("오늘 먼저 확인할 알림"), "Notifications page missing priority alert queue");
  assert(notificationsText.includes("마감과 인기 반응이 겹친 특가부터 보기"), "Notifications page missing priority alert guide copy");
  assert(notificationsText.includes("마감 임박 특가"), "Notifications page missing ending group");
  assert(notificationsText.includes("무료배송 특가"), "Notifications page missing free shipping group");
});

await check("admin dashboard quality cards", async () => {
  const response = await fetch(`${baseUrl}/admin`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("운영 대시보드"), "Admin dashboard missing title");
  assert(text.includes("구매 링크 확인율"), "Admin dashboard missing verified link rate card");
  assert(text.includes("링크 검토 필요"), "Admin dashboard missing link review count card");
  assert(text.includes("오늘 처리할 링크 작업"), "Admin dashboard missing link review action summary");
  assert(text.includes("구매 링크 보강 우선순위"), "Admin dashboard missing link review priority summary");
  assert(text.includes("링크 검수 큐"), "Admin dashboard missing link review queue");
  assert(text.includes("판매처 확인"), "Admin dashboard missing seller review action");
  assert(text.includes("처리 기준"), "Admin dashboard missing report handling guidance");
  assert(text.includes("상품 상세 URL 보강 필요"), "Admin dashboard missing localized link review action");
  assert(/우선[\s\S]{0,20}검수|보강[\s\S]{0,20}검수|대기[\s\S]{0,20}검수/.test(text), "Admin dashboard missing link review priority labels");
  assert(text.includes("현재 이동 URL"), "Admin dashboard missing current link review destination");
  assert(!text.includes("mock, staging, production"), "Admin dashboard exposes raw source pipeline copy");
  assert(!text.includes("· score "), "Admin dashboard exposes raw score copy");
});

await check("commercial launch readiness page", async () => {
  const response = await fetch(`${baseUrl}/commercialization`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("할인도사 출시 준비 보드"), "Commercialization page missing launch readiness title");
  assert(text.includes("출시 직전 체크"), "Commercialization page missing release checklist");
  assert(text.includes("실제 운영 전환"), "Commercialization page missing operating transition guidance");
  assert(text.includes("Supabase OAuth Provider"), "Commercialization page missing OAuth provider external setup");
  assert(text.includes("남은 링크 검수"), "Commercialization page missing link review risk section");
  assert(text.includes("구매 링크 확인율"), "Commercialization page missing verified link rate metric");
  assert(text.includes("출시 준비 단계"), "Commercialization page missing launch readiness phase");
  assert(text.includes("다음 우선 조치"), "Commercialization page missing next action queue");
  assert(text.includes("실기기 QA 체크리스트"), "Commercialization page missing device QA checklist reminder");
  assert(text.includes("운영 환경변수 확인"), "Commercialization page missing environment doctor reminder");
});

await check("deals api", async () => {
  const { response, data } = await fetchJson("/api/deals?limit=3&sort=discount");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Deals API ok should be true");
  assert(data.count === 3, `Expected 3 deals, got ${data.count}`);
  assert(data.deals[0].discountRate >= data.deals[1].discountRate, "Deals are not sorted by discount");
  assert(data.quality?.total === data.count, "Deals API quality summary should match returned count");
  assert(data.quality?.verifiedRate >= 0, "Deals API quality summary missing verified rate");
  assert(data.quality?.averagePurchaseConfidence >= 0, "Deals API quality summary missing purchase confidence");
  for (const field of ["mallName", "thumbnail", "shipping", "expireAt", "isFreeShipping", "productUrl", "searchUrl", "originalUrl", "clickCount", "likeCount", "isSoldOut", "updatedAt"]) {
    assert(field in data.deals[0], `Canonical Deal field missing: ${field}`);
  }
  for (const field of ["linkVerified", "finalUrl", "checkedAt", "purchaseConfidence", "purchaseLinkVerified", "finalPurchaseUrl"]) {
    assert(field in data.deals[0], `Purchase link verification field missing: ${field}`);
  }
  assert(!data.message.includes("mock"), "Deals API should not expose mock wording in success message");
  for (const field of ["mall", "imageUrl", "shippingInfo", "expiresAt"]) {
    assert(field in data.deals[0], `Legacy Deal alias missing: ${field}`);
  }
});

await check("deals filters api", async () => {
  const hot = await fetchJson("/api/deals?hotOnly=true&limit=5");
  assert(hot.response.status === 200, `Expected 200, got ${hot.response.status}`);
  assert(hot.data.deals.every((deal) => deal.isHot), "hotOnly returned a non-hot deal");

  const ending = await fetchJson("/api/deals?endingSoonOnly=true&limit=5");
  assert(ending.response.status === 200, `Expected 200, got ${ending.response.status}`);
  assert(ending.data.deals.every((deal) => deal.isEndingSoon), "endingSoonOnly returned a non-ending deal");

  const freeShipping = await fetchJson("/api/deals?freeShippingOnly=true&limit=5");
  assert(freeShipping.response.status === 200, `Expected 200, got ${freeShipping.response.status}`);
  assert(
    freeShipping.data.deals.every((deal) => /무료배송|무배|네멤무료|로켓프레시/.test([deal.shippingInfo, ...deal.tags].join(" "))),
    "freeShippingOnly returned a non-free-shipping deal"
  );

  const verified = await fetchJson("/api/deals?verifiedOnly=true&limit=10");
  assert(verified.response.status === 200, `Expected 200, got ${verified.response.status}`);
  assert(verified.data.deals.length > 0, "verifiedOnly should return verified direct purchase deals");
  assert(
    verified.data.deals.every((deal) => deal.linkStatus === "verified" && deal.linkType !== "seller_search"),
    "verifiedOnly returned a deal that still needs link review"
  );

  const auction = await fetchJson("/api/deals?mall=auction&limit=5");
  assert(auction.response.status === 200, `Expected 200, got ${auction.response.status}`);
  assert(auction.data.deals.length > 0, "Auction mall filter should return at least one deal");
  assert(auction.data.deals.every((deal) => /옥션|auction/i.test(`${deal.mallName} ${deal.mall}`)), "Auction mall filter returned another mall");

  const budget = await fetchJson("/api/deals?priceBand=under10000&limit=20");
  assert(budget.response.status === 200, `Expected 200, got ${budget.response.status}`);
  assert(budget.data.deals.length > 0, "Budget price band should return at least one deal");
  assert(budget.data.deals.every((deal) => deal.salePrice < 10000), "priceBand=under10000 returned a deal over budget");

  const premium = await fetchJson("/api/deals?minPrice=100000&limit=20");
  assert(premium.response.status === 200, `Expected 200, got ${premium.response.status}`);
  assert(premium.data.deals.length > 0, "minPrice filter should return at least one deal");
  assert(premium.data.deals.every((deal) => deal.salePrice >= 100000), "minPrice returned a cheaper deal");
});

await check("deal link integrity", async () => {
  const { response, data } = await fetchJson("/api/deals?limit=100&sort=latest");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Deals API ok should be true");
  assert(data.deals.length >= 50, `Expected at least 50 deals, got ${data.deals.length}`);
  const verifiedDirectLinks = data.deals.filter((deal) => deal.linkStatus === "verified" && deal.linkType !== "seller_search");
  const verifiedDirectRate = Math.round((verifiedDirectLinks.length / data.deals.length) * 100);
  assert(
    verifiedDirectLinks.length >= 46 && verifiedDirectRate >= 85,
    `verified direct purchase link coverage too low: ${verifiedDirectLinks.length}/${data.deals.length} (${verifiedDirectRate}%)`
  );

  for (const deal of data.deals) {
    const destination = deal.purchaseUrl || deal.url || deal.link;
    assert(!/티몬|위메프/.test(`${deal.mallName} ${deal.mall}`), `${deal.id} uses excluded mall: ${deal.mallName}`);
    assert(["direct_purchase", "seller_search", "affiliate", "unavailable"].includes(deal.linkType), `${deal.id} invalid linkType`);
    assert(["verified", "needs_review", "broken", "sold_out"].includes(deal.linkStatus), `${deal.id} invalid linkStatus`);
    assert(typeof deal.linkVerified === "boolean", `${deal.id} linkVerified should be boolean`);
    assert(typeof deal.purchaseLinkVerified === "boolean", `${deal.id} purchaseLinkVerified should be boolean`);
    assert(typeof deal.purchaseConfidence === "number", `${deal.id} purchaseConfidence should be number`);
    assert(deal.purchaseConfidence >= 0 && deal.purchaseConfidence <= 100, `${deal.id} purchaseConfidence out of range`);
    assert(deal.finalUrl && !isUnsafeDealUrl(deal.finalUrl), `${deal.id} has unsafe finalUrl: ${deal.finalUrl}`);
    assert(deal.finalPurchaseUrl && !isUnsafeDealUrl(deal.finalPurchaseUrl), `${deal.id} has unsafe finalPurchaseUrl: ${deal.finalPurchaseUrl}`);
    assert(!isUnsafeDealUrl(destination), `${deal.id} has unsafe/community/placeholder destination: ${destination}`);

    if (deal.linkStatus === "verified") {
      assert(deal.linkType !== "seller_search", `${deal.id} verified deal should not be seller_search`);
      assert(deal.linkVerified === true, `${deal.id} verified deal should set linkVerified`);
      assert(deal.purchaseLinkVerified === true, `${deal.id} verified deal should set purchaseLinkVerified`);
      assert(!isMallHomeOnlyUrl(destination), `${deal.id} verified deal points to mall home: ${destination}`);
    }

    if (deal.linkType === "seller_search") {
      assert(deal.linkStatus === "needs_review", `${deal.id} seller_search should be needs_review`);
      assert(deal.linkVerified === false, `${deal.id} seller_search should not be linkVerified`);
      assert(/검색|확인/.test(deal.linkLabel), `${deal.id} seller_search label should warn about review`);
    }
  }
});

await check("verified direct purchase link coverage", async () => {
  const { response, data } = await fetchJson("/api/deals?verifiedOnly=true&limit=100&sort=hot");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Verified deals API ok should be true");
  assert(data.deals.length >= 46, `Expected at least 46 verified direct purchase deals, got ${data.deals.length}`);
  assert(
    data.deals.every((deal) => deal.linkStatus === "verified" && deal.linkVerified && deal.purchaseLinkVerified && deal.finalPurchaseUrl),
    "Verified-only API returned a deal without a reviewed direct product URL"
  );
});

await check("deal detail api", async () => {
  const { response, data } = await fetchJson("/api/deals/d001");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.deal?.id === "d001", "Detail API did not return d001");
  assert(Array.isArray(data.relatedDeals), "Related deals missing");
  assert(Array.isArray(data.priceHistory) && data.priceHistory.length >= 7, "Price history missing");
  assert(data.priceInsight?.confidenceScore >= 0, "Price insight missing");
});

await check("health api", async () => {
  const { response, data } = await fetchJson("/api/health");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.status === "healthy", `Expected healthy, got ${data.status}`);
});

await check("metrics api", async () => {
  const { response, data } = await fetchJson("/api/metrics");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.metrics?.totalDeals >= 30, "Metrics should include at least 30 deals");
  assert(data.metrics?.averageConfidenceScore >= 0, "Metrics missing confidence score");
  assert(data.metrics?.verifiedLinkRate >= 0, "Metrics missing verified link rate");
  assert(data.metrics?.needsReviewLinks >= 0, "Metrics missing link review count");
  assert(data.linkQuality?.total === data.metrics?.totalDeals, "Metrics missing shared link quality summary");
  assert(Array.isArray(data.linkReviewQueue), "Metrics missing link review queue");
  assert(data.linkReviewQueue.length <= 8, "Metrics link review queue should be capped");
  if (data.linkReviewQueue.length) {
    assert(data.linkReviewQueue[0].reviewPriority, "Metrics link review queue missing priority");
    assert(data.linkReviewQueue[0].reviewReason, "Metrics link review queue missing reason");
    assert(data.linkReviewQueue[0].finalPurchaseUrl, "Metrics link review queue missing final purchase URL");
  }
});

await check("sources api", async () => {
  const { response, data } = await fetchJson("/api/sources");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Sources API ok should be true");
  assert(Array.isArray(data.sources) && data.sources.length >= 4, "Sources list is too small");
  assert(data.sources.some((source) => source.key === "mock"), "Mock source profile missing");
});

await check("report api", async () => {
  const reasons = await fetchJson("/api/reports?dealId=d001");
  assert(reasons.response.status === 200, `Expected 200, got ${reasons.response.status}`);
  assert(reasons.data.maxMessageLength === 500, "Report API missing message length policy");

  const { response, data } = await fetchJson("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dealId: "d001",
      reason: "price_changed",
      message: "smoke test"
    })
  });
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Report API ok should be true");
  assert(response.headers.get("x-request-id"), "Report API missing request id");
  assert(response.headers.get("x-ratelimit-remaining"), "Report API missing rate limit header");
});

await check("report page reason prefill", async () => {
  const response = await fetch(`${baseUrl}/reports?dealId=d014&reason=sold_out`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("가격 오류 신고"), "Report page missing title");
  assert(text.includes("애플워치 호환 스포츠 밴드"), "Report page missing deal summary");
  assert(text.includes("품절"), "Report page missing sold out reason option");
  assert(text.includes("구매 기준 보기") && text.includes("문의하기"), "Report page missing post-submit next actions");
  assert(text.includes("support@halindosa.com"), "Report page missing support contact");
});

await check("report validation", async () => {
  const { response, data } = await fetchJson("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dealId: "d001",
      reason: "price_changed",
      message: "x".repeat(501)
    })
  });

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.ok === false, "Long report message should fail");
  assert(data.message.includes("500자"), "Long report validation message missing max length");
});

await check("admin reports api", async () => {
  const { response, data } = await fetchJson("/api/admin/reports");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Admin reports API ok should be true");
  assert(data.summary?.total >= 1, "Admin reports summary should include submitted report");
  assert(Array.isArray(data.reports), "Admin reports list missing");
});

await check("admin report status update", async () => {
  const created = await fetchJson("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dealId: "d002",
      reason: "wrong_info",
      message: "status update smoke test"
    })
  });
  const reportId = created.data.report?.id;
  assert(reportId, "Created report missing id");

  const { response, data } = await fetchJson("/api/admin/reports", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportId,
      status: "reviewing"
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Report status update should be ok");
  assert(data.report?.status === "reviewing", `Expected reviewing, got ${data.report?.status}`);
});

await check("partner feed import dry-run", async () => {
  const { response, data } = await fetchJson("/api/admin/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "smoke_partner",
      items: [
        {
          externalId: "smoke-001",
          mall: "스모크몰",
          title: "스모크 테스트 특가",
          category: "식품",
          originalPrice: 30000,
          salePrice: 18000,
          productUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
          searchUrl: "https://search.shopping.naver.com/search/all?query=%EC%8A%A4%EB%AA%A8%ED%81%AC%20%ED%85%8C%EC%8A%A4%ED%8A%B8%20%ED%8A%B9%EA%B0%80",
          tags: ["무료배송"]
        }
      ]
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Import dry-run should pass");
  assert(data.valid === 1, `Expected 1 valid row, got ${data.valid}`);
  assert(data.previewDeals?.[0]?.discountRate === 40, "Normalized discount rate mismatch");
  assert(data.previewDeals?.[0]?.linkVerified === true, "Partner productUrl should normalize as a verified purchase link");
  assert(data.linkSummary?.verified === 1, "Import link summary should count verified product links");
});

await check("partner feed import blocks unsafe links", async () => {
  const { response, data } = await fetchJson("/api/admin/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "smoke_partner",
      items: [
        {
          externalId: "unsafe-001",
          mall: "스모크몰",
          title: "커뮤니티 링크 특가",
          category: "식품",
          originalPrice: 30000,
          salePrice: 18000,
          link: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=1"
        },
        {
          externalId: "unsafe-002",
          mall: "스모크몰",
          title: "플레이스홀더 링크 특가",
          category: "식품",
          originalPrice: 30000,
          salePrice: 18000,
          link: "https://example.com/smoke"
        }
      ]
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === false, "Unsafe import dry-run should fail");
  assert(data.invalid === 2, `Expected 2 invalid rows, got ${data.invalid}`);
  assert(
    data.issues?.some((issue) => issue.field === "link" && /placeholder|커뮤니티/.test(issue.message)),
    "Expected unsafe link validation issue"
  );
});

await check("partner feed import validation", async () => {
  const { response, data } = await fetchJson("/api/admin/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "smoke_partner",
      items: [
        {
          externalId: "",
          mall: "스모크몰",
          title: "잘못된 특가",
          category: "식품",
          originalPrice: 10000,
          salePrice: 15000,
          link: "not-a-url"
        }
      ]
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === false, "Invalid import dry-run should fail");
  assert(data.invalid === 1, `Expected 1 invalid row, got ${data.invalid}`);
  assert(data.issues?.length >= 2, "Expected validation issues");
});

await check("track api", async () => {
  const { response, data } = await fetchJson("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "deal_click",
      dealId: "d001",
      page: "smoke"
    })
  });
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Track API ok should be true");
  assert(response.headers.get("x-request-id"), "Track API missing request id");
});

await check("redirect api", async () => {
  const response = await fetch(`${baseUrl}/api/redirect/d014?from=smoke&analytics=granted&affiliate=granted`, {
    redirect: "manual"
  });
  const location = response.headers.get("location") ?? "";
  assert(response.status === 302, `Expected 302, got ${response.status}`);
  assert(response.headers.get("x-request-id"), "Redirect API missing request id");
  assert(location.includes("sub_id=halindosa-local"), `Redirect missing affiliate sub_id: ${location}`);
  assert(location.includes("utm_campaign=smoke"), `Redirect missing campaign: ${location}`);
});

await check("redirect consent guard", async () => {
  const response = await fetch(`${baseUrl}/api/redirect/d014?from=smoke`, {
    redirect: "manual"
  });
  const location = response.headers.get("location") ?? "";
  assert(response.status === 302, `Expected 302, got ${response.status}`);
  assert(!location.includes("sub_id="), `Redirect should not include affiliate sub_id without consent: ${location}`);
});

await check("go purchase redirect", async () => {
  const response = await fetch(`${baseUrl}/go/d014?from=smoke&analytics=granted&affiliate=granted`, {
    redirect: "manual"
  });
  const location = response.headers.get("location") ?? "";
  assert(response.status === 302, `Expected 302, got ${response.status}`);
  assert(response.headers.get("x-request-id"), "Go redirect missing request id");
  assert(location.includes("coupang.com"), `Go redirect should resolve to seller URL, got ${location}`);
});

await check("detail purchase consent guard", async () => {
  const response = await fetch(`${baseUrl}/deals/d014`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("구매 전 판매처 확인"), "Detail page missing purchase confirm button");
  assert(text.includes("구매 전 10초 체크"), "Detail page missing purchase safety checklist");
  assert(text.includes("구매 정보 확인 요약"), "Detail page missing purchase readiness summary");
  assert(text.includes("예정 도메인"), "Detail page missing destination domain summary");
  assert(text.includes("관련 특가도 구매 전 체크"), "Detail page missing commerce-ready related deal section");
  assert(text.includes("같은 카테고리 보기"), "Detail page missing related category navigation");
  assert(text.includes("정보 신고"), "Detail page missing safety report CTA");
  assert(text.includes("가격 알림 신청"), "Detail page missing price alert opt-in panel");
  assert(text.includes("실제 푸시 발송은 운영 서버와 FCM 연결 후 활성화"), "Detail page should explain push alert readiness");
  assert(!text.includes("affiliate=granted"), "Detail page should not server-render affiliate consent");
  assert(!text.includes("analytics=granted"), "Detail page should not server-render analytics consent");
  assert(!text.includes("신뢰도 "), "Detail page should not expose internal numeric confidence labels");
});

await check("favorites page consent guard", async () => {
  const response = await fetch(`${baseUrl}/favorites`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(text.includes("관심 특가"), "Favorites page missing title");
  assert(text.includes("구매 링크 확인 특가 보기"), "Favorites empty state missing verified link CTA");
  assert(text.includes("먼저 저장해볼 만한 특가"), "Favorites empty state missing starter recommendations");
  assert(text.includes("저장 상품 정렬"), "Favorites page missing saved deal sort section");
  assert(text.includes("할인율 높은순") && text.includes("마감임박순") && text.includes("낮은 가격순"), "Favorites page missing sort options");
  assert(!text.includes("affiliate=granted"), "Favorites page should not server-render affiliate consent");
  assert(!text.includes("analytics=granted"), "Favorites page should not server-render analytics consent");
});

await check("seller search redirect fallbacks", async () => {
  const cases = [
    ["d014", "coupang.com"],
    ["d016", "gmarket.co.kr"],
    ["d015", "11st.co.kr"],
    ["d012", "oliveyoung.co.kr"],
    ["d020", "musinsa.com"],
    ["d041", "ssg.com"],
    ["d043", "aliexpress.com"],
    ["d044", "auction.co.kr"]
  ];

  for (const [dealId, expectedHost] of cases) {
    const response = await fetch(`${baseUrl}/api/redirect/${dealId}?from=smoke`, {
      redirect: "manual"
    });
    const location = response.headers.get("location") ?? "";
    assert(response.status === 302, `Expected 302 for ${dealId}, got ${response.status}`);
    assert(location.includes(expectedHost), `Expected ${dealId} redirect to ${expectedHost}, got ${location}`);
  }
});

await check("affiliate status api", async () => {
  const { response, data } = await fetchJson("/api/affiliate/status");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Affiliate status API ok should be true");
  assert(data.status?.subId, "Affiliate status missing sub id state");
});

await check("admin export csv", async () => {
  const response = await fetch(`${baseUrl}/api/admin/export`);
  const text = await response.text();
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(response.headers.get("content-type")?.includes("text/csv"), "Export is not CSV");
  assert(response.headers.get("x-request-id"), "Export missing request id");
  assert(text.startsWith("id,mall,title"), "CSV header missing");
  assert(text.includes("linkStatus") && text.includes("finalPurchaseUrl"), "CSV missing link review fields");
  assert(text.includes("reviewPriority") && text.includes("reviewReason"), "CSV missing link review workflow fields");
});

await check("seo files", async () => {
  const [sitemap, robots, manifest] = await Promise.all([
    fetch(`${baseUrl}/sitemap.xml`).then((response) => response.text()),
    fetch(`${baseUrl}/robots.txt`).then((response) => response.text()),
    fetch(`${baseUrl}/manifest.webmanifest`).then((response) => response.text())
  ]);

  assert(sitemap.includes("/deals/d001"), "Sitemap missing deal detail URL");
  assert(sitemap.includes("/guide"), "Sitemap missing service guide URL");
  assert(sitemap.includes("/support"), "Sitemap missing support URL");
  assert(sitemap.includes("/commercialization"), "Sitemap missing commercialization readiness URL");
  assert(robots.includes("User-Agent"), "Robots file missing User-Agent");
  assert(manifest.includes("할인도사"), "Manifest missing app name");
  assert(manifest.includes("halindosa-icon-192.png"), "Manifest missing 192 icon");
  assert(manifest.includes("halindosa-icon-512.png"), "Manifest missing 512 icon");
  assert(manifest.includes("shortcuts"), "Manifest missing app shortcuts");
});

const failed = checks.filter((result) => !result.ok);

for (const result of checks) {
  const status = result.ok ? "PASS" : "FAIL";
  const suffix = result.ok ? "" : ` - ${result.error}`;
  console.log(`${status} ${result.name} (${result.latencyMs}ms)${suffix}`);
}

if (failed.length > 0) {
  console.error(`Smoke test failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Smoke test passed: ${checks.length}/${checks.length}`);
