import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const startedAt = new Date();

const steps = [
  ["lint", ["run", "lint"]],
  ["build", ["run", "build"]],
  ["verify:links", ["run", "verify:links", "--", "--no-body"]],
  ["test:external-links", ["run", "test:external-links"]],
  ["test:images", ["run", "test:images"]],
  ["news:images:enrich", ["run", "news:images:enrich"]],
  ["verify:images", ["run", "verify:images"]],
  ["image:operations:doctor", ["run", "image:operations:doctor"]],
  ["test:search", ["run", "test:search"]],
  ["test:ui", ["run", "test:ui"]],
  ["test:mobile-ux", ["run", "test:mobile-ux"]],
  ["test:mobile-compact", ["run", "test:mobile-compact"]],
  ["home:realtime:doctor", ["run", "home:realtime:doctor"]],
  ["test:home-realtime", ["run", "test:home-realtime"]],
  ["test:seo", ["run", "test:seo"]],
  ["test:perf", ["run", "test:perf"]],
  ["smoke:local", ["run", "smoke:local"]],
  ["release:doctor", ["run", "release:doctor"]]
];
const defaultStepTimeoutMs = 180_000;
const stepTimeouts = new Map([
  ["build", 300_000],
  ["verify:links", 300_000],
  ["smoke:local", 240_000],
  ["release:doctor", 180_000]
]);

const results = [];

function runStep(name, args) {
  const stepStartedAt = Date.now();
  const command = `npm ${args.join(" ")}`;
  try {
    const output = execFileSync(command, {
      cwd: root,
      encoding: "utf8",
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: stepTimeouts.get(name) ?? defaultStepTimeoutMs,
      env: {
        ...process.env,
        DEAL_LINK_TIMEOUT_MS: process.env.DEAL_LINK_TIMEOUT_MS ?? "2500"
      }
    });
    results.push({
      name,
      ok: true,
      durationMs: Date.now() - stepStartedAt,
      output: output.trim()
    });
    console.log(`PASS ${name}`);
  } catch (error) {
    const timedOut = error.signal === "SIGTERM" || /ETIMEDOUT|timed out/i.test(String(error.message ?? ""));
    const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}\n${timedOut ? `Step timed out after ${stepTimeouts.get(name) ?? defaultStepTimeoutMs}ms.` : ""}`.trim();
    results.push({
      name,
      ok: false,
      durationMs: Date.now() - stepStartedAt,
      output
    });
    console.error(`FAIL ${name}`);
    writeReport();
    process.exit(error.status || 1);
  }
}

function writeReport() {
  mkdirSync(join(root, "docs"), { recursive: true });
  const finishedAt = new Date();
  const failed = results.filter((result) => !result.ok);
  const report = `# 할인도사 Harness Report

Started: ${startedAt.toISOString()}
Finished: ${finishedAt.toISOString()}
Status: ${failed.length ? "FAIL" : "PASS"}

## Summary

| Step | Result | Duration |
| --- | --- | ---: |
${results.map((result) => `| ${result.name} | ${result.ok ? "PASS" : "FAIL"} | ${(result.durationMs / 1000).toFixed(1)}s |`).join("\n")}

## Step Output

${results.map((result) => `### ${result.name}

\`\`\`text
${result.output.slice(-6000) || "(no output)"}
\`\`\`
`).join("\n")}

## Policy

- 검증된 구매 링크만 기본 노출합니다.
- 구매 이동은 내부 /go 라우트를 거쳐 새 탭으로 열리게 유지합니다.
- 외부 링크는 opener 접근을 막고, 앱 화면을 덮지 않도록 새 탭/외부 브라우저 정책을 검사합니다.
- 상품 이미지는 고정 비율, lazy loading, fallback 정책을 검사합니다.
- 하단 탭은 홈, 인기, 카테고리, 마이 4개만 유지합니다.
- 모바일 첫 화면은 검색, compact 필터, 핵심 특가 리스트를 우선합니다.
`;

  writeFileSync(join(root, "docs", "HARNESS_REPORT.md"), report, "utf8");
  writeFileSync(join(root, "HARNESS_REPORT.md"), report, "utf8");
}

for (const [name, args] of steps) {
  runStep(name, args);
}

writeReport();
console.log("Harness completed successfully.");
