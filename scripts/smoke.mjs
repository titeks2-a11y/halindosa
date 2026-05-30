const loopbackHost = ["127", "0", "0", "1"].join(".");
const baseUrl = process.env.SMOKE_BASE_URL ?? `http://${loopbackHost}:3000`;

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
    return (
      !["http:", "https:"].includes(url.protocol) ||
      host === "example.com" ||
      host.endsWith(".example.com") ||
      host.includes("ppomppu.co.kr")
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
  assert(text.includes("구매 링크 확인"), "Home page missing verified link count");
  assert(text.includes("네트워크 정상") || text.includes("오프라인 상태"), "Home page missing network status summary");
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
  assert(text.includes("기기 데이터 관리"), "Mypage missing local data controls");
  assert(text.includes("찜/최근 본 특가 삭제"), "Mypage missing local deal data delete action");
  assert(text.includes("분석/제휴 동의 초기화"), "Mypage missing consent reset action");
});

await check("deals api", async () => {
  const { response, data } = await fetchJson("/api/deals?limit=3&sort=discount");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Deals API ok should be true");
  assert(data.count === 3, `Expected 3 deals, got ${data.count}`);
  assert(data.deals[0].discountRate >= data.deals[1].discountRate, "Deals are not sorted by discount");
  assert(data.quality?.total === data.count, "Deals API quality summary should match returned count");
  assert(data.quality?.verifiedRate >= 0, "Deals API quality summary missing verified rate");
  for (const field of ["mallName", "thumbnail", "shipping", "expireAt", "isFreeShipping"]) {
    assert(field in data.deals[0], `Canonical Deal field missing: ${field}`);
  }
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
});

await check("deal link integrity", async () => {
  const { response, data } = await fetchJson("/api/deals?limit=100&sort=latest");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Deals API ok should be true");
  assert(data.deals.length >= 50, `Expected at least 50 deals, got ${data.deals.length}`);

  for (const deal of data.deals) {
    const destination = deal.purchaseUrl || deal.url || deal.link;
    assert(!/티몬|위메프/.test(`${deal.mallName} ${deal.mall}`), `${deal.id} uses excluded mall: ${deal.mallName}`);
    assert(["direct_purchase", "seller_search", "affiliate", "unavailable"].includes(deal.linkType), `${deal.id} invalid linkType`);
    assert(["verified", "needs_review", "broken", "sold_out"].includes(deal.linkStatus), `${deal.id} invalid linkStatus`);
    assert(!isUnsafeDealUrl(destination), `${deal.id} has unsafe/community/placeholder destination: ${destination}`);

    if (deal.linkStatus === "verified") {
      assert(deal.linkType !== "seller_search", `${deal.id} verified deal should not be seller_search`);
      assert(!isMallHomeOnlyUrl(destination), `${deal.id} verified deal points to mall home: ${destination}`);
    }

    if (deal.linkType === "seller_search") {
      assert(deal.linkStatus === "needs_review", `${deal.id} seller_search should be needs_review`);
      assert(/검색|확인/.test(deal.linkLabel), `${deal.id} seller_search label should warn about review`);
    }
  }
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
          link: "https://example.com/smoke",
          tags: ["무료배송"]
        }
      ]
    })
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.ok === true, "Import dry-run should pass");
  assert(data.valid === 1, `Expected 1 valid row, got ${data.valid}`);
  assert(data.previewDeals?.[0]?.discountRate === 40, "Normalized discount rate mismatch");
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

await check("seller search redirect fallbacks", async () => {
  const cases = [
    ["d014", "coupang.com"],
    ["d016", "gmarket.co.kr"],
    ["d015", "11st.co.kr"],
    ["d012", "oliveyoung.co.kr"],
    ["d020", "musinsa.com"]
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
});

await check("seo files", async () => {
  const [sitemap, robots, manifest] = await Promise.all([
    fetch(`${baseUrl}/sitemap.xml`).then((response) => response.text()),
    fetch(`${baseUrl}/robots.txt`).then((response) => response.text()),
    fetch(`${baseUrl}/manifest.webmanifest`).then((response) => response.text())
  ]);

  assert(sitemap.includes("/deals/d001"), "Sitemap missing deal detail URL");
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
