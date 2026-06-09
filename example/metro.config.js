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

// Resolve the in-repo parent package to its built entry by absolute file path.
// extraNodeModules + package.json "main" resolution proved unreliable under the
// release Gradle bundle (worked via the dev server, failed in release — Metro's
// package-exports path with no "exports" field). Returning the exact file is
// deterministic; the Android CI job builds build/ before bundling.
const MODULE_NAME = '@sonnetstationsolutions/expo-argon2';
const MODULE_ENTRY = path.resolve(moduleRoot, 'build', 'index.js');
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === MODULE_NAME) {
    return { type: 'sourceFile', filePath: MODULE_ENTRY };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

config.watchFolders = [moduleRoot];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
