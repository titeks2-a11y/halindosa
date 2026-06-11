import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const configXmlPath = join(process.cwd(), 'android/app/src/main/res/xml/config.xml');

const configXml = `<?xml version='1.0' encoding='utf-8'?>
<widget version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
  <access origin="https://halindosa.com" />
  <access origin="https://www.halindosa.com" />
</widget>
`;

writeFileSync(configXmlPath, configXml, 'utf8');
console.log(`Hardened Android WebView config: ${configXmlPath}`);
