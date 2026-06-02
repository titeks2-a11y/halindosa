import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const docsDir = join(root, "docs");
const sceneSource = readFileSync(join(root, "data", "storeScreenshotScenes.ts"), "utf8");

if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

const sceneBlocks = [...sceneSource.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?\n  \}/g)].map((match) => match[0]);
const scenes = sceneBlocks.map((block, index) => {
  const id = block.match(/id:\s*"([^"]+)"/)?.[1] ?? `scene-${index + 1}`;
  const title = block.match(/title:\s*"([^"]+)"/)?.[1] ?? id;
  const route = block.match(/route:\s*"([^"]+)"/)?.[1] ?? "/";
  const caption = block.match(/caption:\s*"([^"]+)"/)?.[1] ?? "";
  const focus = [...block.matchAll(/focus:\s*\[([\s\S]*?)\]/g)][0]?.[1]
    ?.match(/"([^"]+)"/g)
    ?.map((value) => value.replaceAll('"', "")) ?? [];
  const checklist = [...block.matchAll(/checklist:\s*\[([\s\S]*?)\]/g)][0]?.[1]
    ?.match(/"([^"]+)"/g)
    ?.map((value) => value.replaceAll('"', "")) ?? [];

  return {
    order: index + 1,
    id,
    title,
    route,
    caption,
    focus,
    checklist,
    playFileName: `${String(index + 1).padStart(2, "0")}-${id}-play-1080x1920.png`,
    appStoreFileName: `${String(index + 1).padStart(2, "0")}-${id}-appstore-1290x2796.png`
  };
});

const viewports = [
  {
    platform: "Play Store phone",
    width: 1080,
    height: 1920,
    note: "Android Emulator 또는 실제 기기에서 세로 화면으로 촬영"
  },
  {
    platform: "App Store iPhone 6.7",
    width: 1290,
    height: 2796,
    note: "iPhone 15 Pro Max 계열 Simulator 또는 실제 기기 기준"
  }
];

const manifest = {
  generatedBy: "npm run store:screenshots:manifest",
  previewBoard: "/store-preview",
  destinationDirectory: "assets/store/screenshots",
  requiredScenes: scenes.length,
  viewports,
  scenes,
  safetyChecklist: [
    "외부 판매처 결제, 장바구니, 주문, 주소, 결제 화면을 포함하지 않는다.",
    "실제 사용자 이메일, 프로필, 비밀번호, OAuth secret, .env, keystore, admin token을 포함하지 않는다.",
    "무조건, 100%, 최저가 보장, 공식 판매처 보장 같은 심사 리스크 문구를 포함하지 않는다.",
    "하단 탭, safe area, 검색 chip, 가격, CTA가 잘리지 않는지 확인한다.",
    "Play/App Store 등록 문구와 스크린샷 문구가 서로 모순되지 않는지 확인한다."
  ]
};

const markdown = `# Store Screenshot Capture Manifest

Generated: npm run store:screenshots:manifest

This manifest turns the screenshot storyboard into concrete capture targets and file names. It is safe to commit because it contains no screenshots, credentials, account data, or store-console state.

## Capture Board

- Preview board: \`/store-preview\`
- Destination directory: \`assets/store/screenshots\`
- Required scenes: ${scenes.length}

## Required Viewports

| Platform | Width | Height | Note |
| --- | ---: | ---: | --- |
${viewports.map((item) => `| ${item.platform} | ${item.width} | ${item.height} | ${item.note} |`).join("\n")}

## Scene File Names

| Order | Scene | Route | Play Store file | App Store file |
| ---: | --- | --- | --- | --- |
${scenes.map((scene) => `| ${scene.order} | ${scene.title} | \`${scene.route}\` | \`${scene.playFileName}\` | \`${scene.appStoreFileName}\` |`).join("\n")}

## Per-scene Checklist

${scenes.map((scene) => `### ${scene.order}. ${scene.title}

- Route: \`${scene.route}\`
- Caption: ${scene.caption}
- Focus: ${scene.focus.join(", ")}
- Checklist: ${scene.checklist.join(" / ")}
`).join("\n")}

## Safety Checklist

${manifest.safetyChecklist.map((item) => `- ${item}`).join("\n")}

## Manual Work That Must Not Be Faked

- This manifest does not prove screenshots were captured or uploaded.
- Capture final screenshots only after the release build, public policy URLs, and store listing copy are settled.
- Review every uploaded screenshot in Play Console and App Store Connect before submission.
`;

writeFileSync(join(root, "STORE_SCREENSHOT_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "STORE_SCREENSHOT_MANIFEST.md"), markdown, "utf8");

console.log(`Store screenshot manifest written: ${scenes.length} scenes, ${viewports.length} viewport targets.`);
