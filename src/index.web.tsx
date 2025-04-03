import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';
import { preloadCriticalResources } from './src/utils/webPerformance';

// Preload critical resources for web
if (Platform.OS === 'web') {
  // Add critical resources that should be preloaded
  preloadCriticalResources([
    '/assets/splash.png',
    '/assets/icon.png'
  ]);
  
  // Add event listener for when the DOM is fully loaded
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      // Any initialization code that should run after DOM is loaded
    });
  }
}

// Register the main component
registerRootComponent(App);
