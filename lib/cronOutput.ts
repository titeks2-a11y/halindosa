const sensitiveEnvKeyPattern = /(SECRET|TOKEN|KEY|PASSWORD|SERVICE_ROLE|CLIENT_SECRET|ACCESS_KEY)/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sensitiveEnvValues(env: NodeJS.ProcessEnv = process.env) {
  return Object.entries(env)
    .filter(([key, value]) => sensitiveEnvKeyPattern.test(key) && typeof value === "string" && value.trim().length >= 8)
    .map(([, value]) => value!.trim());
}

export function redactSensitiveText(value: string, env: NodeJS.ProcessEnv = process.env) {
  let output = value;
  const workspaceRoot = process.cwd();
  const home = env.USERPROFILE || env.HOME || "";

  for (const secret of sensitiveEnvValues(env)) {
    output = output.replace(new RegExp(escapeRegExp(secret), "g"), "[redacted]");
  }

  if (workspaceRoot) {
    output = output.replace(new RegExp(escapeRegExp(workspaceRoot), "gi"), "[workspace]");
  }

  if (home && home !== workspaceRoot) {
    output = output.replace(new RegExp(escapeRegExp(home), "gi"), "[home]");
  }

  return output
    .replace(/([?&](?:token|secret|key|password|access_token|refresh_token)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/(authorization:\s*bearer\s+)[^\s]+/gi, "$1[redacted]")
    .replace(/(x-cron-secret:\s*)[^\s]+/gi, "$1[redacted]");
}

export function sanitizedProcessTail(value: string, maxLength = 4000) {
  const tail = value.length <= maxLength ? value : value.slice(value.length - maxLength);

  return redactSensitiveText(tail)
    .split(/\r?\n/)
    .filter((line) => !/^\s*at\s+\S+/.test(line))
    .filter((line) => !/\b(node:internal|webpack-internal:|\.next[\\/])/.test(line))
    .join("\n")
    .trim();
}
