// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// npm v7+ will install ../node_modules/react and ../node_modules/react-native because of peerDependencies.
// To prevent the incompatible react-native between ./node_modules/react-native and ../node_modules/react-native,
// excludes the one from the parent folder when bundling.
const moduleRoot = path.resolve(__dirname, '..');

config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  // Anchor to __dirname, not CWD: the release bundler runs with a different CWD
  // than `expo start`, so a bare '..' would point at the wrong directory.
  // On windows the path will resolve with `\`. We need to escape it with `\\` for the RegExp.
  new RegExp(path.resolve(moduleRoot, 'node_modules', 'react').replace(/\\/g, '\\\\')),
  new RegExp(path.resolve(moduleRoot, 'node_modules', 'react-native').replace(/\\/g, '\\\\')),
];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, './node_modules'),
  path.resolve(moduleRoot, 'node_modules'),
];

// Local-dev fallback only: lets `expo start` (dev server) resolve the package
// from the repo root. extraNodeModules is consulted only when normal
// node_modules lookup fails. In CI the built JS is staged into
// example/node_modules (see ci.yml), which takes precedence and — being under
// the Metro projectRoot — is watched; the parent-dir path is NOT watched under
// the release bundler (`expo export:embed`), which fails with "could not be
// found" / "Failed to get the SHA-1".
config.resolver.extraNodeModules = {
  '@sonnetstationsolutions/expo-argon2': moduleRoot,
};

config.watchFolders = [moduleRoot];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
