import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mockDeals = readFileSync(join(root, "data/mockDeals.ts"), "utf8");
const searchAliases = JSON.parse(readFileSync(join(root, "data/searchAliases.json"), "utf8"));

const requiredSearches = [
  {
    query: "생필품",
    expected: /생활용품|생활필수|물티슈|세제|마스크|생수|장보기/,
    minMatches: 4
  },
  {
    query: "무배",
    expected: /무료배송|무배|로켓배송|로켓프레시|네멤무료/,
    minMatches: 8
  },
  {
    query: "0원",
    expected: /무료|무료혜택|0원딜|무료 샘플|무료체험|초대권|쿠폰/,
    minMatches: 4
  },
  {
    query: "가전제품",
    expected: /가전|전자기기|디지털|TV|청소기|충전|아이패드|드라이어/,
    minMatches: 4
  },
  {
    query: "편의점",
    expected: /편의점\/마트|편의점|GS25|CU|세븐일레븐|1\+1|2\+1|모바일쿠폰/,
    minMatches: 4
  },
  {
    query: "앱테크",
    expected: /포인트|적립|앱테크|출석|페이|멤버십|리워드/,
    minMatches: 3
  },
  {
    query: "육아템",
    expected: /육아|키즈|기저귀|유아|샘플팩|체험/,
    minMatches: 3
  }
];

function normalizeSearchText(value) {
  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-zㄱ-ㅎ가-힣ㅏ-ㅣ]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function getTokenAlternatives(token) {
  const normalizedToken = normalizeSearchText(token);
  const compactToken = compactSearchText(normalizedToken);
  const alternatives = new Set([normalizedToken]);

  for (const alias of searchAliases) {
    const keyMatched = alias.keys.some((key) => {
      const normalizedKey = normalizeSearchText(key);
      const compactKey = compactSearchText(normalizedKey);
      return normalizedToken === normalizedKey || compactToken === compactKey || compactToken.includes(compactKey);
    });

    if (keyMatched) {
      for (const term of alias.terms) {
        alternatives.add(normalizeSearchText(term));
      }
    }
  }

  return Array.from(alternatives).filter(Boolean);
}

function textIncludesSearchTerm(haystack, compactHaystack, term) {
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedTerm) return true;
  return haystack.includes(normalizedTerm) || compactHaystack.includes(compactSearchText(normalizedTerm));
}

function extractDeals() {
  const pattern =
    /deal\(\s*"(?<id>d\d+)"\s*,\s*"(?<mall>[^"]+)"\s*,\s*"(?<title>[^"]+)"\s*,\s*"(?<category>[^"]+)"\s*,[\s\S]*?\[(?<tags>[^\]]*)\]/g;
  const deals = [];

  for (const match of mockDeals.matchAll(pattern)) {
    if (!match.groups) continue;
    deals.push({
      id: match.groups.id,
      mall: match.groups.mall,
      title: match.groups.title,
      category: match.groups.category,
      tags: [...match.groups.tags.matchAll(/"([^"]+)"/g)].map((tagMatch) => tagMatch[1])
    });
  }

  return deals;
}

function dealMatchesSearchText(searchText, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(searchText);
  const compactHaystack = compactSearchText(haystack);
  const compactQuery = compactSearchText(normalizedQuery);
  const tokenAlternatives = normalizedQuery.split(" ").filter(Boolean).map(getTokenAlternatives);

  return (
    haystack.includes(normalizedQuery) ||
    compactHaystack.includes(compactQuery) ||
    tokenAlternatives.every((alternatives) => alternatives.some((term) => textIncludesSearchTerm(haystack, compactHaystack, term)))
  );
}

const deals = extractDeals();
const issues = [];

if (!Array.isArray(searchAliases) || searchAliases.length < 7) {
  issues.push("생활형 검색 alias 목록이 부족합니다.");
}

for (const item of requiredSearches) {
  const alias = searchAliases.find((candidate) => candidate.keys.includes(item.query));
  if (!alias) {
    issues.push(`${item.query}: searchAliases.json에 key가 없습니다.`);
    continue;
  }

  const matches = deals.filter((deal) => dealMatchesSearchText([deal.title, deal.mall, deal.category, ...deal.tags].join(" "), item.query));
  const expectedMatches = matches.filter((deal) => item.expected.test([deal.title, deal.mall, deal.category, ...deal.tags].join(" ")));

  if (matches.length < item.minMatches) {
    issues.push(`${item.query}: 검색 결과가 부족합니다. ${matches.length}/${item.minMatches}`);
  }

  if (!expectedMatches.length) {
    issues.push(`${item.query}: 기대 카테고리/태그와 연결된 결과가 없습니다.`);
  }
}

if (issues.length) {
  console.error("Search quality doctor failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Search quality doctor passed.");
for (const item of requiredSearches) {
  const count = deals.filter((deal) => dealMatchesSearchText([deal.title, deal.mall, deal.category, ...deal.tags].join(" "), item.query)).length;
  console.log(`- ${item.query}: ${count} deals`);
}
