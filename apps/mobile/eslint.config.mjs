import expoConfig from "eslint-config-expo/flat.js";
import { base } from "@parampara/config/eslint";

const config = [
  {
    ignores: ["dist/**", ".expo/**", "ios/**", "android/**", "expo-env.d.ts"],
  },
  ...expoConfig,
  ...base,
];

export default config;
