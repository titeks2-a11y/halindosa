import type { CapacitorConfig } from '@capacitor/cli';

const defaultAppWebUrl = 'https://www.halindosa.com';
const configuredAppWebUrl =
  process.env.APP_WEB_URL ||
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_APP_WEB_URL ||
  defaultAppWebUrl;

function resolveAppWebUrl(value: string) {
  const url = new URL(value);
  const isLocalDev = ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname);

  if (url.protocol !== 'https:' && !(isLocalDev && url.protocol === 'http:')) {
    throw new Error(`APP_WEB_URL must be HTTPS in production or HTTP localhost for local testing: ${value}`);
  }

  return {
    origin: url.origin,
    isLocalDev
  };
}

const appWeb = resolveAppWebUrl(configuredAppWebUrl);

const config: CapacitorConfig = {
  appId: 'com.halindosa.app',
  appName: '할인도사',
  webDir: 'out',
  server: {
    url: appWeb.origin,
    cleartext: appWeb.isLocalDev,
    allowNavigation: ['halindosa.com', 'www.halindosa.com'],
    errorPath: 'offline.html'
  }
};

export default config;
