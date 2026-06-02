import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";

const loopbackHost = ["127", "0", "0", "1"].join(".");
const healthTimeoutMs = 60000;
const feedItems = [
  {
    externalId: "fixture-001",
    mall: "쿠팡",
    title: "무선 청소기 주말 특가",
    description: "운영 피드 전환 검증용 가전 특가입니다.",
    category: "가전",
    dealType: "discount",
    benefitSummary: "주말 한정 무료배송 특가",
    originalPrice: 259000,
    salePrice: 159000,
    imageUrl: "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/2024/01/01/10/0/product.jpg",
    productUrl: "https://www.coupang.com/vp/products/7999681537",
    searchUrl: "https://www.coupang.com/np/search?q=%EB%AC%B4%EC%84%A0%20%EC%B2%AD%EC%86%8C%EA%B8%B0",
    sourceName: "쿠팡",
    sourceUrl: "https://www.coupang.com/vp/products/7999681537",
    shipping: "무료배송",
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    tags: ["무료배송", "한정수량", "주말특가"]
  },
  {
    externalId: "fixture-002",
    mall: "G마켓",
    title: "즉석밥 24개입 특가",
    description: "운영 피드 전환 검증용 식품 쿠폰 특가입니다.",
    category: "식품",
    dealType: "coupon",
    benefitSummary: "쿠폰 적용 시 즉석밥 묶음 할인",
    originalPrice: 39800,
    salePrice: 24900,
    imageUrl: "https://gdimg.gmarket.co.kr/4076233103/still/600",
    productUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
    searchUrl: "https://browse.gmarket.co.kr/search?keyword=%EC%A6%89%EC%84%9D%EB%B0%A5%2024%EA%B0%9C%EC%9E%85",
    sourceName: "G마켓",
    sourceUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
    shipping: "무료배송",
    couponCondition: "판매처 쿠폰 적용",
    minimumOrderAmount: 0,
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    tags: ["무료배송", "쿠폰적용"]
  },
  {
    externalId: "fixture-blocked-community",
    mall: "커뮤니티",
    title: "커뮤니티 원문 단독 링크",
    description: "차단 검증용 커뮤니티 원문 단독 링크입니다.",
    category: "기타",
    dealType: "discount",
    benefitSummary: "커뮤니티 원문만 있어 차단되어야 하는 항목",
    originalPrice: 50000,
    salePrice: 30000,
    imageUrl: "https://www.ppomppu.co.kr/images/noimage.png",
    productUrl: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=1",
    sourceName: "뽐뿌",
    sourceUrl: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=1",
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    tags: ["검수실패"]
  }
];

function commandParts(command) {
  if (process.platform === "win32") return ["cmd.exe", ["/d", "/s", "/c", command]];
  return ["sh", ["-c", command]];
}

function stopProcessTree(child) {
  if (!child.pid) return;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }

  child.kill("SIGTERM");
}

async function getAvailablePort() {
  const server = createServer();
  server.listen(0, loopbackHost);
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  server.close();
  await once(server, "close");
  return port;
}

async function startFeedServer() {
  const server = createServer((request, response) => {
    if (request.url === "/feed.json") {
      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      });
      response.end(JSON.stringify({ items: feedItems }));
      return;
    }

    response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: false, message: "Not found" }));
  });

  server.listen(0, loopbackHost);
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  return {
    server,
    url: `http://${loopbackHost}:${port}/feed.json`
  };
}

async function waitForHealth(baseUrl, devOutput) {
  const startedAt = Date.now();
  const healthUrl = `${baseUrl}/api/health`;

  while (Date.now() - startedAt < healthTimeoutMs) {
    try {
      const response = await fetch(healthUrl);
      const data = await response.json();
      if (response.ok && data.ok) return;
    } catch {
      // Next.js is still compiling.
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(`Health check timed out at ${healthUrl}\n\nDev server output:\n${devOutput.slice(-4000)}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  assert(response.ok, `${url} returned HTTP ${response.status}`);
  return data;
}

async function main() {
  const { server: feedServer, url: feedUrl } = await startFeedServer();
  const appPort = await getAvailablePort();
  const baseUrl = `http://${loopbackHost}:${appPort}`;
  const [devFile, devArgs] = commandParts(`npm run dev -- --hostname ${loopbackHost} --port ${appPort}`);
  let devOutput = "";

  const devServer = spawn(devFile, devArgs, {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      DEAL_DATA_MODE: "production",
      DEAL_PROVIDER: "production",
      DEAL_PRODUCTION_FEED_URLS: feedUrl,
      DEAL_PARTNER_FEED_URLS: ""
    }
  });

  devServer.stdout.on("data", (chunk) => {
    devOutput += chunk.toString();
  });
  devServer.stderr.on("data", (chunk) => {
    devOutput += chunk.toString();
  });

  try {
    await waitForHealth(baseUrl, devOutput);

    const dealsData = await fetchJson(`${baseUrl}/api/deals?limit=10&sort=latest`);
    assert(dealsData.ok === true, "Deals API should return ok=true.");
    assert(dealsData.source === "production", `Deals API should use production source, got ${dealsData.source}.`);
    assert(Array.isArray(dealsData.deals), "Deals API should return a deals array.");

    const fixtureDeals = dealsData.deals.filter((deal) => String(deal.id).startsWith("production-fixture-"));
    assert(fixtureDeals.length === 2, `Expected 2 valid production fixture deals, got ${fixtureDeals.length}.`);
    assert(!dealsData.deals.some((deal) => String(deal.id).includes("blocked-community")), "Blocked community-only item should not be exposed.");

    for (const deal of fixtureDeals) {
      assert(deal.finalPurchaseUrl || deal.productUrl || deal.link, `${deal.id} is missing a purchase URL.`);
      const destination = deal.finalPurchaseUrl || deal.productUrl || deal.link;
      const url = new URL(destination);
      assert(["http:", "https:"].includes(url.protocol), `${deal.id} has unsafe URL protocol.`);
      assert(!url.hostname.includes("ppomppu.co.kr"), `${deal.id} should not point to a community-only URL.`);
      assert(deal.linkVerified === true || deal.linkStatus === "verified", `${deal.id} should be marked as verified.`);
      assert(/^https?:\/\//.test(deal.thumbnail || deal.imageUrl || ""), `${deal.id} should include a real feed image URL.`);
    }

    const sourcesData = await fetchJson(`${baseUrl}/api/sources`);
    assert(sourcesData.ok === true, "Sources API should return ok=true.");
    assert(sourcesData.currentSource === "production", `Sources API should report production source, got ${sourcesData.currentSource}.`);
    assert(sourcesData.operationPolicy?.configuredProductionFeeds === 1, "Sources API should report one configured production feed.");
    assert(String(sourcesData.operationPolicy?.nextStep ?? "").includes("production 피드"), "Sources API should expose production feed dry-run guidance.");

    console.log(`Production feed doctor passed: ${fixtureDeals.length}/2 valid fixture deals imported from ${feedUrl}`);
  } finally {
    stopProcessTree(devServer);
    feedServer.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
