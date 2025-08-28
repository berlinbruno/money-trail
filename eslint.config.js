// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',     // built APKs, bundles
      '.expo/**',    // local expo build cache
      'node_modules/**',
    ],
    rules: {
      'no-console': 'warn',   // or 'error' if you want stricter builds
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      'react-native/no-inline-styles': 'off',
    },
  }
]);
