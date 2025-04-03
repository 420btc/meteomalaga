module.exports = function(api) {
  api.cache(false); // Disable cache to prevent issues with Vercel
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add module resolver plugin to help with imports
      ['module-resolver', {
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          // These aliases help with module resolution
          '@react-navigation/native': '@react-navigation/native',
          '@react-navigation/native-stack': '@react-navigation/native-stack',
          'expo-status-bar': 'expo-status-bar',
          'expo-crypto': 'expo-crypto',
          'react-native-chart-kit': 'react-native-chart-kit',
          // Add polyfills
          'crypto': 'crypto-browserify',
          'stream': 'stream-browserify',
          'buffer': 'buffer',
          'path': 'path-browserify',
          'util': 'util',
          'process': 'process/browser'
        }
      }]
    ]
  };
};
