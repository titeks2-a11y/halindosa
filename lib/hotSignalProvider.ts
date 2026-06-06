import { DealCategory } from "@/types/deal";
import { getProviderCategory } from "@/data/dealChannels";
import { buildHotSignalDiscoveryPath } from "@/lib/hotSignalNavigation";
import { HotSignal, HotSignalType } from "@/types/hotSignal";

interface FeedSource {
  name: string;
  url: string;
  type: HotSignalType;
}

const hotKeywords = [
  "핫딜",
  "특가",
  "할인",
  "역대가",
  "무료",
  "무료배포",
  "무료입장",
  "무료개방",
  "공짜",
  "쿠폰",
  "카드할인",
  "무료배송",
  "1+1",
  "반값",
  "반값",
  "품절",
  "마감",
  "기간한정",
  "오늘만"
];

const categoryMatchers: Array<{ category: DealCategory; pattern: RegExp }> = [
  { category: "식품", pattern: /식품|먹거리|마트|라면|커피|음료|과일|한우|삼겹살|배달/ },
  { category: "전자기기", pattern: /전자|디지털|노트북|태블릿|이어폰|휴대폰|스마트폰|게임|모니터/ },
  { category: "생활용품", pattern: /생활|주방|세제|화장지|물티슈|수납|가구|침구/ },
  { category: "의류", pattern: /패션|의류|신발|운동화|무신사|아우터|다운|가방/ },
  { category: "육아", pattern: /육아|유아|기저귀|분유|장난감|키즈/ },
  { category: "여행/티켓", pattern: /여행|항공|숙박|티켓|공연|전시|호텔|리조트/ },
  { category: "뷰티", pattern: /뷰티|화장품|올리브영|크림|선크림|향수|헤어/ },
  { category: "가전", pattern: /가전|TV|냉장고|세탁기|청소기|에어컨|공기청정기/ }
];

function getDefaultNewsFeeds(): FeedSource[] {
  const queries = [
    "특가 할인 무료 when:7d",
    "기간한정 무료 할인 이벤트 when:7d",
    "역대가 핫딜 쿠폰 할인 when:7d",
    "항공권 숙박 무료 할인 when:14d"
  ];

  return queries.map((query) => {
    const url = new URL("https://news.google.com/rss/search");
    url.searchParams.set("q", query);
    url.searchParams.set("hl", "ko");
    url.searchParams.set("gl", "KR");
    url.searchParams.set("ceid", "KR:ko");

    return {
      name: `뉴스: ${query}`,
      url: url.toString(),
      type: "news" as const
    };
  });
}

function getConfiguredFeeds() {
  const newsFeeds = (process.env.DEAL_NEWS_RSS_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      name: `뉴스 피드 ${index + 1}`,
      url,
      type: "news" as const
    }));

  const communityFeeds = (process.env.DEAL_COMMUNITY_RSS_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      name: `커뮤니티 피드 ${index + 1}`,
      url,
      type: "community" as const
    }));

  const ppomppuUrl = process.env.PPOMPPU_HOTDEAL_RSS_URL?.trim();
  const ppomppuEnabled = process.env.PPOMPPU_HOTDEAL_ENABLE === "true";
  const ppomppuFeed =
    ppomppuEnabled && ppomppuUrl
      ? [
          {
            name: "뽐뿌 핫딜",
            url: ppomppuUrl,
            type: "community" as const
          }
        ]
      : [];

  return [...(newsFeeds.length ? newsFeeds : getDefaultNewsFeeds()), ...communityFeeds, ...ppomppuFeed];
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block: string, tagName: string) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function stableId(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function inferCategory(text: string): HotSignal["category"] {
  const compact = text.replace(/\s+/g, "");
  return categoryMatchers.find((item) => item.pattern.test(compact))?.category ?? "기타";
}

function extractKeywords(text: string) {
  return hotKeywords.filter((keyword) => text.includes(keyword)).slice(0, 5);
}

function scoreSignal(title: string, publishedAt: string, type: HotSignalType) {
  const text = title.replace(/\s+/g, "");
  const keywordScore = extractKeywords(title).length * 8;
  const freeScore = /무료|공짜|무료배포|무료입장|무료개방/.test(text) ? 22 : 0;
  const dealScore = /역대가|반값|1\+1|쿠폰|기간한정|오늘만|마감/.test(text) ? 14 : 0;
  const percentScore = /[5-9][0-9]\s*%|[1-9]0\s*프로/.test(text) ? 16 : 0;
  const ageHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / (60 * 60 * 1000));
  const recencyScore = Math.max(0, 60 - Math.floor(ageHours * 1.5));
  const typeScore = type === "community" ? 12 : 6;

  return Math.min(99, 20 + keywordScore + freeScore + dealScore + percentScore + recencyScore + typeScore);
}

function collectBlocks(xml: string, pattern: RegExp) {
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(xml)) !== null) {
    blocks.push(match[1]);
  }

  return blocks;
}

function parseRss(xml: string, source: FeedSource): HotSignal[] {
  const itemBlocks = collectBlocks(xml, /<item\b[^>]*>([\s\S]*?)<\/item>/gi);
  const entryBlocks = itemBlocks.length ? itemBlocks : collectBlocks(xml, /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi);

  return entryBlocks
    .map((block) => {
      const title = getTag(block, "title");
      const link = getTag(block, "link") || block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || "";
      const publishedAt = getTag(block, "pubDate") || getTag(block, "published") || getTag(block, "updated") || new Date().toISOString();
      const summary = getTag(block, "description") || getTag(block, "summary") || title;
      const text = `${title} ${summary}`;
      const normalizedDate = Number.isNaN(new Date(publishedAt).getTime()) ? new Date().toISOString() : new Date(publishedAt).toISOString();

      if (!title || !link) return null;

      return {
        id: `${source.type}-${stableId(`${title}-${link}`)}`,
        title,
        sourceName: source.name,
        url: link,
        publishedAt: normalizedDate,
        summary,
        category: inferCategory(text),
        keywords: extractKeywords(text),
        signalType: source.type,
        score: scoreSignal(title, normalizedDate, source.type)
      } satisfies HotSignal;
    })
    .filter((signal): signal is HotSignal => Boolean(signal));
}

async function fetchFeed(source: FeedSource) {
  const response = await fetch(source.url, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      "User-Agent": "HalindosaBot/0.1 (+local MVP; contact: owner)"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${source.name} feed failed: ${response.status}`);
  }

  return parseRss(await response.text(), source);
}

interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NaverNewsResponse {
  items: NaverNewsItem[];
}

async function fetchNaverNewsSignals() {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) return [];

  const queries = ["특가 할인 무료", "기간한정 무료 이벤트", "역대가 핫딜 할인", "항공권 숙박 할인 무료"];
  const settled = await Promise.allSettled(
    queries.map(async (query) => {
      const url = new URL("https://openapi.naver.com/v1/search/news.json");
      url.searchParams.set("query", query);
      url.searchParams.set("display", "10");
      url.searchParams.set("start", "1");
      url.searchParams.set("sort", "date");

      const response = await fetch(url, {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Naver news API failed: ${response.status}`);
      }

      const data = (await response.json()) as NaverNewsResponse;

      return data.items.map((item) => {
        const title = decodeXml(item.title);
        const summary = decodeXml(item.description || title);
        const publishedAt = Number.isNaN(new Date(item.pubDate).getTime()) ? new Date().toISOString() : new Date(item.pubDate).toISOString();
        const text = `${title} ${summary}`;

        return {
          id: `naver-news-${stableId(`${title}-${item.link}`)}`,
          title,
          sourceName: "할인도사 브리핑",
          url: item.originallink || item.link,
          publishedAt,
          summary,
          category: inferCategory(text),
          keywords: extractKeywords(text),
          signalType: "news" as const,
          score: scoreSignal(title, publishedAt, "news")
        } satisfies HotSignal;
      });
    })
  );

  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

async function fetchPublicBoardSignals() {
  if (process.env.DEAL_PUBLIC_BOARD_ENABLE === "false") return [];

  const response = await fetch("https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu", {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Halindosa/1.0)",
      Accept: "text/html,application/xhtml+xml"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Live board signals failed: ${response.status}`);
  }

  const html = new TextDecoder("euc-kr").decode(await response.arrayBuffer());
  const itemPattern =
    /<tr[^>]*class="baseList[^"]*"[\s\S]*?<td class="baseList-space baseList-numb"[^>]*>(\d+)<\/td>[\s\S]*?<img src="([^"]*)"[\s\S]*?<a class='baseList-title' href="([^"]+)"[\s\S]*?<span>([\s\S]*?)<\/span><\/a>[\s\S]*?<small class="baseList-small">\[([^\]]+)\]<\/small>[\s\S]*?title="([^"]+)"[\s\S]*?<td class='baseList-space baseList-views' colspan=2>([^<]+)<\/td>/g;
  const signals: HotSignal[] = [];
  let match = itemPattern.exec(html);
  let index = 0;

  while (match && signals.length < 18) {
    const [, no, imageUrl, url, rawTitle, boardCategory, , views] = match;
    const title = decodeXml(rawTitle);
    const link = new URL(url.replaceAll("&amp;", "&"), "https://www.ppomppu.co.kr/zboard/").toString();
    const viewCount = Number(views.replace(/[^0-9]/g, "")) || 0;
    const publishedAt = new Date(Date.now() - index * 5 * 60 * 1000).toISOString();
    const summary = `${boardCategory}에서 빠르게 반응이 올라오는 할인 정보입니다. 조회 ${viewCount.toLocaleString("ko-KR")}회 기준으로 할인도사가 우선 확인했습니다.`;

    signals.push({
      id: `board-signal-${no}`,
      title,
      sourceName: "할인도사 브리핑",
      url: link,
      imageUrl: normalizeSignalImage(imageUrl),
      publishedAt,
      summary,
      category: inferCategory(`${boardCategory} ${title}`),
      keywords: extractKeywords(title),
      signalType: "community",
      score: Math.min(99, scoreSignal(title, publishedAt, "community") + Math.floor(viewCount / 900))
    });

    index += 1;
    match = itemPattern.exec(html);
  }

  return signals;
}

function normalizeSignalImage(value: string) {
  if (!value || /noimage/i.test(value)) return "";
  const absoluteUrl = value.startsWith("//")
    ? `https:${value}`
    : value.startsWith("/")
      ? `https://www.ppomppu.co.kr${value}`
      : value;

  return `/api/image?url=${encodeURIComponent(absoluteUrl)}`;
}

export async function fetchHotSignals(options: { category?: string; q?: string; limit?: number; source?: string } = {}) {
  const feeds = getConfiguredFeeds().filter((feed) => {
    if (!options.source || options.source === "all") return true;
    return feed.type === options.source || feed.name.includes(options.source);
  });

  const settled = await Promise.allSettled([fetchNaverNewsSignals(), fetchPublicBoardSignals(), ...feeds.map(fetchFeed)]);
  let signals = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const query = options.q?.trim().toLowerCase();
  const providerCategory = getProviderCategory(options.category) ?? options.category;

  if (providerCategory && !["전체", "all", "popular", "ending", "news"].includes(providerCategory)) {
    signals = signals.filter((signal) => signal.category === providerCategory);
  }

  if (query) {
    signals = signals.filter((signal) =>
      [signal.title, signal.summary, signal.sourceName, signal.category, ...signal.keywords].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }

  const unique = new Map<string, HotSignal>();
  for (const signal of signals) {
    unique.set(signal.url, signal);
  }

  return Array.from(unique.values())
    .sort((a, b) => b.score - a.score || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, options.limit && options.limit > 0 ? options.limit : 12)
    .map((signal) => ({
      ...signal,
      url: buildHotSignalDiscoveryPath(signal)
    }));
}
