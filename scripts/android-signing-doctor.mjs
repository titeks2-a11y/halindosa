import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, normalize } from "node:path";

const root = process.cwd();

function fail(message) {
  console.error(`FAIL Android signing: ${message}`);
  process.exit(1);
}

function read(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) fail(`${path} is missing.`);
  return readFileSync(fullPath, "utf8");
}

function gitTrackedFiles() {
  try {
    return execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean)
      .map((file) => normalize(file).replace(/\\/g, "/"));
  } catch {
    return [];
  }
}

const buildGradle = read("android/app/build.gradle");
const gitignore = read(".gitignore");
const keystoreExample = read("android/keystore.properties.example");
const androidDoc = read("docs/ANDROID.md");
const releaseChecklist = read("docs/release-checklist.md");
const packet = read("docs/store-submission-packet.md");
const trackedFiles = gitTrackedFiles();

const requiredGradleSnippets = [
  "def keystoreProperties = new Properties()",
  "rootProject.file('keystore.properties')",
  "def hasReleaseKeystore = keystorePropertiesFile.exists()",
  "keystoreProperties.load(new FileInputStream(keystorePropertiesFile))",
  "signingConfigs",
  "release {",
  "storeFile file(keystoreProperties['storeFile'])",
  "storePassword keystoreProperties['storePassword']",
  "keyAlias keystoreProperties['keyAlias']",
  "keyPassword keystoreProperties['keyPassword']",
  "signingConfig signingConfigs.release",
  "versionCode 1",
  'versionName "1.0.0"'
];
const missingGradle = requiredGradleSnippets.filter((snippet) => !buildGradle.includes(snippet));
if (missingGradle.length) fail(`android/app/build.gradle signing setup is incomplete. Missing: ${missingGradle.join(", ")}`);

const requiredIgnores = ["android/keystore.properties", "*.jks", "*.keystore"];
const missingIgnores = requiredIgnores.filter((entry) => !gitignore.includes(entry));
if (missingIgnores.length) fail(`.gitignore should exclude local signing files. Missing: ${missingIgnores.join(", ")}`);

const requiredExampleFields = ["storeFile=", "storePassword=CHANGE_ME", "keyAlias=halindosa", "keyPassword=CHANGE_ME"];
const missingExample = requiredExampleFields.filter((snippet) => !keystoreExample.includes(snippet));
if (missingExample.length) fail(`android/keystore.properties.example is incomplete. Missing: ${missingExample.join(", ")}`);

const trackedSensitive = trackedFiles.filter((file) => {
  if (file === "android/keystore.properties.example") return false;
  return (
    file === "android/keystore.properties" ||
    /\.(jks|keystore|p12)$/i.test(file) ||
    /(^|\/)release\/.+\.(jks|keystore|p12)$/i.test(file)
  );
});
if (trackedSensitive.length) fail(`Tracked signing secret files found: ${trackedSensitive.join(", ")}`);

const requiredDocs = [
  "Build > Generate Signed Bundle / APK",
  "android/keystore.properties.example",
  "android/keystore.properties",
  "절대 커밋하지 않습니다",
  "signed AAB",
  "Play Console pre-launch report"
];
const docBody = [androidDoc, releaseChecklist, packet].join("\n");
const missingDocs = requiredDocs.filter((snippet) => !docBody.includes(snippet));
if (missingDocs.length) fail(`Signing docs/checklists should guide signed AAB release. Missing: ${missingDocs.join(", ")}`);

const localKeystore = existsSync(join(root, "android/keystore.properties"));
const localState = localKeystore
  ? "local android/keystore.properties exists; keep it private and verify bundleRelease before upload"
  : "local android/keystore.properties is absent; Android Studio signing wizard or private local file is still required for Play upload";

console.log(`PASS Android signing: Gradle release signing, ignore rules, example file, docs, and tracked secret scan are safe. ${localState}.`);
