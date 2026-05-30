import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function pass(name, detail = "") {
  checks.push({ name, ok: true, detail });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

async function text(path) {
  return readFile(join(root, path), "utf8");
}

function fileSize(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? statSync(fullPath).size : 0;
}

async function checkPackage() {
  const pkg = JSON.parse(await text("package.json"));
  const requiredScripts = [
    "build",
    "build:android",
    "cap:sync",
    "cap:sync:ios",
    "cap:open",
    "cap:open:ios",
    "android:doctor",
    "android:debug",
    "android:bundle",
    "qa:release"
  ];
  const missing = requiredScripts.filter((script) => !pkg.scripts?.[script]);

  if (missing.length) fail("package scripts", `Missing scripts: ${missing.join(", ")}`);
  else pass("package scripts", "Android and iOS release command flow is available.");

  if (!pkg.dependencies?.["@capacitor/ios"]) fail("Capacitor iOS dependency", "Missing @capacitor/ios.");
  else pass("Capacitor iOS dependency", pkg.dependencies["@capacitor/ios"]);
}

async function checkCapacitor() {
  const config = await text("capacitor.config.ts");

  if (!config.includes("appId: 'com.halindosa.app'")) fail("capacitor appId", "Expected com.halindosa.app.");
  else pass("capacitor appId", "com.halindosa.app");

  if (!config.includes("appName: '할인도사'")) fail("capacitor appName", "Expected 할인도사.");
  else pass("capacitor appName", "할인도사");

  if (!config.includes("webDir: 'out'")) fail("capacitor webDir", "Expected out.");
  else pass("capacitor webDir", "out");
}

async function checkAndroid() {
  const gradle = await text("android/app/build.gradle");
  const strings = await text("android/app/src/main/res/values/strings.xml");
  const manifest = await text("android/app/src/main/AndroidManifest.xml");

  if (!gradle.includes('applicationId "com.halindosa.app"')) fail("Android applicationId", "Expected com.halindosa.app.");
  else pass("Android applicationId", "com.halindosa.app");

  if (!gradle.includes("versionCode 1")) fail("Android versionCode", "Expected versionCode 1.");
  else pass("Android versionCode", "1");

  if (!gradle.includes('versionName "1.0.0"')) fail("Android versionName", "Expected versionName 1.0.0.");
  else pass("Android versionName", "1.0.0");

  if (!strings.includes("<string name=\"app_name\">할인도사</string>")) fail("Android app label", "Expected 할인도사 app_name.");
  else pass("Android app label", "할인도사");

  const hasInternet = manifest.includes("android.permission.INTERNET");
  const forbiddenPermissions = ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "CAMERA", "RECORD_AUDIO", "READ_CONTACTS"].filter((permission) =>
    manifest.includes(permission)
  );

  if (!hasInternet) fail("Android permissions", "INTERNET permission is required for external pages.");
  else if (forbiddenPermissions.length) fail("Android permissions", `Unexpected permissions: ${forbiddenPermissions.join(", ")}`);
  else pass("Android permissions", "Only expected network permission found.");

  const iconFiles = [
    "android/app/src/main/res/mipmap-mdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-hdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"
  ];
  const missingIcons = iconFiles.filter((file) => !existsSync(join(root, file)));
  if (missingIcons.length) fail("Android icons", `Missing: ${missingIcons.join(", ")}`);
  else pass("Android icons", "Launcher icon densities are present.");

  if (!existsSync(join(root, "android/app/src/main/res/drawable/splash.png"))) fail("Android splash", "Missing drawable/splash.png.");
  else pass("Android splash", "Splash image exists.");
}

async function checkIos() {
  const project = "ios/App/App.xcodeproj/project.pbxproj";
  const plist = "ios/App/App/Info.plist";
  const icon = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png";
  const splash = "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png";

  if (!existsSync(join(root, project))) {
    fail("iOS project", "Run npx cap add ios on a machine with Capacitor iOS support.");
    return;
  }
  pass("iOS project", "ios/App is present.");

  if (!existsSync(join(root, plist))) {
    fail("iOS Info.plist", "Missing ios/App/App/Info.plist.");
    return;
  }

  const pbx = await text(project);
  const info = await text(plist);

  if (!pbx.includes("PRODUCT_BUNDLE_IDENTIFIER = com.halindosa.app;")) fail("iOS bundle identifier", "Expected com.halindosa.app.");
  else pass("iOS bundle identifier", "com.halindosa.app");

  if (!pbx.includes("CURRENT_PROJECT_VERSION = 1;")) fail("iOS build number", "Expected CURRENT_PROJECT_VERSION 1.");
  else pass("iOS build number", "1");

  if (!pbx.includes("MARKETING_VERSION = 1.0.0;")) fail("iOS version", "Expected MARKETING_VERSION 1.0.0.");
  else pass("iOS version", "1.0.0");

  if (!info.includes("<string>할인도사</string>")) fail("iOS display name", "Expected 할인도사.");
  else pass("iOS display name", "할인도사");

  if (fileSize(icon) <= 0) fail("iOS app icon", "Missing AppIcon-512@2x.png.");
  else pass("iOS app icon", "App Store icon asset is present.");

  if (fileSize(splash) <= 0) fail("iOS splash", "Missing Splash.imageset splash image.");
  else pass("iOS splash", "Splash image asset is present.");

  const restrictedPrivacyKeys = [
    "NSUserTrackingUsageDescription",
    "NSCameraUsageDescription",
    "NSMicrophoneUsageDescription",
    "NSLocationWhenInUseUsageDescription",
    "NSLocationAlwaysAndWhenInUseUsageDescription",
    "NSContactsUsageDescription",
    "NSPhotoLibraryUsageDescription"
  ].filter((key) => info.includes(key));

  if (restrictedPrivacyKeys.length) fail("iOS privacy permissions", `Unexpected keys: ${restrictedPrivacyKeys.join(", ")}`);
  else pass("iOS privacy permissions", "No tracking, camera, microphone, location, contacts, or photo permissions declared.");
}

async function checkPolicyAndStoreDocs() {
  const requiredFiles = [
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "app/guide/page.tsx",
    "docs/play-store-listing.md",
    "docs/release-checklist.md",
    "docs/privacy-policy-draft.md",
    "docs/terms-draft.md",
    "docs/data-safety-guide.md",
    "docs/content-rating-guide.md",
    "docs/test-plan.md",
    "docs/roadmap.md",
    "docs/store-assets-guide.md",
    "docs/admin-system-design.md",
    "docs/monetization.md",
    "docs/push-notification-design.md",
    "docs/seo-strategy.md",
    "docs/competitor-analysis.md",
    "docs/analytics-plan.md",
    "docs/data-source-runbook.md",
    "docs/app-store-checklist.md",
    "docs/launch-day-checklist.md",
    "docs/weekly-operation-guide.md",
    "docs/customer-support-guide.md",
    "docs/v1-1-roadmap.md"
  ];
  const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

  if (missing.length) fail("policy and store docs", `Missing: ${missing.join(", ")}`);
  else pass("policy and store docs", "Required policy/listing drafts are present.");
}

function checkSigningAndArtifacts() {
  const keystoreExample = "android/keystore.properties.example";
  const keystore = "android/keystore.properties";
  const aab = "android/app/build/outputs/bundle/release/app-release.aab";
  const apk = "android/app/build/outputs/apk/debug/app-debug.apk";

  if (!existsSync(join(root, keystoreExample))) fail("keystore example", "Missing android/keystore.properties.example.");
  else pass("keystore example", "Example signing config is present.");

  if (!existsSync(join(root, keystore))) {
    pass("release keystore", "Not committed. Create android/keystore.properties locally or use Android Studio signing wizard.");
  } else {
    pass("release keystore", "Local keystore.properties exists. Keep it private.");
  }

  if (fileSize(aab) <= 0) fail("release AAB", "Run npm run android:bundle to generate app-release.aab.");
  else pass("release AAB", `${aab} (${fileSize(aab)} bytes)`);

  if (fileSize(apk) <= 0) fail("debug APK", "Run npm run android:debug to generate app-debug.apk.");
  else pass("debug APK", `${apk} (${fileSize(apk)} bytes)`);
}

function checkStoreAssets() {
  const assets = [
    "assets/store/halindosa-logo-source.jpg",
    "assets/store/play-store-icon-512.png",
    "assets/store/feature-graphic-1024x500.png"
  ];
  const missing = assets.filter((file) => fileSize(file) <= 0);

  if (missing.length) fail("store assets", `Missing: ${missing.join(", ")}`);
  else pass("store assets", "Play Store icon source and feature graphic drafts are present.");
}

await checkPackage();
await checkCapacitor();
await checkAndroid();
await checkIos();
await checkPolicyAndStoreDocs();
checkSigningAndArtifacts();
checkStoreAssets();

for (const check of checks) {
  const prefix = check.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

const failures = checks.filter((check) => !check.ok);

if (failures.length) {
  console.error(`Release doctor failed: ${failures.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Release doctor passed: ${checks.length}/${checks.length}`);
