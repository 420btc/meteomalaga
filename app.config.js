import path from 'path';
import fs from 'fs';

// Custom function to copy web folder contents to dist during export
const copyWebFolderToDist = () => {
  const webDir = path.resolve(__dirname, 'web');
  const distDir = path.resolve(__dirname, 'dist');
  
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Read web directory
  if (fs.existsSync(webDir)) {
    const files = fs.readdirSync(webDir);
    files.forEach(file => {
      const srcPath = path.join(webDir, file);
      const destPath = path.join(distDir, file);
      
      // Skip if it's a directory
      if (fs.statSync(srcPath).isDirectory()) return;
      
      // Copy the file
      fs.copyFileSync(srcPath, destPath);
    });
  }
};

export default ({ config }) => {
  // Copy web folder contents to dist
  if (process.env.NODE_ENV === 'production') {
    try {
      copyWebFolderToDist();
    } catch (error) {
      console.error('Error copying web folder to dist:', error);
    }
  }
  
  return {
    ...config,
    name: "Meteo Málaga",
    slug: "meteo-malaga",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1E3A8A"
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/meteo-malaga"
    },
    android: {
      ...config.android,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1E3A8A"
      },
      softwareKeyboardLayoutMode: "resize",
      package: "com.meteormalaga.app",
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      versionCode: 1
    },
    ios: {
      ...config.ios,
      supportsTablet: true,
      bundleIdentifier: "com.meteormalaga.app",
      buildNumber: "1.0.0"
    },
    web: {
      ...config.web,
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    extra: {
      eas: {
        projectId: "meteo-malaga"
      }
    },
    runtimeVersion: {
      policy: "sdkVersion"
    }
  };
};
