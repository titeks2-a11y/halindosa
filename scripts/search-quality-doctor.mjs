import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mockDeals = readFileSync(join(root, "data/mockDeals.ts"), "utf8");
const homePage = readFileSync(join(root, "app/page.tsx"), "utf8");
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
  },
  {
    query: "로켓",
    expected: /쿠팡|로켓배송|로켓프레시|무료배송/,
    minMatches: 6
  },
  {
    query: "지마켓",
    expected: /지마켓|G마켓|g마켓|쿠폰적용|오늘출발/,
    minMatches: 12
  },
  {
    query: "알리",
    expected: /알리익스프레스|해외직구|무료배송|전자기기/,
    minMatches: 1
  },
  {
    query: "배달쿠폰",
    expected: /배달|외식|요기요|쿠폰|첫 구매/,
    minMatches: 3
  },
  {
    query: "커피쿠폰",
    expected: /커피|음료|스타벅스|메가MGC커피|무료 쿠폰|모바일 교환권/,
    minMatches: 4
  },
  {
    query: "영화무료",
    expected: /영화|시사회|초대권|여행\/티켓|이벤트/,
    minMatches: 4
  },
  {
    query: "생수",
    expected: /생수|탐사수|제주용암수|생활필수|무료배송/,
    minMatches: 5
  },
  {
    query: "물티슈",
    expected: /물티슈|생활필수|생활용품|마트딜|무배/,
    minMatches: 4
  },
  {
    query: "기저귀",
    expected: /기저귀|육아|키즈|팬티|쿠폰적용/,
    minMatches: 4
  },
  {
    query: "치약",
    expected: /치약|샴푸|생활필수|생활용품|오늘출발/,
    minMatches: 3
  },
  {
    query: "패션",
    expected: /의류|패션|티셔츠|반팔|브랜드|무신사/,
    minMatches: 5
  },
  {
    query: "우산",
    expected: /우산|장우산|장마|비오는날/,
    minMatches: 1
  },
  {
    query: "치킨쿠폰",
    expected: /치킨|BHC|외식할인|치킨쿠폰/,
    minMatches: 1
  },
  {
    query: "무료커피",
    expected: /커피|무료커피|커피무료|무료 쿠폰|메가MGC커피|스타벅스|사이즈업/,
    minMatches: 4
  },
  {
    query: "라면",
    expected: /라면|신라면|진라면|너구리|짜파게티|오징어짬뽕/,
    minMatches: 3
  },
  {
    query: "햇반",
    expected: /햇반|즉석밥|간편식|컵밥/,
    minMatches: 1
  },
  {
    query: "세제",
    expected: /세제|주방세제|섬유유연제|세탁세제|대용량/,
    minMatches: 4
  },
  {
    query: "선크림",
    expected: /선크림|선블록|자외선차단|썬크림/,
    minMatches: 1
  },
  {
    query: "유산균",
    expected: /유산균|락토핏|프로바이오틱스|건강식품|영양제/,
    minMatches: 1
  },
  {
    query: "계란",
    expected: /계란|달걀|무항생제|특란|식품/,
    minMatches: 1
  },
  {
    query: "우유",
    expected: /우유|멸균우유|신선식품|로켓프레시|식품/,
    minMatches: 1
  },
  {
    query: "닭가슴살",
    expected: /닭가슴살|단백질|냉동|간편식|식품/,
    minMatches: 1
  },
  {
    query: "마스크",
    expected: /마스크|KF94|황사방역|생활필수|생활용품/i,
    minMatches: 1
  },
  {
    query: "충전케이블",
    expected: /USB-C|충전 케이블|100W|케이블|디지털/i,
    minMatches: 1
  },
  {
    query: "멀티탭",
    expected: /멀티탭|절전형|콘센트|생활용품|디지털/,
    minMatches: 1
  },
  {
    query: "화장지",
    expected: /화장지|휴지|두루마리|생활필수|생활용품/,
    minMatches: 1
  },
  {
    query: "청소포",
    expected: /청소포|물걸레|청소용품|생활필수|생활용품/,
    minMatches: 1
  },
  {
    query: "김자반",
    expected: /김자반|노브랜드|장보기|식품|마트/,
    minMatches: 1
  },
  {
    query: "김치",
    expected: /김치|포기김치|장보기|신선식품|식품/,
    minMatches: 3
  },
  {
    query: "키친타월",
    expected: /키친타월|키친타올|주방용품|생활필수|생활용품/,
    minMatches: 1
  },
  {
    query: "참치",
    expected: /참치|참치캔|통조림|장보기|식품/,
    minMatches: 1
  },
  {
    query: "가글",
    expected: /가글|리스테린|마우스워시|구강청결|생활필수/,
    minMatches: 1
  },
  {
    query: "콜라",
    expected: /콜라|제로콜라|탄산음료|음료|간식/,
    minMatches: 1
  },
  {
    query: "탈취제",
    expected: /탈취제|페브리즈|섬유탈취제|생활필수|세탁/,
    minMatches: 1
  },
  {
    query: "단백질바",
    expected: /단백질바|프로틴바|닥터유|간식|헬스/,
    minMatches: 1
  },
  {
    query: "새우깡",
    expected: /새우깡|과자|스낵|간식|식품/,
    minMatches: 1
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
      return normalizedToken === normalizedKey || compactToken === compactKey;
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

function extractHighIntentKeywords() {
  const match = homePage.match(/const highIntentSearchKeywords = \[(?<body>[\s\S]*?)\];/);
  const body = match?.groups?.body ?? "";
  return [...body.matchAll(/"([^"]+)"/g)].map((keywordMatch) => keywordMatch[1]);
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
const highIntentKeywords = extractHighIntentKeywords();
const issues = [];

if (!Array.isArray(searchAliases) || searchAliases.length < 100) {
  issues.push(`생활형 검색 alias 목록이 부족합니다. ${searchAliases.length}/100`);
}

if (highIntentKeywords.length < 24) {
  issues.push(`홈 추천 검색어가 부족합니다. ${highIntentKeywords.length}/24`);
}

const highIntentSet = new Set();
for (const keyword of highIntentKeywords) {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (highIntentSet.has(normalizedKeyword)) {
    issues.push(`홈 추천 검색어가 중복됩니다: ${keyword}`);
  }
  highIntentSet.add(normalizedKeyword);
}

for (const [index, alias] of searchAliases.entries()) {
  if (!Array.isArray(alias.keys) || alias.keys.length < 2) {
    issues.push(`searchAliases.json ${index + 1}번째 항목의 keys가 부족합니다.`);
  }

  if (!Array.isArray(alias.terms) || alias.terms.length < 3) {
    issues.push(`searchAliases.json ${index + 1}번째 항목의 terms가 부족합니다.`);
  }

  const duplicateKeys = alias.keys.filter((key, keyIndex) => alias.keys.indexOf(key) !== keyIndex);
  if (duplicateKeys.length) {
    issues.push(`searchAliases.json ${index + 1}번째 항목에 중복 key가 있습니다: ${duplicateKeys.join(", ")}`);
  }
}

for (const keyword of highIntentKeywords) {
  const hasAlias = searchAliases.some((alias) => alias.keys.some((key) => compactSearchText(key) === compactSearchText(keyword)));

  if (!hasAlias) {
    issues.push(`${keyword}: 홈 추천 검색어가 searchAliases.json key와 연결되지 않았습니다.`);
  }
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
  writeFileSync(
    join(root, "SEARCH_REPORT.md"),
    `# 할인도사 Search Report

Generated: ${new Date().toISOString()}
Status: FAIL

## Summary

- 테스트 키워드 수: ${requiredSearches.length + searchAliases.length}
- 필수 통과 키워드 수: ${requiredSearches.length}
- 홈 추천 검색어 수: ${highIntentKeywords.length}
- 검색 alias 수: ${searchAliases.length}

## Issues

${issues.map((issue) => `- ${issue}`).join("\n")}
`,
    "utf8"
  );
  console.error("Search quality doctor failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

const searchRows = requiredSearches.map((item) => {
  const count = deals.filter((deal) => dealMatchesSearchText([deal.title, deal.mall, deal.category, ...deal.tags].join(" "), item.query)).length;
  return { query: item.query, count, minimum: item.minMatches };
});
const aliasRows = searchAliases.map((alias) => {
  const query = alias.keys[0] ?? "";
  const count = deals.filter((deal) => dealMatchesSearchText([deal.title, deal.mall, deal.category, ...deal.tags].join(" "), query)).length;
  return { query, count, terms: alias.terms.length };
});
const noResultAliasRows = aliasRows.filter((row) => row.count === 0);
const recentSearchImplemented = homePage.includes("recentSearchStorageKey") && homePage.includes("storeRecentSearchKeywords");
const noResultStateImplemented = homePage.includes("검색 결과 없음") || homePage.includes("조건에 맞는 특가");
const activeOnlyPolicy = homePage.includes("verifiedOnly") && mockDeals.includes("isExpired");

writeFileSync(
  join(root, "SEARCH_REPORT.md"),
  `# 할인도사 Search Report

Generated: ${new Date().toISOString()}
Status: PASS

## Summary

- 테스트 키워드 수: ${requiredSearches.length + aliasRows.length}
- 필수 통과 키워드 수: ${requiredSearches.length}
- 전체 alias 탐색 키워드 수: ${aliasRows.length}
- 홈 추천 검색어 수: ${highIntentKeywords.length}
- 검색 alias 수: ${searchAliases.length}
- 검색 범위: 상품명, 브랜드/쇼핑몰, 카테고리, 태그, 혜택 요약, 생활형 유사어, 띄어쓰기 차이
- 미노출 정책: 검증 링크 실패 상품은 기본 목록과 검색 기본 노출에서 제외한다.
- 결과 없음 화면: ${noResultStateImplemented ? "구현됨" : "확인 필요"}
- 최근 검색어 저장: ${recentSearchImplemented ? "localStorage 기반 구현됨" : "확인 필요"}
- active 상품 노출 정책: ${activeOnlyPolicy ? "검증/만료 상태 기반 필터 유지" : "확인 필요"}

## Required Keyword Results

| Query | Matches | Minimum |
| --- | ---: | ---: |
${searchRows.map((row) => `| ${row.query} | ${row.count} | ${row.minimum} |`).join("\n")}

## Alias Coverage Snapshot

| Query | Matches | Alias Terms |
| --- | ---: | ---: |
${aliasRows.map((row) => `| ${row.query} | ${row.count} | ${row.terms} |`).join("\n")}

## No-Result Alias Queries

${noResultAliasRows.length ? noResultAliasRows.map((row) => `- ${row.query}`).join("\n") : "- 없음"}
`,
  "utf8"
);

console.log("Search quality doctor passed.");
console.log(`- Search test keywords: ${requiredSearches.length + aliasRows.length}`);
console.log(`- High-intent home keywords: ${highIntentKeywords.length}`);
console.log(`- Search aliases: ${searchAliases.length}`);
for (const row of searchRows) console.log(`- ${row.query}: ${row.count} deals`);
