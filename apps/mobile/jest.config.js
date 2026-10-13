/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // Unit tests for pure modules only (D-043 onward: no component render library).
  testMatch: ["<rootDir>/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/dist/", "<rootDir>/.expo/"],
};
