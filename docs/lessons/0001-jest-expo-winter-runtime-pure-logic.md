# Lesson: jest-expo preset crashes pure-logic tests via the "winter" runtime

**Date:** 2026-06-08
**Status:** Resolved

## Symptom

`npm test` (the `create-expo-module` default, which runs jest with `preset: "jest-expo"`) failed before any test ran, on a test suite that only imports plain TypeScript (a base64 codec and a JSON fixture — nothing from `expo` or `react-native`):

```
TypeError: Super expression must either be null or a function
  at _inherits (@babel/runtime/helpers/inherits.js)
  at expo/src/winter/fetch/FetchResponse.ts:141
  ...
  at Object.get [as fetch] (expo/src/winter/installGlobal.ts)
```

Setting `testEnvironment: "node"` did **not** fix it.

## Root cause

The `jest-expo` preset installs Expo's "winter" runtime globals during setup. `FetchResponse` extends the global `Response`, which is `undefined` in the jest setup context at the moment babel evaluates the `extends` clause, so `_inherits` throws. This happens at preset/setup time, independent of the individual test's `testEnvironment`, and independent of whether the test touches Expo at all. (Seen with the SDK 56 scaffold pairing `expo ^56` with `jest-expo ~55`.)

## Fix

Pure-logic suites do not need the Expo runtime. Give them a standalone jest config that uses `babel-jest` with `babel-preset-expo` and a `node` environment, and drop the `jest-expo` preset:

```js
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
};
```

Remove the `"jest"` block from `package.json` (jest refuses to run with both a `jest.config.js` and a `package.json` `jest` key). The `create-expo-module` `test` wrapper just shells out to `jest`, so it picks this config up.

## Takeaway

`jest-expo` is for testing components that need the RN/Expo runtime. For pure TypeScript logic (codecs, validation, fixtures), prefer a plain `babel-jest` + node config. On-device behavior is validated separately by the example app and e2e device tests, not by these suites.
