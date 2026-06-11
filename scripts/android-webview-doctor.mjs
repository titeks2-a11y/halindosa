import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reportPath = join(root, 'reports', 'android-webview-doctor.json');

const checks = [];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function check(name, passed, detail) {
  checks.push({
    name,
    passed,
    detail
  });
}

const capacitorConfig = read('capacitor.config.ts');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const configXml = read('android/app/src/main/res/xml/config.xml');
const packageJson = read('package.json');
const envExample = read('.env.example');
const hasNetworkSecurityConfig = existsSync(join(root, 'android/app/src/main/res/xml/network_security_config.xml'));
const hasOfflinePage = existsSync(join(root, 'public/offline.html'));

check('Capacitor production URL', capacitorConfig.includes("defaultAppWebUrl = 'https://www.halindosa.com'"), 'Default app WebView URL should be the production Vercel domain.');
check('Capacitor server URL enabled', capacitorConfig.includes('server:') && capacitorConfig.includes('url: appWeb.origin'), 'Capacitor should load the configured remote web app.');
check('Capacitor fallback webDir kept', capacitorConfig.includes("webDir: 'out'"), 'Static export should remain as a local fallback build artifact.');
check('Capacitor navigation allowlist', capacitorConfig.includes("'halindosa.com'") && capacitorConfig.includes("'www.halindosa.com'"), 'Only Halindosa domains should be allowed as app navigation origins.');
check('Capacitor error fallback', capacitorConfig.includes("errorPath: 'offline.html'") && hasOfflinePage, 'A local offline page should be available when the remote app cannot load.');
check('Production cleartext disabled by default', capacitorConfig.includes('cleartext: appWeb.isLocalDev'), 'Cleartext traffic should only be enabled for local emulator testing.');
check('Environment example WebView URL', envExample.includes('APP_WEB_URL=https://www.halindosa.com') && envExample.includes('CAPACITOR_SERVER_URL=https://www.halindosa.com'), 'WebView URL environment examples should be documented.');
check('Android INTERNET permission', manifest.includes('android.permission.INTERNET'), 'Remote WebView requires INTERNET permission.');
check('Android cleartext disabled', manifest.includes('android:usesCleartextTraffic="false"'), 'Production Android manifest should reject cleartext traffic.');
check('Android network security config', manifest.includes('android:networkSecurityConfig="@xml/network_security_config"') && hasNetworkSecurityConfig, 'Android should enforce HTTPS through network security config.');
check('Android config.xml no wildcard access', !configXml.includes('<access origin="*"'), 'Cordova/Capacitor access wildcard should not be used in production.');
check('Android config.xml Halindosa access', configXml.includes('https://halindosa.com') && configXml.includes('https://www.halindosa.com'), 'config.xml should include only Halindosa HTTPS origins.');
check('Package script registered', packageJson.includes('"android:webview:doctor"'), 'package.json should expose android:webview:doctor.');

const failed = checks.filter((item) => !item.passed);

mkdirSync(join(root, 'reports'), { recursive: true });
writeFileSync(
  reportPath,
  `${JSON.stringify(
    {
      ok: failed.length === 0,
      checkedAt: new Date().toISOString(),
      passed: checks.length - failed.length,
      failed: failed.length,
      checks
    },
    null,
    2
  )}\n`
);

for (const item of checks) {
  const icon = item.passed ? 'PASS' : 'FAIL';
  console.log(`${icon} ${item.name} - ${item.detail}`);
}

console.log(`\nAndroid WebView doctor: ${checks.length - failed.length}/${checks.length} passed`);
console.log(`Report: ${reportPath}`);

if (failed.length) {
  process.exitCode = 1;
}
