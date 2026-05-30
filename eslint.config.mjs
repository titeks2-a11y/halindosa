import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "android/**", "ios/App/App/public/**", "node_modules/**", "out/**", "next-env.d.ts"]
  }
];

export default eslintConfig;
