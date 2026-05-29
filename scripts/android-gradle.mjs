import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const task = process.argv[2] ?? "assembleDebug";
const cwd = process.cwd();
const androidDir = join(cwd, "android");
const defaultStudioJbr = "C:\\Program Files\\Android\\Android Studio\\jbr";
const defaultSdk = process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "Android", "Sdk") : "";

function findJavaHome() {
  const candidates = [
    process.env.JAVA_HOME,
    process.env.STUDIO_JDK,
    defaultStudioJbr
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(join(candidate, "bin", "java.exe"))) ?? "";
}

function findAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    defaultSdk
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) ?? "";
}

const javaHome = findJavaHome();
const androidSdk = findAndroidSdk();

if (!existsSync(androidDir)) {
  console.error("android folder was not found. Run `npx cap add android` first.");
  process.exit(1);
}

if (!javaHome) {
  console.error("No Java runtime found. Install Android Studio or set JAVA_HOME to a JDK path.");
  console.error(`Tried: ${defaultStudioJbr}`);
  process.exit(1);
}

if (!androidSdk) {
  console.error("No Android SDK found. Open Android Studio > SDK Manager and install an SDK.");
  process.exit(1);
}

console.log(`Using JAVA_HOME=${javaHome}`);
console.log(`Using ANDROID_HOME=${androidSdk}`);

if (task === "doctor") {
  const java = spawnSync(join(javaHome, "bin", "java.exe"), ["-version"], {
    env: process.env,
    stdio: "inherit"
  });
  process.exit(java.status ?? 0);
}

const gradlew = join(androidDir, process.platform === "win32" ? "gradlew.bat" : "gradlew");
const gradleCommand = process.platform === "win32" ? "cmd.exe" : gradlew;
const gradleArgs = process.platform === "win32" ? ["/c", gradlew, task] : [task];
const result = spawnSync(gradleCommand, gradleArgs, {
  env: {
    ...process.env,
    JAVA_HOME: javaHome,
    ANDROID_HOME: androidSdk,
    ANDROID_SDK_ROOT: androidSdk,
    Path: `${join(javaHome, "bin")};${process.env.Path ?? process.env.PATH ?? ""}`
  },
  cwd: androidDir,
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
