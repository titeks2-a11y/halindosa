import { spawn } from "node:child_process";

const args = new Set(process.argv.slice(2));
const isRelease = args.has("--release");
const shouldList = args.has("--list");

const coreTasks = [
  "lint",
  "admin:auth:doctor",
  "verify:links",
  "verify:products",
  "link:policy:regression",
  "refresh:deals",
  "refresh:news",
  "news:images:enrich",
  "refresh:freebies",
  "refresh:events",
  "refresh:benefits",
  "verify:news",
  "verify:freebies",
  "verify:benefits",
  "news:freshness:doctor",
  "news:revalidation:report",
  "news:feed:doctor",
  "news:feed:canary",
  "test:news-feed-errors",
  "test:news-feed-dry-run",
  "news:preview",
  "refresh:all",
  "verify:links:live",
  "verify:products",
  "link:policy:regression",
  "exposure:doctor",
  "surface:publishable:doctor",
  "link:launch:gate",
  "link:revalidation:report",
  "live:probe:review",
  "feed:transition:report",
  "source:catalog:report",
  "source:breadth:doctor",
  "source:live:doctor",
  "source:onboarding:plan",
  "source:feed-env:doctor",
  "source:readiness:report",
  "news:feed:live",
  "cron:refresh:doctor",
  "push:readiness:report",
  "push:delivery:doctor",
  "push:delivery:audit",
  "official:alerts:report",
  "health:readiness",
  "daily:operations:report",
  "test:external-links",
  "test:images",
  "verify:images",
  "image:backlog:report",
  "image:operations:doctor",
  "catalog:doctor",
  "search:doctor",
  "test:ui",
  "test:mobile-ux",
  "test:mobile-compact",
  "test:home-realtime",
  "test:seo",
  "test:perf",
  "security:check",
  "purchase:navigation:doctor",
  "detail:navigation:doctor",
  "navigation:doctor",
  "home:url-state:doctor",
  "home:list-scan:doctor",
  "home:realtime:doctor",
  "smoke:local",
  "surface:publishable:doctor",
  "link:revalidation:report",
  "live:probe:review",
  "build",
  "release:doctor"
];

const releaseTasks = [
  "health:readiness",
  "audit:commercial",
  "test:env",
  "device:qa:manifest",
  "device:qa:doctor",
  "device:qa:report",
  "android:signing:doctor",
  "public:url:doctor",
  "feed:validate",
  "feed:production:doctor",
  "build:android",
  "cap:sync",
  "cap:sync:ios",
  "store:metadata:doctor",
  "store:submission:report",
  "store:packet:doctor",
  "store:console:fields",
  "store:manual:checklist",
  "store:manual:doctor",
  "store:handoff:report",
  "release:notes",
  "support:playbook",
  "known:issues",
  "store:assets:doctor",
  "store:screenshots:manifest",
  "store:screenshots:doctor",
  "perf:budget",
  "release:doctor"
];

const tasks = isRelease ? [...coreTasks, ...releaseTasks] : coreTasks;

if (shouldList) {
  console.log(tasks.join("\n"));
  process.exit(0);
}

function runTask(taskName, index) {
  const isWindows = process.platform === "win32";
  const command = isWindows ? process.env.ComSpec || "cmd.exe" : "npm";
  const commandArgs = isWindows ? ["/d", "/s", "/c", "npm", "run", taskName] : ["run", taskName];
  console.log(`\n[${index + 1}/${tasks.length}] npm run ${taskName}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`npm run ${taskName} failed with exit code ${code}`));
    });
  });
}

for (const [index, taskName] of tasks.entries()) {
  await runTask(taskName, index);
}

console.log(`\nQA ${isRelease ? "release " : ""}pipeline passed: ${tasks.length}/${tasks.length} tasks.`);
