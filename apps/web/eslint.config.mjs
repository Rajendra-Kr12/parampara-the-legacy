import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import { base } from "@parampara/config/eslint";

const config = [
  {
    ignores: [".next/**", "next-env.d.ts", "playwright-report/**", "test-results/**"],
  },
  ...nextCoreWebVitals,
  ...base,
];

export default config;
