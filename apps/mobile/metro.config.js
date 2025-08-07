const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfill for buffer module
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: 'buffer',
};

// Add buffer to the list of modules to resolve
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Ensure font files are processed correctly
config.resolver.assetExts.push('ttf');

module.exports = config; 