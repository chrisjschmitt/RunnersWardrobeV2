import { useState, useEffect, useCallback } from 'react';
import type { WeatherData, ClothingRecommendation as ClothingRec, ClothingItems, RunFeedback, ComfortLevel, TestWeatherData, ActivityType, ThermalPreference, ActivityLevel, ActivityDuration } from '../types';
import { ACTIVITY_CONFIGS, THERMAL_OFFSETS } from '../types';
import { getCurrentPosition, fetchWeather, clearWeatherCache } from '../services/weatherApi';
import { getClothingRecommendation, getFallbackRecommendation, calculateComfortTemperature } from '../services/recommendationEngine';
import { getAllRuns, getAllFeedback, addFeedback, getSettings, saveSettings } from '../services/database';
import { incrementSessionCount } from './BackupReminder';
import { WeatherDisplay } from './WeatherDisplay';
import { ClothingRecommendation } from './ClothingRecommendation';
import { FeedbackModal } from './FeedbackModal';
import type { TemperatureUnit } from '../services/temperatureUtils';
import { formatTemperature } from '../services/temperatureUtils';

type RunState = 'idle' | 'running' | 'feedback';

interface StartRunProps {
  apiKey: string;
  hasApiKey: boolean;
  temperatureUnit: TemperatureUnit;
  thermalPreference?: ThermalPreference;
  onNeedApiKey: () => void;
  testMode?: boolean;
  testWeather?: TestWeatherData | null;
  activity?: ActivityType;
}

// Activity state persistence helpers
const ACTIVITY_STATE_KEY = 'trailkit_activity_state';

interface PersistedActivityState {
  activity: ActivityType;
  state: RunState;
  startTime: string | null;
  clothing: ClothingItems | null;
  startWeather: string | null; // Serialized WeatherData JSON
}

// Serialize WeatherData for localStorage (convert Date objects to ISO strings)
function serializeWeather(weather: WeatherData | null): string | null {
  if (!weather) return null;
  return JSON.stringify({
    ...weather,
    timestamp: weather.timestamp.toISOString(),
    forecast: weather.forecast?.map(f => ({
      ...f,
      time: f.time.toISOString()
    })),
    sunrise: weather.sunrise?.toISOString(),
    sunset: weather.sunset?.toISOString()
  });
}

// Deserialize WeatherData from localStorage (convert ISO strings back to Date objects)
function deserializeWeather(weatherJson: string | null): WeatherData | null {
  if (!weatherJson) return null;
  try {
    const data = JSON.parse(weatherJson);
    return {
      ...data,
      timestamp: new Date(data.timestamp),
      forecast: data.forecast?.map((f: any) => ({
        ...f,
        time: new Date(f.time)
      })),
      sunrise: data.sunrise ? new Date(data.sunrise) : undefined,
      sunset: data.sunset ? new Date(data.sunset) : undefined
    };
  } catch {
    return null;
  }
}

function saveActivityState(activity: ActivityType, state: RunState, startTime: Date | null, clothing: ClothingItems | null, startWeather: WeatherData | null = null) {
  const data: PersistedActivityState = {
    activity,
    state,
    startTime: startTime?.toISOString() || null,
    clothing,
    startWeather: serializeWeather(startWeather)
  };
  localStorage.setItem(ACTIVITY_STATE_KEY, JSON.stringify(data));
}

function loadActivityState(): (PersistedActivityState & { startWeatherData: WeatherData | null }) | null {
  try {
    const data = localStorage.getItem(ACTIVITY_STATE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as PersistedActivityState;
    return {
      ...parsed,
      startWeatherData: deserializeWeather(parsed.startWeather)
    };
  } catch {
    return null;
  }
}

// Check if weather changed significantly (>5°C temp, precipitation change, >15 km/h wind change)
function hasSignificantWeatherChange(startWeather: WeatherData | null, currentWeather: WeatherData | null): boolean {
  if (!startWeather || !currentWeather) return false;
  
  const tempDiff = Math.abs(currentWeather.temperature - startWeather.temperature);
  const precipitationChange = (startWeather.precipitation === 0) !== (currentWeather.precipitation === 0);
  const windDiff = Math.abs(currentWeather.windSpeed - startWeather.windSpeed);
  
  return tempDiff > 5 || precipitationChange || windDiff > 15;
}

function clearActivityState() {
  localStorage.removeItem(ACTIVITY_STATE_KEY);
}

export function StartRun({ apiKey, hasApiKey, temperatureUnit, thermalPreference = 'average', onNeedApiKey, testMode = false, testWeather, activity = 'running' }: StartRunProps) {
  const activityConfig = ACTIVITY_CONFIGS[activity];
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recommendation, setRecommendation] = useState<ClothingRec | null>(null);
  const [fallback, setFallback] = useState<ClothingItems | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingRec, setIsLoadingRec] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [runState, setRunState] = useState<RunState>('idle');
  const [runStartTime, setRunStartTime] = useState<Date | null>(null);
  const [actualClothing, setActualClothing] = useState<ClothingItems | null>(null);
  const [hasUserEdits, setHasUserEdits] = useState(false); // Track if user has made edits
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [comfortAdjustment, setComfortAdjustment] = useState<number>(0);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateCheckResult, setUpdateCheckResult] = useState<'upToDate' | null>(null);
  const [showForgottenReminder, setShowForgottenReminder] = useState(false);
  const [forgottenDuration, setForgottenDuration] = useState('');
  const [expertMode, setExpertMode] = useState(false);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | undefined>(undefined);
  const [duration, setDuration] = useState<ActivityDuration | undefined>(undefined);
  const [startWeather, setStartWeather] = useState<WeatherData | null>(null); // Weather at activity start
  const [showWeatherChoice, setShowWeatherChoice] = useState(false); // Show weather choice prompt
  const [useStartWeather, setUseStartWeather] = useState(true); // Which weather to use when saving

  // Load expert mode settings on mount
  useEffect(() => {
    const loadExpertSettings = async () => {
      try {
        const settings = await getSettings();
        if (settings) {
          setExpertMode(settings.expertMode || false);
          if (settings.expertMode) {
            setActivityLevel(settings.lastActivityLevel);
            setDuration(settings.lastDuration);
          }
        }
      } catch (err) {
        console.error('Failed to load expert settings:', err);
      }
    };
    loadExpertSettings();
  }, []);

  // Restore activity state from localStorage on mount
  useEffect(() => {
    const saved = loadActivityState();
    if (saved && saved.state === 'running') {
      // Check if this is for the current activity
      if (saved.activity === activity) {
        // Restore start weather if available
        if (saved.startWeatherData) {
          setStartWeather(saved.startWeatherData);
        }
        
        // Check if it's been running too long (2+ hours)
        if (saved.startTime) {
          const elapsed = Date.now() - new Date(saved.startTime).getTime();
          const hours = elapsed / (1000 * 60 * 60);
          if (hours >= 2) {
            // Don't restore to running - show reminder instead
            setRunState('idle');
            setShowForgottenReminder(true);
            setForgottenDuration(formatDuration(elapsed));
            setRunStartTime(new Date(saved.startTime));
            setActualClothing(saved.clothing);
            return;
          }
        }
        
        // Less than 2 hours - restore normally
        setRunState('running');
        setRunStartTime(saved.startTime ? new Date(saved.startTime) : null);
        setActualClothing(saved.clothing);
      } else {
        // Different activity is running - ensure we're in idle state
        // This prevents showing "Start" button when another activity is active
        setRunState('idle');
      }
    } else {
      // No activity running - ensure idle state
      setRunState('idle');
    }
  }, [activity]);

  // Check for forgotten activity on focus/visibility change
  useEffect(() => {
    const checkForgotten = () => {
      const saved = loadActivityState();
      if (saved && saved.state === 'running' && saved.startTime && saved.activity === activity) {
        // Restore start weather if available
        if (saved.startWeatherData) {
          setStartWeather(saved.startWeatherData);
        }
        const elapsed = Date.now() - new Date(saved.startTime).getTime();
        const hours = elapsed / (1000 * 60 * 60);
        if (hours >= 2) {
          setShowForgottenReminder(true);
          setForgottenDuration(formatDuration(elapsed));
          setRunStartTime(new Date(saved.startTime));
          setActualClothing(saved.clothing);
        }
      }
    };

    window.addEventListener('focus', checkForgotten);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForgotten();
      }
    });

    return () => {
      window.removeEventListener('focus', checkForgotten);
    };
  }, [activity]);

  // Format duration for display
  function formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  }

  // Check for service worker updates
  const checkForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateCheckResult(null);
    
    try {
      // First check if there's a waiting service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          setUpdateAvailable(true);
          setIsCheckingUpdate(false);
          return;
        }
        
        // Trigger an update check
        if (registration) {
          await registration.update();
          
          // Listen for new service worker installing
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  setIsCheckingUpdate(false);
                }
              });
            }
          });
        }
      }
      
      // After a delay, if no update was found, show "up to date" message
      setTimeout(() => {
        setIsCheckingUpdate(false);
        if (!updateAvailable) {
          setUpdateCheckResult('upToDate');
          // Clear the message after 3 seconds
          setTimeout(() => setUpdateCheckResult(null), 3000);
        }
      }, 2000);
      
    } catch (err) {
      console.log('Update check failed:', err);
      setIsCheckingUpdate(false);
    }
  };

  // Apply update by clearing cache and reloading
  const applyUpdate = async () => {
    setIsUpdating(true);
    try {
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      // Reload
      window.location.reload();
    } catch (err) {
      console.error('Update failed:', err);
      setIsUpdating(false);
    }
  };

  // Separate function to calculate recommendations (defined first so it can be called by loadWeatherAndRecommendations)
  const calculateRecommendations = useCallback(async (weatherData?: WeatherData) => {
    const currentWeather = weatherData || weather;
    if (!currentWeather) return;

    // If Expert Mode is enabled, require both activity level and duration
    if (expertMode && (!activityLevel || !duration)) {
      return;
    }

    setIsLoadingRec(true);
    try {
      const [runs, feedbackHistory] = await Promise.all([
        getAllRuns(activity),
        getAllFeedback(activity)
      ]);
      
      setFeedbackCount(feedbackHistory.length);
      
      // Use thermal preference setting for comfort adjustment
      const thermalOffset = THERMAL_OFFSETS[thermalPreference];
      setComfortAdjustment(thermalOffset);
      
      const currentActivityLevel = expertMode ? activityLevel : undefined;
      
      if (runs.length > 0 || feedbackHistory.length > 0) {
        const rec = getClothingRecommendation(currentWeather, runs, feedbackHistory, activity, thermalPreference, currentActivityLevel);
        
        // If no similar runs found (confidence would be 0), use fallback instead
        // This shows "Using activity defaults" message instead of "0% confidence"
        if (rec.matchingRuns === 0) {
          const fallbackRec = getFallbackRecommendation(currentWeather, feedbackHistory, activity, thermalPreference, currentActivityLevel);
          setFallback(fallbackRec);
          setRecommendation(null);
          if (!hasUserEdits) {
            setActualClothing(fallbackRec);
          }
        } else {
          setRecommendation(rec);
          setFallback(null);
          // Only update actualClothing if user hasn't made edits
          if (!hasUserEdits) {
            setActualClothing(rec.clothing);
          }
        }
      } else {
        const fallbackRec = getFallbackRecommendation(currentWeather, feedbackHistory, activity, thermalPreference, currentActivityLevel);
        setFallback(fallbackRec);
        setRecommendation(null);
        // Only update actualClothing if user hasn't made edits
        if (!hasUserEdits) {
          setActualClothing(fallbackRec);
        }
      }
    } catch (err) {
      console.error('Failed to calculate recommendations:', err);
    } finally {
      setIsLoadingRec(false);
    }
  }, [weather, activity, thermalPreference, expertMode, activityLevel, duration, hasUserEdits]);

  // Helper to get appropriate weather icon for test mode
  const getTestWeatherIcon = (tw: TestWeatherData): string => {
    const desc = tw.description.toLowerCase();
    if (desc.includes('rain')) return '10d';
    if (desc.includes('snow')) return '13d';
    if (desc.includes('cloud') || desc.includes('overcast')) return '04d';
    if (desc.includes('partly')) return '02d';
    if (desc.includes('fog')) return '50d';
    if (tw.cloudCover > 70) return '04d';
    if (tw.cloudCover > 30) return '03d';
    return '01d'; // Clear
  };

  const loadWeatherAndRecommendations = async (forceRefresh = false) => {
    if (!hasApiKey && !testMode) {
      onNeedApiKey();
      return;
    }

    setError(null);
    setIsLoadingWeather(true);

    try {
      let weatherData: WeatherData;

      if (testMode && testWeather) {
        // Use test weather data with simulated sunrise/sunset
        const today = new Date();
        const sunrise = new Date(today);
        sunrise.setHours(6, 30, 0, 0); // 6:30 AM
        const sunset = new Date(today);
        sunset.setHours(18, 30, 0, 0); // 6:30 PM
        
        weatherData = {
          temperature: testWeather.temperature,
          feelsLike: testWeather.feelsLike,
          humidity: testWeather.humidity,
          pressure: 30,
          precipitation: testWeather.precipitation,
          uvIndex: 5,
          windSpeed: testWeather.windSpeed,
          cloudCover: testWeather.cloudCover,
          description: testWeather.description,
          icon: getTestWeatherIcon(testWeather),
          location: '🧪 Test Mode',
          timestamp: new Date(),
          sunrise,
          sunset
        };
      } else {
        // Get location
        const position = await getCurrentPosition();
        
        // Fetch weather
        if (forceRefresh) {
          clearWeatherCache();
        }
        weatherData = await fetchWeather(apiKey, position, forceRefresh);
      }

      setWeather(weatherData);
      setLastUpdate(new Date());

      // If Expert Mode is enabled, wait for activity level/duration before calculating
      // Otherwise, calculate immediately
      if (!expertMode || (expertMode && activityLevel && duration)) {
        await calculateRecommendations(weatherData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    if (hasApiKey || testMode) {
      loadWeatherAndRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiKey, apiKey, testMode, testWeather, activity]);

  // Recalculate recommendations when activity level or duration changes (if Expert Mode enabled and weather is loaded)
  useEffect(() => {
    if (weather && expertMode && activityLevel && duration) {
      calculateRecommendations();
    }
  }, [weather, expertMode, activityLevel, duration, calculateRecommendations]);

  const handleClothingChange = (clothing: ClothingItems) => {
    setActualClothing(clothing);
    setHasUserEdits(true); // Mark that user has made edits
  };

  // Save activity level immediately when changed
  const handleActivityLevelChange = async (level: ActivityLevel) => {
    setActivityLevel(level);
    if (expertMode) {
      try {
        const settings = await getSettings();
        if (settings) {
          await saveSettings({
            ...settings,
            lastActivityLevel: level
          });
        }
      } catch (err) {
        console.error('Failed to save activity level:', err);
      }
    }
  };

  // Save duration immediately when changed
  const handleDurationChange = async (dur: ActivityDuration) => {
    setDuration(dur);
    if (expertMode) {
      try {
        const settings = await getSettings();
        if (settings) {
          await saveSettings({
            ...settings,
            lastDuration: dur
          });
        }
      } catch (err) {
        console.error('Failed to save duration:', err);
      }
    }
  };

  const handleStartRun = async () => {
    const startTime = new Date();
    // Save current weather when activity starts
    const weatherAtStart = weather;
    if (weatherAtStart) {
      setStartWeather(weatherAtStart);
    }
    setRunState('running');
    setRunStartTime(startTime);
    setShowForgottenReminder(false);
    setShowWeatherChoice(false);
    setUseStartWeather(true); // Default to start weather
    // Persist state so it survives app close
    saveActivityState(activity, 'running', startTime, actualClothing, weatherAtStart || null);
  };

  const handleEndRun = () => {
    // Check if weather changed significantly
    if (runStartTime && startWeather && weather) {
      const elapsed = Date.now() - runStartTime.getTime();
      const hours = elapsed / (1000 * 60 * 60);
      
      // Show weather choice if:
      // 1. Activity ran >2 hours AND weather changed significantly (normal case)
      // 2. OR in test mode AND weather changed significantly (for testing)
      if (hasSignificantWeatherChange(startWeather, weather) && (hours >= 2 || testMode)) {
        // Show weather choice prompt before feedback
        setShowWeatherChoice(true);
        return;
      }
    }
    
    // No significant change or <2 hours (and not test mode) - proceed to feedback with start weather
    setRunState('feedback');
  };

  const handleFeedbackSubmit = async (comfort: ComfortLevel, clothing: ClothingItems, comments?: string) => {
    // Use start weather if available and user selected it, otherwise use current weather
    const weatherToSave = (useStartWeather && startWeather) ? startWeather : weather;
    if (!weatherToSave) return;

    // Use local date instead of UTC to avoid timezone issues
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const feedback: Omit<RunFeedback, 'id'> = {
      date: localDate,
      temperature: weatherToSave.temperature,
      feelsLike: weatherToSave.feelsLike,
      humidity: weatherToSave.humidity,
      windSpeed: weatherToSave.windSpeed,
      precipitation: weatherToSave.precipitation,
      cloudCover: weatherToSave.cloudCover,
      clothing: clothing, // Store what they actually wore (possibly adjusted)
      comfort,
      timestamp: new Date(),
      activity,
      comments, // Optional user notes
      activityLevel: expertMode ? activityLevel : undefined, // Only include if expert mode enabled
      duration: expertMode ? duration : undefined // Only include if expert mode enabled
    };

    await addFeedback(feedback);
    setFeedbackCount(prev => prev + 1);
    setRunState('idle');
    setHasUserEdits(false); // Reset edits flag after submitting feedback
    setShowForgottenReminder(false);
    setShowWeatherChoice(false);
    
    // Clear persisted activity state
    clearActivityState();
    
    // Reset weather tracking
    setStartWeather(null);
    setUseStartWeather(true);
    
    // Track session for backup reminder
    incrementSessionCount();
    
    // Refresh recommendations with new feedback
    loadWeatherAndRecommendations(false);
  };

  const handleFeedbackCancel = () => {
    setRunState('idle');
    setShowForgottenReminder(false);
    setShowWeatherChoice(false);
    // Clear persisted activity state
    clearActivityState();
    // Reset weather tracking
    setStartWeather(null);
    setUseStartWeather(true);
  };

  if (!hasApiKey) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card p-8 text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">API Key Required</h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            To get weather data, you need a free OpenWeatherMap API key.
          </p>
          <button onClick={onNeedApiKey} className="btn-primary">
            Set Up API Key
          </button>
        </div>
      </div>
    );
  }

  // Running state UI
  if (runState === 'running') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass-card p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-accent)] flex items-center justify-center animate-pulse-glow">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">{activityConfig.icon} {activityConfig.name} in progress...</h2>
          <p className="text-[var(--color-text-muted)] mb-4">
            Started at {runStartTime?.toLocaleTimeString()}
          </p>
          
          {weather && (
            <div className="mb-4">
              <WeatherDisplay weather={weather} unit={temperatureUnit} compact activity={activity} thermalPreference={thermalPreference} activityLevel={expertMode ? activityLevel : undefined} />
            </div>
          )}
          
          {/* Extreme temperature warning during run */}
          {weather && (() => {
            const comfortInfo = calculateComfortTemperature(weather, activity, thermalPreference, expertMode ? activityLevel : undefined);
            if (comfortInfo.comfortTempC < -15) {
              return (
                <div className="p-4 bg-[rgba(239,68,68,0.25)] border-2 border-red-500/70 rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm text-red-400 font-bold mb-1">Dangerous cold - lung health risk!</p>
                      <p className="text-xs text-red-300/80">Consider moving indoors or reducing intensity. Use mask/buff to warm air.</p>
                    </div>
                  </div>
                </div>
              );
            }
            if (comfortInfo.comfortTempC < -9.4) {
              return (
                <div className="p-3 bg-[rgba(239,68,68,0.2)] border border-red-500/50 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-red-400 font-medium">Extreme cold - protect exposed skin!</p>
                  </div>
                </div>
              );
            }
            if (comfortInfo.comfortTempC > 29.4) {
              return (
                <div className="p-3 bg-[rgba(251,146,60,0.2)] border border-orange-500/50 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-orange-400 font-medium">Extreme heat - prioritize cooling and hydration!</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Show what they're wearing during the run - still editable */}
        {actualClothing && (
          <ClothingRecommendation 
            recommendation={recommendation}
            fallback={fallback}
            currentClothing={actualClothing}
            isLoading={false}
            editable={true}
            onClothingChange={handleClothingChange}
            activity={activity}
            temperatureUnit={temperatureUnit}
            thermalPreference={thermalPreference}
            weather={weather || undefined}
            activityLevel={expertMode ? activityLevel : undefined}
          />
        )}

        <button
          onClick={handleEndRun}
          className="btn-primary w-full text-lg py-4 bg-gradient-to-r from-[var(--color-success)] to-emerald-500"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            End {activityConfig.name}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weather choice modal - shown when significant weather change detected */}
      {showWeatherChoice && startWeather && weather && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-6 w-full max-w-md animate-slide-up">
            <h2 className="text-xl font-bold text-center mb-2">Weather Changed During Activity</h2>
            <p className="text-[var(--color-text-muted)] text-center text-sm mb-4">
              The weather has changed significantly since you started. Which weather should we save with your activity?
            </p>
            
            <div className="space-y-3 mb-6">
              {/* Start weather option */}
              <button
                onClick={() => {
                  setUseStartWeather(true);
                  setShowWeatherChoice(false);
                  setRunState('feedback');
                }}
                className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                  useStartWeather
                    ? 'bg-[rgba(34,197,94,0.15)] border-[var(--color-success)]'
                    : 'bg-[rgba(255,255,255,0.05)] border-transparent hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌡️</span>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">Start Weather</div>
                    <div className="text-sm text-[var(--color-text-muted)]">
                      {formatTemperature(startWeather.temperature, temperatureUnit)} • {startWeather.description}
                      {runStartTime && (
                        <span className="block mt-1">at {runStartTime.toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                  {useStartWeather && (
                    <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
              
              {/* Current weather option */}
              <button
                onClick={() => {
                  setUseStartWeather(false);
                  setShowWeatherChoice(false);
                  setRunState('feedback');
                }}
                className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                  !useStartWeather
                    ? 'bg-[rgba(34,197,94,0.15)] border-[var(--color-success)]'
                    : 'bg-[rgba(255,255,255,0.05)] border-transparent hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌡️</span>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">Current Weather</div>
                    <div className="text-sm text-[var(--color-text-muted)]">
                      {formatTemperature(weather.temperature, temperatureUnit)} • {weather.description}
                      <span className="block mt-1">now</span>
                    </div>
                  </div>
                  {!useStartWeather && (
                    <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
            
            <div className="text-xs text-[var(--color-text-muted)] text-center mb-4">
              💡 Tip: Use start weather for accurate recommendations based on what you actually experienced.
            </div>
            
            <button
              onClick={() => {
                setShowWeatherChoice(false);
                // Default to start weather if cancelled
                setUseStartWeather(true);
              }}
              className="btn-secondary w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Feedback modal */}
      {runState === 'feedback' && actualClothing && (
        <FeedbackModal
          onSubmit={handleFeedbackSubmit}
          onCancel={handleFeedbackCancel}
          activityName={activityConfig.name.toLowerCase()}
          clothing={actualClothing}
          activity={activity}
        />
      )}

      {/* Forgotten activity reminder */}
      {showForgottenReminder && runState === 'idle' && (
        <div className="glass-card p-4 border-2 border-[var(--color-warning)] animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏰</span>
            <div className="flex-1">
              <p className="font-semibold text-[var(--color-warning)] mb-1">
                Did you forget to end your {activityConfig.name.toLowerCase()}?
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                You started {forgottenDuration} ago. What would you like to do?
              </p>
              
              {/* Show weather comparison if significant change detected */}
              {startWeather && weather && hasSignificantWeatherChange(startWeather, weather) && (
                <div className="p-3 mb-3 bg-[rgba(251,146,60,0.15)] border border-orange-500/50 rounded-lg">
                  <p className="text-sm font-medium text-orange-300 mb-2">⚠️ Weather changed:</p>
                  <div className="space-y-1 text-xs text-orange-200/90">
                    <div>Start: {formatTemperature(startWeather.temperature, temperatureUnit)} • {startWeather.description}</div>
                    <div>Now: {formatTemperature(weather.temperature, temperatureUnit)} • {weather.description}</div>
                  </div>
                  <p className="text-xs text-orange-300/80 mt-2">You'll choose which weather to save when ending.</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    // Resume the activity - go back to running state
                    const saved = loadActivityState();
                    if (saved) {
                      setRunState('running');
                      setRunStartTime(saved.startTime ? new Date(saved.startTime) : new Date());
                      setActualClothing(saved.clothing);
                      // Restore start weather if available
                      if (saved.startWeatherData) {
                        setStartWeather(saved.startWeatherData);
                      }
                    }
                    setShowForgottenReminder(false);
                  }}
                  className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium"
                >
                  I'm still going!
                </button>
                <button
                  onClick={() => {
                    // Check for significant weather changes before ending
                    if (startWeather && weather) {
                      const elapsed = runStartTime ? Date.now() - runStartTime.getTime() : 0;
                      const hours = elapsed / (1000 * 60 * 60);
                      
                      // Show weather choice if weather changed significantly and:
                      // - Activity >2 hours (normal case), OR
                      // - In test mode (for testing)
                      if (hasSignificantWeatherChange(startWeather, weather) && (hours >= 2 || testMode)) {
                        setShowWeatherChoice(true);
                        setShowForgottenReminder(false);
                        return;
                      }
                    }
                    // No significant change or conditions not met - proceed to feedback
                    setRunState('feedback');
                    setShowForgottenReminder(false);
                  }}
                  className="px-4 py-2 bg-[var(--color-success)] text-white rounded-lg text-sm font-medium"
                >
                  End & Give Feedback
                </button>
                <button
                  onClick={() => {
                    // Discard the activity
                    clearActivityState();
                    setShowForgottenReminder(false);
                    setRunState('idle');
                  }}
                  className="px-4 py-2 bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] rounded-lg text-sm"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ready to Go?</h1>
          {lastUpdate && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Updated {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            loadWeatherAndRecommendations(true);
            checkForUpdates();
          }}
          disabled={isLoadingWeather}
          className="btn-secondary flex items-center gap-2"
        >
          <svg 
            className={`w-4 h-4 ${isLoadingWeather ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Checking for updates indicator */}
      {isCheckingUpdate && !updateAvailable && (
        <div className="p-2 text-center text-sm text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Checking for updates...
          </span>
        </div>
      )}

      {/* Up to date message */}
      {updateCheckResult === 'upToDate' && !updateAvailable && (
        <div className="p-2 text-center text-sm text-[var(--color-success)]">
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            App is up to date!
          </span>
        </div>
      )}

      {/* Update available banner */}
      {updateAvailable && (
        <div className="p-3 bg-[rgba(59,130,246,0.2)] border border-blue-500/50 rounded-lg animate-slide-up">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm text-blue-300">New version available!</span>
            </div>
            <button
              onClick={applyUpdate}
              disabled={isUpdating}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
            </button>
          </div>
        </div>
      )}

      {/* Personalization badge */}
      {feedbackCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 bg-[rgba(34,197,94,0.2)] text-[var(--color-success)] rounded-full flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Personalized
          </span>
          <span className="text-[var(--color-text-muted)]">
            Based on {feedbackCount} {feedbackCount === 1 ? 'run' : 'runs'} of feedback
            {comfortAdjustment !== 0 && (
              <span className="ml-1">
                ({comfortAdjustment < 0 ? 'you run cold' : 'you run hot'})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="glass-card p-4 border border-[var(--color-error)] animate-fade-in">
          <p className="text-[var(--color-error)] flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
          <button 
            onClick={() => loadWeatherAndRecommendations(true)}
            className="btn-secondary mt-3 text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoadingWeather && !weather && (
        <div className="glass-card p-8 text-center animate-fade-in">
          <div className="spinner animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-text-muted)]">Getting your location and weather...</p>
        </div>
      )}

      {/* Weather display */}
      {weather && <WeatherDisplay weather={weather} unit={temperatureUnit} activity={activity} thermalPreference={thermalPreference} activityLevel={expertMode ? activityLevel : undefined} />}

      {/* Expert Mode: Activity Level and Duration inputs - shown BEFORE recommendations */}
      {weather && expertMode && runState === 'idle' && (
        <div className="glass-card p-4 mb-4 animate-slide-up delay-200">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Activity Details
          </h3>
          
          <div className="space-y-4">
            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium mb-2">Intensity Level</label>
              <div className="flex gap-2">
                {(['low', 'moderate', 'high'] as ActivityLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleActivityLevelChange(level)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                      activityLevel === level
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDurationChange('short')}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                    duration === 'short'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  &lt; 1 hour
                </button>
                <button
                  onClick={() => handleDurationChange('long')}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                    duration === 'long'
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  ≥ 1 hour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extreme temperature warnings */}
      {weather && (() => {
        const comfortInfo = calculateComfortTemperature(weather, activity, thermalPreference, expertMode ? activityLevel : undefined);
        // Show strong warning if T_comfort is below -15°C (5°F) - potentially harmful to lungs
        if (comfortInfo.comfortTempC < -15) {
          return (
            <div className="p-4 bg-[rgba(239,68,68,0.25)] border-2 border-red-500/70 rounded-lg mb-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-bold text-red-400 mb-1">Dangerous Cold Warning</p>
                  <p className="text-sm text-[var(--color-text-muted)] mb-2">
                    Temperatures below -15°C (5°F) can cause permanent lung damage. Consider moving indoors, reducing intensity, or warming up inside first. Use a mask or buff to warm and humidify air.
                  </p>
                  <p className="text-xs text-red-300/80 italic">Full body coverage essential. Protect all exposed skin including face.</p>
                </div>
              </div>
            </div>
          );
        }
        // Show warning if T_comfort is below -9.4°C (15°F) - the "freezing" threshold
        if (comfortInfo.comfortTempC < -9.4) {
          return (
            <div className="p-3 bg-[rgba(239,68,68,0.2)] border border-red-500/50 rounded-lg mb-4 animate-slide-up">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-400">Extreme Cold Warning</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Full coverage recommended. Protect exposed skin.</p>
                </div>
              </div>
            </div>
          );
        }
        // Show warning if T_comfort is above 29.4°C (85°F) - extreme heat
        if (comfortInfo.comfortTempC > 29.4) {
          return (
            <div className="p-3 bg-[rgba(251,146,60,0.2)] border border-orange-500/50 rounded-lg mb-4 animate-slide-up">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-orange-400">Extreme Heat Warning</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Prioritize cooling and hydration.</p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Clothing recommendations - editable before starting run */}
      {weather && (
        <ClothingRecommendation 
          recommendation={recommendation}
          fallback={fallback}
          currentClothing={actualClothing}
          isLoading={isLoadingRec}
          editable={true}
          onClothingChange={handleClothingChange}
          activity={activity}
          temperatureUnit={temperatureUnit}
          thermalPreference={thermalPreference}
          weather={weather}
          activityLevel={expertMode ? activityLevel : undefined}
        />
      )}

      {/* Warning if different activity is running */}
      {(() => {
        const saved = loadActivityState();
        if (saved && saved.state === 'running' && saved.activity !== activity) {
          const otherActivityConfig = ACTIVITY_CONFIGS[saved.activity];
          return (
            <div className="glass-card p-4 border-2 border-[var(--color-warning)] animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-warning)] mb-1">
                    Another activity is running
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mb-3">
                    {otherActivityConfig?.icon} {otherActivityConfig?.name || saved.activity} is currently active. 
                    Please end that activity first before starting a new one.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Start run button */}
      {weather && !isLoadingRec && (() => {
        const saved = loadActivityState();
        const isOtherActivityRunning = !!(saved && saved.state === 'running' && saved.activity !== activity);
        return (
          <div className="animate-slide-up delay-400">
            <button 
              onClick={handleStartRun}
              disabled={(expertMode && runState === 'idle' && (!activityLevel || !duration)) || isOtherActivityRunning}
              className="btn-primary w-full text-lg py-4 animate-pulse-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start {activityConfig.name}!
              </span>
            </button>
          </div>
        );
      })()}
    </div>
  );
}
