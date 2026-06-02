import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const scanRoots = ["app", "components", "lib"];
const issues = [];
const warnings = [];
const stats = {
  filesScanned: 0,
  targetBlankLinks: 0,
  goLinks: 0,
  windowOpenCalls: 0,
  browserOpenCalls: 0
};

function walk(dir) {
  const fullDir = join(root, dir);
  const entries = readdirSync(fullDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = join(dir, entry.name);
    const fullPath = join(root, relativePath);
    if (entry.isDirectory()) {
      files.push(...walk(relativePath));
      continue;
    }

    if (entry.isFile() && /\.(tsx|ts|mjs|js)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function addIssue(file, message) {
  issues.push(`${file.replace(root, "").replace(/^[/\\]/, "")}: ${message}`);
}

function hasSafeRel(snippet) {
  const relMatch = snippet.match(/rel\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\}|\{"([^"]+)"\})/);
  const value = [relMatch?.[1], relMatch?.[2], relMatch?.[3], relMatch?.[4]].filter(Boolean).join(" ");
  return /\bnoopener\b/.test(value) && /\bnoreferrer\b/.test(value);
}

function inspectFile(file) {
  const source = readFileSync(file, "utf8");
  stats.filesScanned += 1;

  const forbiddenHrefPatterns = [
    { pattern: /href\s*=\s*["']#["']/g, label: 'href="#"는 화면 스크롤 이동 버그를 만들 수 있습니다.' },
    { pattern: /href\s*=\s*["']\s*["']/g, label: "빈 href는 외부 이동 CTA에 사용할 수 없습니다." },
    { pattern: /href\s*=\s*["']javascript:/gi, label: "javascript: href는 보안상 허용하지 않습니다." }
  ];

  for (const { pattern, label } of forbiddenHrefPatterns) {
    if (pattern.test(source)) addIssue(file, label);
  }

  const targetMatches = [...source.matchAll(/target\s*=\s*["']_blank["']/g)];
  stats.targetBlankLinks += targetMatches.length;
  for (const match of targetMatches) {
    const snippet = source.slice(Math.max(0, match.index - 260), Math.min(source.length, match.index + 260));
    if (!hasSafeRel(snippet)) {
      addIssue(file, 'target="_blank" 링크에는 rel="noopener noreferrer"가 필요합니다.');
    }
  }

  const goMatches = [...source.matchAll(/href\s*=\s*(?:\{`\/go\/|["']\/go\/)/g)];
  stats.goLinks += goMatches.length;
  for (const match of goMatches) {
    const snippet = source.slice(Math.max(0, match.index - 260), Math.min(source.length, match.index + 320));
    if (!/target\s*=\s*["']_blank["']/.test(snippet)) {
      addIssue(file, "/go 구매 이동 링크는 새 탭으로 열려야 합니다.");
    }
    if (!hasSafeRel(snippet)) {
      addIssue(file, "/go 구매 이동 링크에는 noopener noreferrer가 필요합니다.");
    }
  }

  const windowOpenMatches = [...source.matchAll(/window\.open\s*\(([\s\S]*?)\)/g)];
  stats.windowOpenCalls += windowOpenMatches.length;
  for (const match of windowOpenMatches) {
    const call = match[0];
    if (!/"_blank"|'_blank'/.test(call)) {
      addIssue(file, "window.open은 외부 구매 이동 시 _blank를 사용해야 합니다.");
    }
    if (!/noopener,noreferrer|noopener noreferrer/.test(call)) {
      addIssue(file, "window.open은 noopener,noreferrer 옵션을 포함해야 합니다.");
    }
  }

  const browserOpenMatches = [...source.matchAll(/Browser\.open\s*\(/g)];
  stats.browserOpenCalls += browserOpenMatches.length;
}

for (const dir of scanRoots) {
  if (statSync(join(root, dir), { throwIfNoEntry: false })) {
    for (const file of walk(dir)) inspectFile(file);
  }
}

if (stats.goLinks === 0 && stats.windowOpenCalls === 0 && stats.browserOpenCalls === 0) {
  warnings.push("구매 이동 경로를 확인할 수 있는 /go, window.open, Browser.open 호출이 없습니다.");
}

const report = `# 할인도사 External Link Safety Report

Generated: ${new Date().toISOString()}
Status: ${issues.length ? "FAIL" : "PASS"}

## Summary

| Metric | Value |
| --- | ---: |
| 검사 파일 수 | ${stats.filesScanned} |
| 새 탭 링크 수 | ${stats.targetBlankLinks} |
| /go 구매 링크 수 | ${stats.goLinks} |
| window.open 호출 수 | ${stats.windowOpenCalls} |
| Capacitor Browser 호출 수 | ${stats.browserOpenCalls} |

## Policy

- 상품 상세, 구매 CTA, 외부 이동은 새 탭 또는 앱 외부 브라우저로 열립니다.
- 새 탭 링크는 opener 접근을 막기 위해 noopener noreferrer를 사용합니다.
- href="#", 빈 href, javascript: 링크는 허용하지 않습니다.

## Issues

${issues.length ? issues.map((issue) => `- ${issue}`).join("\n") : "- 외부 링크 정책 위반 없음"}

## Warnings

${warnings.length ? warnings.map((warning) => `- ${warning}`).join("\n") : "- 경고 없음"}
`;

writeFileSync(join(root, "EXTERNAL_LINK_REPORT.md"), report, "utf8");

if (issues.length) {
  console.error("External link safety test failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`External link safety passed: ${stats.filesScanned} files scanned, ${stats.targetBlankLinks} target=_blank links.`);
