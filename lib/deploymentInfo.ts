export function getDeploymentInfo() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    "local";
  const branch =
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ||
    process.env.GITHUB_REF_NAME ||
    "local";

  return {
    provider: process.env.VERCEL ? "vercel" : "local",
    environment: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_APP_ENV || "local",
    commit,
    shortCommit: commit === "local" ? "local" : commit.slice(0, 8),
    branch,
    url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""
  };
}
