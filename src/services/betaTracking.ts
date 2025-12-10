/**
 * Beta Tracking Service
 * 
 * ⚠️ TODO: REMOVE THIS FILE BEFORE PRODUCTION RELEASE
 * 
 * This service sends anonymous device info on first app launch during beta testing.
 * It helps with troubleshooting and understanding our beta user base.
 * 
 * Data collected:
 * - IP address (via Formspree)
 * - Browser and version
 * - Operating system
 * - Device type
 * - Screen size
 * - App version
 * - Display mode (PWA vs browser)
 * - Timezone
 * 
 * This should be removed or made opt-in before production release.
 */

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xkgdqvjo';
const FIRST_LAUNCH_KEY = 'trailkit_first_launch_tracked';
const APP_VERSION = '4.1.0';

interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  screenSize: string;
  pixelRatio: string;
  appVersion: string;
  displayMode: string;
  timezone: string;
  language: string;
  online: boolean;
  serviceWorker: boolean;
  timestamp: string;
}

/**
 * Parse user agent to extract browser and version
 */
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  
  // Check for common browsers
  if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/(\d+)/);
    return `Firefox ${match?.[1] || ''}`;
  }
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/(\d+)/);
    return `Edge ${match?.[1] || ''}`;
  }
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    const match = ua.match(/Chrome\/(\d+)/);
    return `Chrome ${match?.[1] || ''}`;
  }
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    const match = ua.match(/Version\/(\d+)/);
    return `Safari ${match?.[1] || ''}`;
  }
  if (ua.includes('Opera/') || ua.includes('OPR/')) {
    return 'Opera';
  }
  
  return 'Unknown Browser';
}

/**
 * Parse user agent to extract OS
 */
function getOSInfo(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes('iPhone OS')) {
    const match = ua.match(/iPhone OS (\d+_\d+)/);
    return `iOS ${match?.[1]?.replace('_', '.') || ''}`;
  }
  if (ua.includes('iPad')) {
    const match = ua.match(/OS (\d+_\d+)/);
    return `iPadOS ${match?.[1]?.replace('_', '.') || ''}`;
  }
  if (ua.includes('Android')) {
    const match = ua.match(/Android (\d+)/);
    return `Android ${match?.[1] || ''}`;
  }
  if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    return `macOS ${match?.[1]?.replace('_', '.') || ''}`;
  }
  if (ua.includes('Windows NT')) {
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    const version = match?.[1];
    if (version === '10.0') return 'Windows 10/11';
    if (version === '6.3') return 'Windows 8.1';
    if (version === '6.2') return 'Windows 8';
    return 'Windows';
  }
  if (ua.includes('Linux')) {
    return 'Linux';
  }
  
  return 'Unknown OS';
}

/**
 * Determine device type
 */
function getDeviceType(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) {
    if (ua.includes('Mobile')) return 'Android Phone';
    return 'Android Tablet';
  }
  if (ua.includes('Mobile')) return 'Mobile';
  return 'Desktop';
}

/**
 * Check if running as installed PWA
 */
function getDisplayMode(): string {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'Standalone (PWA installed)';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'Fullscreen';
  }
  // Check for iOS standalone mode
  if ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone) {
    return 'iOS Standalone (PWA installed)';
  }
  return 'Browser';
}

/**
 * Collect all device information
 */
function collectDeviceInfo(): DeviceInfo {
  return {
    browser: getBrowserInfo(),
    os: getOSInfo(),
    device: getDeviceType(),
    screenSize: `${window.screen.width} × ${window.screen.height}`,
    pixelRatio: `@${window.devicePixelRatio}x`,
    appVersion: APP_VERSION,
    displayMode: getDisplayMode(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    online: navigator.onLine,
    serviceWorker: 'serviceWorker' in navigator,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send device info to Formspree
 */
async function sendToFormspree(info: DeviceInfo): Promise<boolean> {
  try {
    const formData = new FormData();
    
    // Add a clear subject line
    formData.append('_subject', '🆕 New TrailKit User (Beta)');
    
    // Format the data nicely for email
    formData.append('type', 'First Launch Tracking');
    formData.append('browser', info.browser);
    formData.append('os', info.os);
    formData.append('device', info.device);
    formData.append('screen', `${info.screenSize} ${info.pixelRatio}`);
    formData.append('appVersion', info.appVersion);
    formData.append('displayMode', info.displayMode);
    formData.append('timezone', info.timezone);
    formData.append('language', info.language);
    formData.append('online', info.online ? 'Yes' : 'No');
    formData.append('serviceWorker', info.serviceWorker ? 'Active' : 'Not available');
    formData.append('timestamp', info.timestamp);
    
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to send tracking data:', error);
    return false;
  }
}

/**
 * Track first launch if not already tracked
 * 
 * ⚠️ TODO: REMOVE THIS FUNCTION BEFORE PRODUCTION RELEASE
 */
export async function trackFirstLaunch(): Promise<void> {
  // Check if already tracked
  if (localStorage.getItem(FIRST_LAUNCH_KEY)) {
    return;
  }
  
  try {
    const deviceInfo = collectDeviceInfo();
    const success = await sendToFormspree(deviceInfo);
    
    if (success) {
      // Mark as tracked so we don't send again
      localStorage.setItem(FIRST_LAUNCH_KEY, new Date().toISOString());
      console.log('Beta tracking: First launch recorded');
    }
  } catch (error) {
    // Fail silently - tracking should never break the app
    console.error('Beta tracking error:', error);
  }
}

/**
 * Check if first launch has been tracked
 */
export function isFirstLaunchTracked(): boolean {
  return !!localStorage.getItem(FIRST_LAUNCH_KEY);
}

