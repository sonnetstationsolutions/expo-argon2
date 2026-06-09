// These suites cover pure TypeScript logic (base64 marshalling, frozen
// vectors). They deliberately do NOT use the jest-expo preset: that preset
// installs Expo's runtime globals (the "winter" fetch shim), which fails under
// a plain Node test process and is irrelevant to logic that never touches the
// native module. On-device behavior is validated by the example app and the
// e2e device tests, not here.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
};
