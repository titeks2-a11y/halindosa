import { execFileSync } from "node:child_process";

const baseEnv = {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: "https://halindosa.com",
  NEXT_PUBLIC_AUTH_REDIRECT_URL: "https://halindosa.com/auth/callback",
  NEXT_PUBLIC_APP_SCHEME: "halindosa",
  NEXT_PUBLIC_SUPPORT_EMAIL: "help@halindosa.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://halindosa.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  DEAL_DATA_MODE: "hybrid",
  ADMIN_EXPORT_TOKEN: "test-admin-token",
  TRACKING_SALT: "test-tracking-salt"
};

const cases = [
  {
    name: "production accepts public https same-origin callback",
    env: {},
    shouldPass: true,
    expected: "Required production keys configured: 9/9"
  },
  {
    name: "production rejects localhost site url",
    env: {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_AUTH_REDIRECT_URL: "http://localhost:3000/auth/callback"
    },
    shouldPass: false,
    expected: "NEXT_PUBLIC_SITE_URL"
  },
  {
    name: "production rejects mismatched auth callback origin",
    env: {
      NEXT_PUBLIC_AUTH_REDIRECT_URL: "https://auth.halindosa.com/auth/callback"
    },
    shouldPass: false,
    expected: "NEXT_PUBLIC_AUTH_REDIRECT_URL"
  },
  {
    name: "production rejects unsafe app scheme",
    env: {
      NEXT_PUBLIC_APP_SCHEME: "javascript"
    },
    shouldPass: false,
    expected: "NEXT_PUBLIC_APP_SCHEME"
  }
];

function runCase(testCase) {
  const env = { ...baseEnv, ...testCase.env };

  try {
    const output = execFileSync("node", ["scripts/env-doctor.mjs", "--strict", "--production"], {
      encoding: "utf8",
      env
    });

    if (!testCase.shouldPass) {
      throw new Error(`expected failure but command passed.\n${output}`);
    }
    if (!output.includes(testCase.expected)) {
      throw new Error(`expected output to include "${testCase.expected}".\n${output}`);
    }
    console.log(`PASS env doctor test: ${testCase.name}`);
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    if (testCase.shouldPass) {
      throw new Error(`expected success but command failed.\n${output}`);
    }
    if (!output.includes(testCase.expected)) {
      throw new Error(`expected failure output to include "${testCase.expected}".\n${output}`);
    }
    console.log(`PASS env doctor test: ${testCase.name}`);
  }
}

for (const testCase of cases) runCase(testCase);

console.log(`Environment doctor tests passed: ${cases.length}/${cases.length}`);
