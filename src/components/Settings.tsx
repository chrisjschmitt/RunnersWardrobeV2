import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/database';
import { isValidApiKeyFormat, isProxyMode } from '../services/weatherApi';
import { formatTemperature, formatTemperatureDeltaC, formatWindSpeed, formatPrecipitation, type TemperatureUnit } from '../services/temperatureUtils';
import { getLastRecommendationDebug } from '../services/recommendationEngine';
import type { TestWeatherData, RecommendationDebugInfo, ThermalPreference } from '../types';
import { THERMAL_OFFSETS } from '../types';
import { version } from '../../package.json';

interface SettingsProps {
  onSettingsSaved: () => void;
  initialApiKey?: string;
  initialUnit?: TemperatureUnit;
  initialThermalPreference?: ThermalPreference;
  onThermalPreferenceChange?: (pref: ThermalPreference) => void;
  onUploadClick?: () => void;
  testMode?: boolean;
  onTestModeChange?: (enabled: boolean) => void;
  testWeather?: TestWeatherData | null;
  onTestWeatherChange?: (weather: TestWeatherData | null) => void;
}

const defaultTestWeather: TestWeatherData = {
  temperature: 45,
  feelsLike: 42,
  humidity: 60,
  windSpeed: 8,
  precipitation: 0,
  cloudCover: 30,
  description: 'partly cloudy'
};

const weatherPresets: { name: string; data: TestWeatherData }[] = [
  { name: '❄️ Freezing', data: { temperature: 20, feelsLike: 10, humidity: 40, windSpeed: 15, precipitation: 0, cloudCover: 80, description: 'overcast clouds' }},
  { name: '🥶 Cold', data: { temperature: 35, feelsLike: 28, humidity: 50, windSpeed: 12, precipitation: 0, cloudCover: 60, description: 'cloudy' }},
  { name: '🌤️ Cool', data: { temperature: 50, feelsLike: 48, humidity: 55, windSpeed: 8, precipitation: 0, cloudCover: 40, description: 'partly cloudy' }},
  { name: '😊 Mild', data: { temperature: 65, feelsLike: 65, humidity: 50, windSpeed: 5, precipitation: 0, cloudCover: 20, description: 'clear sky' }},
  { name: '☀️ Warm', data: { temperature: 75, feelsLike: 78, humidity: 60, windSpeed: 3, precipitation: 0, cloudCover: 10, description: 'sunny' }},
  { name: '🥵 Hot', data: { temperature: 90, feelsLike: 95, humidity: 70, windSpeed: 5, precipitation: 0, cloudCover: 5, description: 'clear sky' }},
  { name: '🌧️ Rainy', data: { temperature: 55, feelsLike: 52, humidity: 85, windSpeed: 10, precipitation: 0.5, cloudCover: 90, description: 'light rain' }},
  { name: '💨 Windy', data: { temperature: 50, feelsLike: 40, humidity: 45, windSpeed: 25, precipitation: 0, cloudCover: 50, description: 'windy' }},
];

export function Settings({ 
  onSettingsSaved, 
  initialApiKey = '', 
  initialUnit = 'celsius',
  initialThermalPreference = 'average',
  onThermalPreferenceChange,
  onUploadClick,
  testMode = false,
  onTestModeChange,
  testWeather,
  onTestWeatherChange
}: SettingsProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(initialUnit);
  const [thermalPreference, setThermalPreference] = useState<ThermalPreference>(initialThermalPreference);
  const [expertMode, setExpertMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localTestWeather, setLocalTestWeather] = useState<TestWeatherData>(testWeather || defaultTestWeather);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [versionTapCount, setVersionTapCount] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugTab, setDebugTab] = useState<'app' | 'recommendation'>('app');
  const [recDebug, setRecDebug] = useState<RecommendationDebugInfo | null>(null);
  
  const proxyMode = isProxyMode();

  // Handle version tap - show debug after 5 taps
  const handleVersionTap = () => {
    const newCount = versionTapCount + 1;
    setVersionTapCount(newCount);
    
    if (newCount >= 5) {
      setShowDebugInfo(true);
      setRecDebug(getLastRecommendationDebug());
      setVersionTapCount(0);
    }
    
    // Reset tap count after 2 seconds of inactivity
    setTimeout(() => {
      setVersionTapCount(prev => prev === newCount ? 0 : prev);
    }, 2000);
  };

  // Get debug info from localStorage
  const getDebugInfo = () => {
    const sessionCount = localStorage.getItem('trailkit_sessions_since_backup') || '0';
    const dismissedUntil = localStorage.getItem('trailkit_backup_reminder_dismissed');
    const firstLaunchTracked = localStorage.getItem('trailkit_first_launch_tracked');
    const onboardingComplete = localStorage.getItem('onboarding_complete');
    const activityState = localStorage.getItem('trailkit_activity_state');
    
    let activityInfo = 'None';
    let activityStartTime = 'None';
    let activityDuration = 'None';
    let startWeatherInfo = null;
    
    if (activityState) {
      try {
        const parsed = JSON.parse(activityState);
        activityInfo = `${parsed.activity || 'unknown'} - ${parsed.state || 'unknown'}`;
        
        if (parsed.startTime) {
          const startDate = new Date(parsed.startTime);
          activityStartTime = startDate.toLocaleString();
          
          if (parsed.state === 'running') {
            const elapsed = Date.now() - startDate.getTime();
            const hours = Math.floor(elapsed / (1000 * 60 * 60));
            const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
            
            if (hours > 0) {
              activityDuration = `${hours}h ${minutes}m ${seconds}s`;
              activityInfo += ` (${hours}h ${minutes}m)`;
            } else if (minutes > 0) {
              activityDuration = `${minutes}m ${seconds}s`;
              activityInfo += ` (${minutes}m)`;
            } else {
              activityDuration = `${seconds}s`;
            }
          }
        }
        
        // Parse start weather if available
        if (parsed.startWeather) {
          try {
            const weatherData = JSON.parse(parsed.startWeather);
            startWeatherInfo = {
              temperature: weatherData.temperature,
              feelsLike: weatherData.feelsLike,
              humidity: weatherData.humidity,
              windSpeed: weatherData.windSpeed,
              precipitation: weatherData.precipitation,
              description: weatherData.description || 'N/A',
              timestamp: weatherData.timestamp ? new Date(weatherData.timestamp).toLocaleString() : 'N/A'
            };
          } catch {
            startWeatherInfo = { error: 'Failed to parse weather data' };
          }
        }
      } catch {
        activityInfo = 'Invalid data';
      }
    }
    
    return {
      sessionCount,
      dismissedUntil: dismissedUntil ? new Date(dismissedUntil).toLocaleString() : 'Not dismissed',
      activityState: activityInfo,
      activityStartTime,
      activityDuration,
      startWeatherInfo,
      firstLaunchTracked: firstLaunchTracked || 'No',
      onboardingComplete: onboardingComplete || 'No',
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width} × ${window.screen.height}`,
      devicePixelRatio: window.devicePixelRatio,
      standalone: (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone) ? 'Yes (PWA)' : 'No (Browser)'
    };
  };

  const clearBackupDismissal = () => {
    localStorage.removeItem('trailkit_backup_reminder_dismissed');
    setShowDebugInfo(false);
    alert('Backup reminder dismissal cleared. Reload to see popup.');
  };

  const resetSessionCount = () => {
    localStorage.setItem('trailkit_sessions_since_backup', '0');
    alert('Session count reset to 0.');
  };

  const simulateForgottenActivity = () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const state = {
      activity: 'running',
      state: 'running',
      startTime: threeHoursAgo.toISOString(),
      clothing: null
    };
    localStorage.setItem('trailkit_activity_state', JSON.stringify(state));
    alert('Simulated a forgotten running activity (started 3h ago). Go to Home to see the reminder.');
    setShowDebugInfo(false);
  };

  const clearActivityState = () => {
    localStorage.removeItem('trailkit_activity_state');
    alert('Activity state cleared.');
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (testWeather) {
      setLocalTestWeather(testWeather);
    }
  }, [testWeather]);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      if (settings) {
        setApiKey(settings.weatherApiKey || '');
        setTemperatureUnit(settings.temperatureUnit || 'celsius');
        setThermalPreference(settings.thermalPreference || 'average');
        setExpertMode(settings.expertMode || false);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    setUpdateMessage(null);
    
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      
      setUpdateMessage('✓ Cache cleared! Reloading with latest version...');
      
      // Reload after a brief delay to show the message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      console.error('Failed to check for updates:', err);
      setUpdateMessage('Update check failed. Try a manual refresh (Cmd+Shift+R)');
      setIsCheckingUpdates(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);

    // Only validate API key if not in proxy mode and not in test mode
    if (!proxyMode && !testMode) {
      if (!apiKey.trim()) {
        setError('Please enter an API key');
        return;
      }

      if (!isValidApiKeyFormat(apiKey.trim())) {
        setError('Invalid API key format. OpenWeatherMap keys are 32 characters.');
        return;
      }
    }

    setIsSaving(true);
    try {
      await saveSettings({
        weatherApiKey: apiKey.trim(),
        temperatureUnit: temperatureUnit,
        thermalPreference: thermalPreference,
        testMode: testMode,
        expertMode: expertMode
      });
      setSaved(true);
      onSettingsSaved();
      onThermalPreferenceChange?.(thermalPreference);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpertModeToggle = async () => {
    const newExpertMode = !expertMode;
    setExpertMode(newExpertMode);
    
    // Auto-save expert mode setting immediately
    try {
      const settings = await getSettings();
      if (settings) {
        await saveSettings({
          ...settings,
          expertMode: newExpertMode
        });
        // Show brief feedback
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save expert mode:', err);
      // Revert on error
      setExpertMode(!newExpertMode);
      setError('Failed to save expert mode setting');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleTestModeToggle = () => {
    const newTestMode = !testMode;
    onTestModeChange?.(newTestMode);
    if (newTestMode && !testWeather) {
      onTestWeatherChange?.(defaultTestWeather);
    }
  };

  const handleTestWeatherUpdate = (field: keyof TestWeatherData, value: number | string) => {
    const updated = { ...localTestWeather, [field]: value };
    setLocalTestWeather(updated);
    onTestWeatherChange?.(updated);
  };

  const handlePresetSelect = (preset: TestWeatherData) => {
    setLocalTestWeather(preset);
    onTestWeatherChange?.(preset);
  };

  return (
    <div className="animate-fade-in">
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </h2>

        <div className="space-y-6">
          {/* Unit System Section */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Units
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTemperatureUnit('fahrenheit')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  temperatureUnit === 'fahrenheit'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
                }`}
              >
                <span className="text-lg">Imperial</span>
                <span className="block text-xs mt-1 opacity-80">°F, mph, in</span>
              </button>
              <button
                onClick={() => setTemperatureUnit('celsius')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  temperatureUnit === 'celsius'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
                }`}
              >
                <span className="text-lg">Metric</span>
                <span className="block text-xs mt-1 opacity-80">°C, km/h, mm</span>
              </button>
            </div>
          </div>

          {/* Thermal Preference Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              When you're active outdoors, you usually feel:
            </label>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              This adjusts clothing recommendations to match your body
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setThermalPreference('cold')}
                className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-all ${
                  thermalPreference === 'cold'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥶</span>
                  <div>
                    <div className="font-medium">Colder than most people</div>
                    <div className={`text-xs ${thermalPreference === 'cold' ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`}>
                      Warmer clothing recommendations ({formatTemperatureDeltaC(THERMAL_OFFSETS.cold, temperatureUnit)} offset)
                    </div>
                  </div>
                </div>
                {thermalPreference === 'cold' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setThermalPreference('average')}
                className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-all ${
                  thermalPreference === 'average'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">😊</span>
                  <div>
                    <div className="font-medium">About average</div>
                    <div className={`text-xs ${thermalPreference === 'average' ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`}>
                      Standard recommendations (no adjustment)
                    </div>
                  </div>
                </div>
                {thermalPreference === 'average' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setThermalPreference('warm')}
                className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-all ${
                  thermalPreference === 'warm'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥵</span>
                  <div>
                    <div className="font-medium">Warmer than most people</div>
                    <div className={`text-xs ${thermalPreference === 'warm' ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`}>
                      Lighter clothing recommendations ({formatTemperatureDeltaC(THERMAL_OFFSETS.warm, temperatureUnit)} offset)
                    </div>
                  </div>
                </div>
                {thermalPreference === 'warm' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* API Key Section - only show if not in proxy mode */}
          {!proxyMode && !testMode && (
            <div>
              <label className="block text-sm font-medium mb-2">
                OpenWeatherMap API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="input-field"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Get a free API key at{' '}
                <a 
                  href="https://openweathermap.org/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] underline"
                >
                  openweathermap.org/api
                </a>
              </p>
            </div>
          )}

          {/* Proxy mode indicator */}
          {proxyMode && !testMode && (
            <div className="p-3 bg-[rgba(34,197,94,0.2)] border border-[var(--color-success)] rounded-lg">
              <p className="text-[var(--color-success)] text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Weather API configured automatically
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                No API key required - weather data is fetched securely through our server.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-[rgba(239,68,68,0.2)] border border-[var(--color-error)] rounded-lg">
              <p className="text-[var(--color-error)] text-sm">{error}</p>
            </div>
          )}

          {/* Success message */}
          {saved && (
            <div className="p-3 bg-[rgba(34,197,94,0.2)] border border-[var(--color-success)] rounded-lg">
              <p className="text-[var(--color-success)] text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Settings saved successfully!
              </p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary w-full"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner animate-spin w-5 h-5"></div>
                Saving...
              </span>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>

      {/* Expert Mode Section */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Expert Mode
          </h3>
          <button
            onClick={handleExpertModeToggle}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              expertMode ? 'bg-[var(--color-accent)]' : 'bg-[rgba(255,255,255,0.2)]'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              expertMode ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Enable activity level and duration tracking for more detailed feedback. When enabled, you'll be prompted to set intensity level (low/moderate/high) and duration (&lt; 1 hour / ≥ 1 hour) for each activity.
        </p>
      </div>

      {/* Test Mode Section */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Test Mode
          </h3>
          <button
            onClick={handleTestModeToggle}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              testMode ? 'bg-[var(--color-accent)]' : 'bg-[rgba(255,255,255,0.2)]'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              testMode ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Test the app with custom weather conditions to verify recommendations.
        </p>

        {testMode && (
          <div className="space-y-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
            {/* Weather Presets */}
            <div>
              <label className="block text-sm font-medium mb-2">Quick Presets</label>
              <div className="grid grid-cols-4 gap-2">
                {weatherPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset.data)}
                    className="p-2 text-xs rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature: {formatTemperature(localTestWeather.temperature, temperatureUnit)}
              </label>
              <input
                type="range"
                min="-10"
                max="110"
                value={localTestWeather.temperature}
                onChange={(e) => handleTestWeatherUpdate('temperature', parseInt(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                <span>{formatTemperature(-10, temperatureUnit)}</span>
                <span>{formatTemperature(110, temperatureUnit)}</span>
              </div>
            </div>

            {/* Feels Like */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Feels Like: {formatTemperature(localTestWeather.feelsLike, temperatureUnit)}
              </label>
              <input
                type="range"
                min="-20"
                max="120"
                value={localTestWeather.feelsLike}
                onChange={(e) => handleTestWeatherUpdate('feelsLike', parseInt(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>

            {/* Humidity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Humidity: {localTestWeather.humidity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={localTestWeather.humidity}
                onChange={(e) => handleTestWeatherUpdate('humidity', parseInt(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>

            {/* Wind Speed */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Wind Speed: {formatWindSpeed(localTestWeather.windSpeed, temperatureUnit)}
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={localTestWeather.windSpeed}
                onChange={(e) => handleTestWeatherUpdate('windSpeed', parseInt(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>

            {/* Precipitation */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Precipitation: {formatPrecipitation(localTestWeather.precipitation, temperatureUnit)} per hour
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localTestWeather.precipitation}
                onChange={(e) => handleTestWeatherUpdate('precipitation', parseFloat(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>

            {/* Cloud Cover */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Cloud Cover: {localTestWeather.cloudCover}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={localTestWeather.cloudCover}
                onChange={(e) => handleTestWeatherUpdate('cloudCover', parseInt(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <select
                value={localTestWeather.description}
                onChange={(e) => handleTestWeatherUpdate('description', e.target.value)}
                className="input-field"
              >
                <option value="clear sky">Clear sky</option>
                <option value="few clouds">Few clouds</option>
                <option value="partly cloudy">Partly cloudy</option>
                <option value="cloudy">Cloudy</option>
                <option value="overcast clouds">Overcast</option>
                <option value="light rain">Light rain</option>
                <option value="moderate rain">Moderate rain</option>
                <option value="heavy rain">Heavy rain</option>
                <option value="light snow">Light snow</option>
                <option value="snow">Snow</option>
                <option value="windy">Windy</option>
                <option value="foggy">Foggy</option>
              </select>
            </div>

            <div className="p-3 bg-[rgba(251,191,36,0.2)] border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-300 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Test Mode Active
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Go to Home tab to see recommendations for these conditions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Help section - only show if not in proxy mode */}
      {!proxyMode && !testMode && (
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to get an API key
          </h3>
          <ol className="text-sm text-[var(--color-text-muted)] space-y-2 list-decimal list-inside">
            <li>Visit <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] underline">openweathermap.org/api</a></li>
            <li>Create a free account</li>
            <li>Go to "API Keys" in your account</li>
            <li>Copy your default key or generate a new one</li>
            <li>Paste it above and save</li>
          </ol>
          <p className="text-xs text-[var(--color-text-muted)] mt-4">
            The free tier includes 1,000 API calls per day, which is more than enough for personal use.
          </p>
        </div>
      )}

      {/* Import Data button */}
      {onUploadClick && (
        <button
          onClick={onUploadClick}
          className="w-full mt-6 glass-card p-4 flex items-center justify-between hover:bg-[rgba(255,255,255,0.08)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-left">
              <div className="font-medium">Import Data</div>
              <div className="text-sm text-[var(--color-text-muted)]">Upload activity history from CSV</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Version info and update check */}
      <div className="mt-6 glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div 
            onClick={handleVersionTap}
            className="cursor-pointer select-none"
            title="Tap 5 times for debug info"
          >
            <p className="font-medium">TrailKit</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Version {version}
              {versionTapCount > 0 && versionTapCount < 5 && (
                <span className="ml-2 text-xs opacity-50">({5 - versionTapCount} more...)</span>
              )}
            </p>
          </div>
          <button
            onClick={handleCheckForUpdates}
            disabled={isCheckingUpdates}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {isCheckingUpdates ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Check for Updates
              </>
            )}
          </button>
        </div>
        {updateMessage && (
          <p className={`text-sm ${updateMessage.includes('latest') ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}`}>
            {updateMessage}
          </p>
        )}
      </div>

      {/* Debug Info Modal */}
      {showDebugInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--color-bg-card)] rounded-2xl shadow-2xl border border-[var(--color-accent)] overflow-hidden">
            <div className="bg-[var(--color-accent)] p-4 text-center">
              <div className="text-2xl mb-1">🔧</div>
              <h2 className="text-lg font-bold text-white">Debug Info</h2>
            </div>
            
            {/* Tab buttons */}
            <div className="flex border-b border-[rgba(255,255,255,0.1)]">
              <button
                onClick={() => setDebugTab('app')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  debugTab === 'app' 
                    ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' 
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                App State
              </button>
              <button
                onClick={() => setDebugTab('recommendation')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  debugTab === 'recommendation' 
                    ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' 
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                Recommendation
              </button>
            </div>
            
            <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
              {debugTab === 'app' ? (
                <>
                  {(() => {
                    const debug = getDebugInfo();
                    return (
                      <>
                        <div className="text-sm">
                          <span className="text-[var(--color-text-muted)]">Sessions since backup:</span>
                          <span className="ml-2 font-mono font-bold">{debug.sessionCount}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-[var(--color-text-muted)]">Reminder dismissed until:</span>
                          <span className="ml-2 font-mono text-xs">{debug.dismissedUntil}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-[var(--color-text-muted)]">Activity state:</span>
                          <span className="ml-2 font-mono text-xs">{debug.activityState}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-[var(--color-text-muted)]">Activity start time:</span>
                          <span className="ml-2 font-mono text-xs break-all">{debug.activityStartTime}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-[var(--color-text-muted)]">Activity duration:</span>
                          <span className="ml-2 font-mono text-xs">{debug.activityDuration}</span>
                        </div>
                        {debug.startWeatherInfo && (
                          <>
                            <div className="pt-2 mt-2 border-t border-[rgba(255,255,255,0.1)]">
                              <div className="text-sm font-semibold text-[var(--color-accent)] mb-2">Start Weather:</div>
                              {debug.startWeatherInfo.error ? (
                                <div className="text-xs text-[var(--color-error)] font-mono">{debug.startWeatherInfo.error}</div>
                              ) : (
                                <div className="space-y-1 text-xs font-mono">
                                  <div>Temp: <span className="text-[var(--color-accent)]">{formatTemperature(debug.startWeatherInfo.temperature, temperatureUnit)}</span></div>
                                  <div>Feels: <span className="text-[var(--color-accent)]">{formatTemperature(debug.startWeatherInfo.feelsLike, temperatureUnit)}</span></div>
                                  <div>Humidity: <span className="text-[var(--color-accent)]">{debug.startWeatherInfo.humidity}%</span></div>
                                  <div>Wind: <span className="text-[var(--color-accent)]">{formatWindSpeed(debug.startWeatherInfo.windSpeed, temperatureUnit)}</span></div>
                                  <div>Precip: <span className="text-[var(--color-accent)]">{formatPrecipitation(debug.startWeatherInfo.precipitation, temperatureUnit)}</span></div>
                                  <div>Conditions: <span className="text-[var(--color-accent)]">{debug.startWeatherInfo.description}</span></div>
                                  {debug.startWeatherInfo.timestamp !== 'N/A' && (
                                    <div className="text-[var(--color-text-muted)] mt-1">Saved: {debug.startWeatherInfo.timestamp}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        <div className="text-sm">
                          <span className="text-[var(--color-text-muted)]">First launch tracked:</span>
                          <span className="ml-2 font-mono">{debug.firstLaunchTracked}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-[var(--color-text-muted)]">Display mode:</span>
                          <span className="ml-2 font-mono">{debug.standalone}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-[var(--color-text-muted)]">Screen:</span>
                          <span className="ml-2 font-mono">{debug.screenSize} @{debug.devicePixelRatio}x</span>
                        </div>
                        <div className="text-sm break-all">
                          <span className="text-[var(--color-text-muted)]">User Agent:</span>
                          <span className="ml-2 font-mono text-xs">{debug.userAgent}</span>
                        </div>
                      </>
                    );
                  })()}
                  
                  <div className="pt-3 border-t border-[rgba(255,255,255,0.1)] space-y-2">
                    <button
                      onClick={clearBackupDismissal}
                      className="w-full py-2 px-4 bg-[rgba(234,179,8,0.2)] text-[var(--color-warning)] rounded-lg text-sm"
                    >
                      Clear Backup Reminder Dismissal
                    </button>
                    <button
                      onClick={resetSessionCount}
                      className="w-full py-2 px-4 bg-[rgba(239,68,68,0.2)] text-[var(--color-error)] rounded-lg text-sm"
                    >
                      Reset Session Count to 0
                    </button>
                    <button
                      onClick={simulateForgottenActivity}
                      className="w-full py-2 px-4 bg-[rgba(249,115,22,0.2)] text-[var(--color-accent)] rounded-lg text-sm"
                    >
                      Simulate Forgotten Activity (3h ago)
                    </button>
                    <button
                      onClick={clearActivityState}
                      className="w-full py-2 px-4 bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] rounded-lg text-sm"
                    >
                      Clear Activity State
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {recDebug ? (
                    <>
                      {/* Source badge */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          recDebug.source === 'recent_match' ? 'bg-green-500/20 text-green-400' :
                          recDebug.source === 'similar_sessions' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {recDebug.source === 'recent_match' ? '✓ Recent Match' :
                           recDebug.source === 'similar_sessions' ? '📊 Similar Sessions' :
                           '🎯 Fallback Defaults'}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {new Date(recDebug.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Input section */}
                      <div className="bg-[rgba(255,255,255,0.05)] rounded-lg p-3">
                        <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">📍 INPUT</div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>Activity: <span className="font-mono text-[var(--color-accent)]">{recDebug.activity}</span></div>
                          <div>Temp: <span className="font-mono">{formatTemperature(recDebug.inputWeather.temperature, temperatureUnit)}</span></div>
                          <div>Feels: <span className="font-mono">{formatTemperature(recDebug.inputWeather.feelsLike, temperatureUnit)}</span></div>
                          <div>Wind: <span className="font-mono">{formatWindSpeed(recDebug.inputWeather.windSpeed, temperatureUnit)}</span></div>
                          <div>Precip: <span className="font-mono">{formatPrecipitation(recDebug.inputWeather.precipitation, temperatureUnit)}</span></div>
                          <div>UV: <span className="font-mono">{recDebug.inputWeather.uvIndex}</span></div>
                        </div>
                        <div className="text-xs mt-1 text-[var(--color-text-muted)]">
                          "{recDebug.inputWeather.description}"
                        </div>
                        {recDebug.inputWeather.sunrise && (
                          <div className="text-xs mt-1">
                            🌅 {recDebug.inputWeather.sunrise} → 🌇 {recDebug.inputWeather.sunset}
                          </div>
                        )}
                      </div>

                      {/* T_comfort calculation */}
                      <div className="bg-[rgba(255,255,255,0.05)] rounded-lg p-3">
                        <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">🌡️ T_COMFORT CALCULATION</div>
                        <div className="text-xs mb-2 text-[var(--color-text-muted)]">
                          {recDebug.comfortAdjustment.intensityAdjustment !== undefined && recDebug.comfortAdjustment.intensityAdjustment !== 0
                            ? 'T = Actual + B + I + (wΔ × Δ) + Thermal'
                            : 'T = Actual + B + (wΔ × Δ) + Thermal'}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>Actual: <span className="font-mono">{recDebug.comfortAdjustment.actualTempC.toFixed(1)}°C</span></div>
                          <div>Feels Like: <span className="font-mono">{recDebug.comfortAdjustment.feelsLikeTempC.toFixed(1)}°C</span></div>
                          <div>Δ (clamped): <span className="font-mono">{recDebug.comfortAdjustment.delta >= 0 ? '+' : ''}{recDebug.comfortAdjustment.delta.toFixed(1)}°C</span></div>
                          <div>B (activity): <span className="font-mono text-[var(--color-accent)]">+{recDebug.comfortAdjustment.B.toFixed(1)}°C</span></div>
                          {recDebug.comfortAdjustment.intensityAdjustment !== undefined && recDebug.comfortAdjustment.intensityAdjustment !== 0 && (
                            <div>I (intensity): <span className={`font-mono ${
                              recDebug.comfortAdjustment.intensityAdjustment > 0 ? 'text-blue-400' :
                              recDebug.comfortAdjustment.intensityAdjustment < 0 ? 'text-green-400' : ''
                            }`}>{recDebug.comfortAdjustment.intensityAdjustment >= 0 ? '+' : ''}{recDebug.comfortAdjustment.intensityAdjustment.toFixed(1)}°C</span></div>
                          )}
                          <div>wΔ: <span className="font-mono">{recDebug.comfortAdjustment.wDelta.toFixed(2)}</span></div>
                          <div>wΔ × Δ: <span className="font-mono">{(recDebug.comfortAdjustment.wDelta * recDebug.comfortAdjustment.delta) >= 0 ? '+' : ''}{(recDebug.comfortAdjustment.wDelta * recDebug.comfortAdjustment.delta).toFixed(1)}°C</span></div>
                          <div>Thermal: <span className={`font-mono ${
                            recDebug.comfortAdjustment.thermalOffset > 0 ? 'text-blue-400' :
                            recDebug.comfortAdjustment.thermalOffset < 0 ? 'text-red-400' : ''
                          }`}>{recDebug.comfortAdjustment.thermalOffset >= 0 ? '+' : ''}{recDebug.comfortAdjustment.thermalOffset.toFixed(1)}°C</span></div>
                        </div>
                        <div className="text-xs mt-2 pt-2 border-t border-[rgba(255,255,255,0.1)]">
                          <strong>T_comfort:</strong> <span className="font-mono text-lg text-[var(--color-success)]">{recDebug.comfortAdjustment.comfortTempC.toFixed(1)}°C</span>
                          <span className="text-[var(--color-text-muted)] ml-2">({recDebug.comfortAdjustment.comfortTempF.toFixed(0)}°F)</span>
                          <span className="ml-2 px-1 py-0.5 rounded bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)]">
                            {recDebug.comfortAdjustment.tempRange}
                          </span>
                        </div>
                      </div>

                      {/* Matching */}
                      <div className="bg-[rgba(255,255,255,0.05)] rounded-lg p-3">
                        <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">🎯 MATCHING</div>
                        <div className="text-xs">
                          History: <span className="font-mono">{recDebug.totalHistory.runs} runs + {recDebug.totalHistory.feedback} feedback</span>
                        </div>
                        <div className="text-xs">
                          Similar found: <span className="font-mono font-bold text-[var(--color-accent)]">{recDebug.similarMatches.length}</span>
                        </div>
                        {recDebug.similarMatches.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {recDebug.similarMatches.slice(0, 5).map((m, i) => (
                              <div key={i} className="text-xs flex items-center gap-2">
                                <span className="w-4 text-[var(--color-text-muted)]">#{i+1}</span>
                                <span className="font-mono">{m.date}</span>
                                <span className={`px-1 rounded ${m.score >= 0.8 ? 'bg-green-500/20 text-green-400' : m.score >= 0.6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20'}`}>
                                  {Math.round(m.score * 100)}%
                                </span>
                                {m.isFromFeedback && <span className="text-blue-400">📝</span>}
                                {m.comfort === 'just_right' && <span className="text-green-400">✓</span>}
                                {m.comfort === 'too_hot' && <span className="text-red-400">🔥</span>}
                                {m.comfort === 'too_cold' && <span className="text-blue-400">❄️</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Voting */}
                      {recDebug.clothingVotes.length > 0 && (
                        <div className="bg-[rgba(255,255,255,0.05)] rounded-lg p-3">
                          <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">🗳️ VOTES</div>
                          <div className="space-y-1">
                            {recDebug.clothingVotes.filter(v => v.votes.length > 0).slice(0, 6).map((v, i) => (
                              <div key={i} className="text-xs">
                                <span className="text-[var(--color-text-muted)] w-20 inline-block">{v.category}:</span>
                                <span className="font-medium text-[var(--color-accent)]">{v.winner}</span>
                                {v.votes.length > 1 && (
                                  <span className="text-[var(--color-text-muted)] ml-1">
                                    ({v.votes.slice(0, 3).map(vote => `${vote.item}:${vote.count}`).join(', ')})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safety overrides */}
                      <div className="bg-[rgba(255,255,255,0.05)] rounded-lg p-3">
                        <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">🛡️ SAFETY</div>
                        <div className="space-y-1">
                          {recDebug.safetyOverrides.map((s, i) => (
                            <div key={i} className={`text-xs flex items-center gap-2 ${s.triggered ? '' : 'opacity-50'}`}>
                              <span className={`w-4 h-4 flex items-center justify-center rounded ${s.triggered ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20'}`}>
                                {s.triggered ? '✓' : '·'}
                              </span>
                              <span>{s.name}</span>
                              {s.triggered && s.action && (
                                <span className="text-[var(--color-accent)]">{s.action}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Final recommendation */}
                      <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-[var(--color-accent)]">✅ FINAL</span>
                          <span className="text-xs font-mono">Confidence: {recDebug.confidence}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(recDebug.finalRecommendation)
                            .filter(([, v]) => v && v.toLowerCase() !== 'none')
                            .map(([k, v]) => (
                              <span key={k} className="px-2 py-0.5 bg-[rgba(255,255,255,0.1)] rounded text-xs">
                                {v}
                              </span>
                            ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-[var(--color-text-muted)] py-8">
                      <div className="text-3xl mb-2">🤷</div>
                      <p>No recommendation data yet</p>
                      <p className="text-xs mt-1">Go to Home and get a recommendation first</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 border-t border-[rgba(255,255,255,0.1)]">
              <button
                onClick={() => setShowDebugInfo(false)}
                className="w-full py-3 bg-[rgba(255,255,255,0.1)] text-[var(--color-text-primary)] rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
