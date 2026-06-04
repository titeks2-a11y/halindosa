import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fail, fileSize, pass, root } from "./release-doctor-harness.mjs";

export function checkSigningAndArtifacts() {
  const keystoreExample = "android/keystore.properties.example";
  const keystore = "android/keystore.properties";
  const aabCandidates = [
    "android/app/build/outputs/bundle/release/app-release.aab",
    "android/app/release/app-release.aab"
  ];
  const apk = "android/app/build/outputs/apk/debug/app-debug.apk";
  const signingDoctor = "scripts/android-signing-doctor.mjs";

  if (!existsSync(join(root, keystoreExample))) fail("keystore example", "Missing android/keystore.properties.example.");
  else pass("keystore example", "Example signing config is present.");

  if (!existsSync(join(root, signingDoctor))) {
    fail("Android signing doctor", "Missing scripts/android-signing-doctor.mjs.");
  } else {
    const signingDoctorBody = readFileSync(join(root, signingDoctor), "utf8");
    const requiredSigningDoctorSnippets = [
      "android/app/build.gradle signing setup is incomplete",
      "Tracked signing secret files found",
      "android/keystore.properties.example",
      "signingConfig signingConfigs.release",
      "storePassword=CHANGE_ME"
    ];
    const missingSigningDoctorSnippets = requiredSigningDoctorSnippets.filter((snippet) => !signingDoctorBody.includes(snippet));

    if (missingSigningDoctorSnippets.length) {
      fail("Android signing doctor", `Signing doctor should guard Gradle signing, examples, and tracked secrets. Missing: ${missingSigningDoctorSnippets.join(", ")}`);
    } else {
      pass("Android signing doctor", "Signing doctor guards Gradle release signing, local secret ignores, example file, docs, and tracked signing secrets.");
    }
  }

  if (!existsSync(join(root, keystore))) {
    pass("release keystore", "Not committed. Create android/keystore.properties locally or use Android Studio signing wizard.");
  } else {
    pass("release keystore", "Local keystore.properties exists. Keep it private.");
  }

  const releaseAab = aabCandidates.find((candidate) => fileSize(candidate) > 0);
  if (!releaseAab) fail("release AAB", "Run npm run android:bundle or Android Studio Generate Signed Bundle to create app-release.aab.");
  else pass("release AAB", `${releaseAab} (${fileSize(releaseAab)} bytes)`);

  if (fileSize(apk) <= 0) {
    pass("debug APK", "Not retained in clean workspaces. Run npm run android:debug only when device QA needs a fresh debug APK.");
  } else {
    pass("debug APK", `${apk} (${fileSize(apk)} bytes)`);
  }
}

export function checkStoreAssets() {
  const sourceAssets = ["assets/store/halindosa-logo-source.jpg", "scripts/generate-brand-assets.ps1"];
  const requiredPngAssets = [
    ["Play Store icon", "assets/store/play-store-icon-512.png", 512, 512],
    ["Play Store feature graphic", "assets/store/feature-graphic-1024x500.png", 1024, 500],
    ["PWA 192 icon", "public/halindosa-icon-192.png", 192, 192],
    ["PWA 512 icon", "public/halindosa-icon-512.png", 512, 512],
    ["iOS App Store icon", "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", 1024, 1024]
  ];
  const missingSource = sourceAssets.filter((file) => fileSize(file) <= 0);
  const issues = [];
  const assetGenerator = readFileSync(join(root, "scripts/generate-brand-assets.ps1"), "utf8");
  const androidColors = readFileSync(join(root, "android/app/src/main/res/values/colors.xml"), "utf8");
  const androidLauncherBackground = readFileSync(join(root, "android/app/src/main/res/values/ic_launcher_background.xml"), "utf8");

  if (!assetGenerator.includes("#FF173F") || !assetGenerator.includes("feature-graphic-1024x500.png") || !assetGenerator.includes("AppIcon-512@2x.png")) {
    issues.push("brand asset generator should create bright red store, PWA, Android, and iOS assets");
  }

  if (!androidColors.includes("#FF173F") || !androidColors.includes("#FF2A4F") || !androidLauncherBackground.includes("#FF173F")) {
    issues.push("Android icon and splash colors should use the bright V2 red tokens");
  }

  for (const [label, asset, width, height] of requiredPngAssets) {
    const fullPath = join(root, asset);

    if (!existsSync(fullPath)) {
      issues.push(`${label} missing: ${asset}`);
      continue;
    }

    try {
      const buffer = readFileSync(fullPath);
      const isPng = buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
      const actualWidth = isPng ? buffer.readUInt32BE(16) : 0;
      const actualHeight = isPng ? buffer.readUInt32BE(20) : 0;

      if (!isPng) issues.push(`${label} should be PNG: ${asset}`);
      else if (actualWidth !== width || actualHeight !== height) issues.push(`${label} expected ${width}x${height}, got ${actualWidth}x${actualHeight}`);
    } catch (error) {
      issues.push(`${label} unreadable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (missingSource.length || issues.length) fail("store assets", [...missingSource.map((file) => `Missing source: ${file}`), ...issues].join("; "));
  else pass("store assets", "Store icon, feature graphic, PWA, Android, and iOS assets have launch-ready dimensions and bright red generation support.");
}
