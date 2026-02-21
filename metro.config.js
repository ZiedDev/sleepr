const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adds support for wasm files
config.resolver.assetExts.push('wasm');

// Ensure we prioritize web-specific files
config.resolver.sourceExts.push('mjs'); 

module.exports = config;
