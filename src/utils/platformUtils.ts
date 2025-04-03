import { Platform } from 'react-native';

/**
 * Utility functions for platform-specific code
 */

/**
 * Check if the app is running on a web platform
 */
export const isWeb = (): boolean => {
  return Platform.OS === 'web';
};

/**
 * Check if the app is running on a mobile platform (iOS or Android)
 */
export const isMobile = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Check if the app is running on Android
 */
export const isAndroid = (): boolean => {
  return Platform.OS === 'android';
};

/**
 * Check if the app is running on iOS
 */
export const isIOS = (): boolean => {
  return Platform.OS === 'ios';
};

/**
 * Get platform-specific styles
 * @param webStyles Styles for web platform
 * @param mobileStyles Styles for mobile platforms
 * @param androidStyles Styles specific to Android
 * @param iosStyles Styles specific to iOS
 */
export const getPlatformStyles = <T>(
  webStyles?: T,
  mobileStyles?: T,
  androidStyles?: T,
  iosStyles?: T
): T | undefined => {
  if (isWeb() && webStyles) {
    return webStyles;
  }
  
  if (isAndroid() && androidStyles) {
    return androidStyles;
  }
  
  if (isIOS() && iosStyles) {
    return iosStyles;
  }
  
  if (isMobile() && mobileStyles) {
    return mobileStyles;
  }
  
  return undefined;
};

/**
 * Execute platform-specific code
 * @param webCallback Function to execute on web
 * @param mobileCallback Function to execute on mobile
 * @param androidCallback Function to execute on Android
 * @param iosCallback Function to execute on iOS
 */
export const runPlatformCode = (
  webCallback?: () => void,
  mobileCallback?: () => void,
  androidCallback?: () => void,
  iosCallback?: () => void
): void => {
  if (isWeb() && webCallback) {
    webCallback();
    return;
  }
  
  if (isAndroid() && androidCallback) {
    androidCallback();
    return;
  }
  
  if (isIOS() && iosCallback) {
    iosCallback();
    return;
  }
  
  if (isMobile() && mobileCallback) {
    mobileCallback();
    return;
  }
};
