import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceStarterPackCandidate = {
  id: string;
  label: string;
  provider: string;
  categories: string[];
  officialUrl: string;
  preferredEnvKeys: string[];
  integrationMethod?: string;
  liveStatus: string;
  liveReason?: string;
  httpStatus?: number | null;
  score: number;
  reasons: string[];
  feedConnectionAction: string;
  guardrail: string;
};

export type SourceStarterPackLane = {
  id: string;
  label: string;
  envKeys: string[];
  categories: string[];
  keywords: string[];
  audience?: string;
  optional?: boolean;
  candidateCount: number;
  reachableCount: number;
  guardedCount: number;
  firstAction: string;
  candidates: SourceStarterPackCandidate[];
};

export type SourceStarterPackReport = {
  ok: boolean;
  generatedAt: string;
  catalogCount: number;
  packs: SourceStarterPackLane[];
  summary: {
    totalCandidates: number;
    reachableCandidates: number;
    guardedCandidates: number;
    envKeys: string[];
  };
  issues: string[];
  envTemplate: string;
  vercelEnvCommands: string;
  githubActionsCommands: string;
};

const fallbackReport: SourceStarterPackReport = {
  ok: false,
  generatedAt: "",
  catalogCount: 0,
  packs: [],
  summary: {
    totalCandidates: 0,
    reachableCandidates: 0,
    guardedCandidates: 0,
    envKeys: []
  },
  issues: ["reports/free-benefit-feed-starter-pack.json 파일이 없습니다."],
  envTemplate: [
    "# 할인도사 무료혜택 운영 feed starter pack",
    "# npm run source:starter:pack 실행 후 다시 확인하세요.",
    "BENEFIT_REFRESH_FEED_URLS=",
    "PUBLIC_COUPON_FEED_URLS=",
    "OFFICIAL_EVENT_FEED_URLS=",
    "OPTIONAL_PUBLIC_BENEFIT_FEED_URLS="
  ].join("\n"),
  vercelEnvCommands: [
    "# 할인도사 Vercel 무료혜택 Feed Env 연결 명령서",
    "npx vercel env add BENEFIT_REFRESH_FEED_URLS production",
    "npx vercel env add PUBLIC_COUPON_FEED_URLS production",
    "npx vercel env add OFFICIAL_EVENT_FEED_URLS production",
    "npx vercel env add CRON_SECRET production"
  ].join("\n"),
  githubActionsCommands: [
    "# 할인도사 GitHub Actions 무료혜택 자동 갱신 연결 명령서",
    "gh secret set CRON_SECRET --repo titeks2-a11y/halindosa",
    "gh secret set HALINDOSA_CRON_SECRET --repo titeks2-a11y/halindosa",
    "gh variable set HALINDOSA_SITE_URL --repo titeks2-a11y/halindosa --body https://www.halindosa.com",
    "gh workflow run \"Benefit Refresh Scheduler\" --repo titeks2-a11y/halindosa"
  ].join("\n")
};

function readText(path: string, fallback: string) {
  if (!existsSync(path)) return fallback;
  try {
    return readFileSync(path, "utf8");
  } catch {
    return fallback;
  }
}

function buildVercelEnvCommands(envKeys: string[]) {
  const uniqueEnvKeys = Array.from(new Set(envKeys.map((key) => key.trim()).filter(Boolean))).sort();
  const requiredKeys = uniqueEnvKeys.filter((key) => key !== "OPTIONAL_PUBLIC_BENEFIT_FEED_URLS");
  const optionalKeys = uniqueEnvKeys.filter((key) => key === "OPTIONAL_PUBLIC_BENEFIT_FEED_URLS");
  const commandLines = requiredKeys.length
    ? requiredKeys.flatMap((key) => [`npx vercel env add ${key} production`, `npx vercel env add ${key} preview`])
    : [
        "npx vercel env add BENEFIT_REFRESH_FEED_URLS production",
        "npx vercel env add PUBLIC_COUPON_FEED_URLS production",
        "npx vercel env add OFFICIAL_EVENT_FEED_URLS production"
      ];

  return [
    "# 할인도사 Vercel 무료혜택 Feed Env 연결 명령서",
    "",
    "공식 API, RSS, Atom, 승인 파트너 JSON feed endpoint만 입력합니다.",
    "검색 결과 URL, 커뮤니티 글, 블로그, 쇼핑몰 메인, HTML 이벤트 랜딩만 있는 URL은 넣지 않습니다.",
    "",
    "```bash",
    "npx vercel env ls",
    ...commandLines,
    "npx vercel env add CRON_SECRET production",
    "npx vercel env add HALINDOSA_CRON_SECRET production",
    ...(optionalKeys.length ? optionalKeys.flatMap((key) => [`npx vercel env add ${key} production`, `npx vercel env add ${key} preview`]) : []),
    "npm run source:feed-env:doctor",
    "npm run news:feed:canary",
    "npm run refresh:benefits",
    "```"
  ].join("\n");
}

function buildGithubActionsCommands() {
  return [
    "# 할인도사 GitHub Actions 무료혜택 자동 갱신 연결 명령서",
    "",
    "`Benefit Refresh Scheduler`는 `CRON_SECRET` 또는 `HALINDOSA_CRON_SECRET`이 있어야 30분마다 운영 `/api/cron/benefits`를 호출합니다.",
    "",
    "```bash",
    "gh auth status",
    "gh secret set CRON_SECRET --repo titeks2-a11y/halindosa",
    "gh secret set HALINDOSA_CRON_SECRET --repo titeks2-a11y/halindosa",
    "gh variable set HALINDOSA_SITE_URL --repo titeks2-a11y/halindosa --body https://www.halindosa.com",
    "gh workflow run \"Benefit Refresh Scheduler\" --repo titeks2-a11y/halindosa",
    "gh run list --workflow \"Benefit Refresh Scheduler\" --repo titeks2-a11y/halindosa --limit 5",
    "curl -fsS https://www.halindosa.com/api/health",
    "curl -fsS \"https://www.halindosa.com/api/freebies?limit=5\"",
    "```",
    "",
    "GitHub secret에는 cron token만 넣고 공식 feed URL은 Vercel env에 넣습니다.",
    "검색 결과 URL, 커뮤니티 글, 블로그, 쇼핑몰 메인을 자동 갱신 feed로 쓰지 않습니다."
  ].join("\n");
}

export function getFreeBenefitSourceStarterPack(): SourceStarterPackReport {
  const reportPath = join(process.cwd(), "reports", "free-benefit-feed-starter-pack.json");
  const envPath = join(process.cwd(), "reports", "free-benefit-feed-starter-pack.env");
  const vercelCommandsPath = join(process.cwd(), "reports", "free-benefit-feed-vercel-env-commands.md");
  const githubActionsCommandsPath = join(process.cwd(), "reports", "free-benefit-feed-github-actions-commands.md");

  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<SourceStarterPackReport>;
    const summary = {
      ...fallbackReport.summary,
      ...(report.summary ?? {}),
      envKeys: Array.isArray(report.summary?.envKeys) ? report.summary.envKeys : []
    };

    return {
      ...fallbackReport,
      ...report,
      ok: report.ok === true,
      generatedAt: typeof report.generatedAt === "string" ? report.generatedAt : "",
      catalogCount: Number(report.catalogCount ?? 0),
      packs: Array.isArray(report.packs) ? report.packs : [],
      summary,
      issues: Array.isArray(report.issues) ? report.issues : [],
      envTemplate: readText(envPath, fallbackReport.envTemplate),
      vercelEnvCommands: readText(vercelCommandsPath, buildVercelEnvCommands(summary.envKeys)),
      githubActionsCommands: readText(githubActionsCommandsPath, buildGithubActionsCommands())
    };
  } catch {
    return {
      ...fallbackReport,
      issues: ["reports/free-benefit-feed-starter-pack.json 파싱에 실패했습니다."]
    };
  }
}
