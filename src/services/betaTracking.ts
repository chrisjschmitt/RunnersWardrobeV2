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
  ipAddress: string;
}

/**
 * Parse user agent to extract browser and version
 */
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  
  // Check for common browsers (order matters!)
  
  // Firefox (including iOS Firefox - FxiOS)
  if (ua.includes('FxiOS/')) {
    const match = ua.match(/FxiOS\/(\d+)/);
    return `Firefox iOS ${match?.[1] || ''}`;
  }
  if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/(\d+)/);
    return `Firefox ${match?.[1] || ''}`;
  }
  
  // Edge (including mobile - EdgiOS)
  if (ua.includes('EdgiOS/')) {
    const match = ua.match(/EdgiOS\/(\d+)/);
    return `Edge iOS ${match?.[1] || ''}`;
  }
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/(\d+)/);
    return `Edge ${match?.[1] || ''}`;
  }
  
  // Chrome on iOS uses CriOS
  if (ua.includes('CriOS/')) {
    const match = ua.match(/CriOS\/(\d+)/);
    return `Chrome iOS ${match?.[1] || ''}`;
  }
  
  // Chrome on other platforms
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    const match = ua.match(/Chrome\/(\d+)/);
    return `Chrome ${match?.[1] || ''}`;
  }
  
  // Safari (must check after Chrome since Chrome includes Safari in UA)
  if (ua.includes('Safari/') && !ua.includes('Chrome/') && !ua.includes('CriOS/')) {
    const match = ua.match(/Version\/(\d+)/);
    return `Safari ${match?.[1] || ''}`;
  }
  
  // Opera
  if (ua.includes('Opera/') || ua.includes('OPR/')) {
    return 'Opera';
  }
  
  // DuckDuckGo
  if (ua.includes('DuckDuckGo/')) {
    return 'DuckDuckGo (not supported)';
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
 * Fetch public IP address using ipify API
 */
async function getIPAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip || 'Unknown';
    }
    return 'Fetch failed';
  } catch {
    return 'Blocked or unavailable';
  }
}

/**
 * Format timestamp in user's local timezone
 */
function getLocalTimestamp(): string {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Format: "Dec 10, 2024, 3:45:30 PM EST"
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: timezone,
    timeZoneName: 'short'
  });
}

/**
 * Collect all device information
 */
async function collectDeviceInfo(): Promise<DeviceInfo> {
  // Fetch IP address in parallel with collecting other info
  const ipAddress = await getIPAddress();
  
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
    timestamp: getLocalTimestamp(),
    ipAddress,
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
    formData.append('ipAddress', info.ipAddress);
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
  
  // IMMEDIATELY set the flag to prevent duplicate sends
  // This prevents race conditions if the page reloads before the request completes
  localStorage.setItem(FIRST_LAUNCH_KEY, new Date().toISOString());
  
  try {
    const deviceInfo = await collectDeviceInfo();
    const success = await sendToFormspree(deviceInfo);
    
    if (success) {
      console.log('Beta tracking: First launch recorded');
    } else {
      // If send failed, we could remove the flag to retry next time
      // But for beta, it's better to not spam - just log it
      console.log('Beta tracking: Send failed, but flag set to prevent retries');
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

