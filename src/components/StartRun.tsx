import { useState, useEffect } from 'react';
import type { WeatherData, ClothingRecommendation as ClothingRec, ClothingItems, RunFeedback, ComfortLevel, TestWeatherData, ActivityType } from '../types';
import { ACTIVITY_CONFIGS } from '../types';
import { getCurrentPosition, fetchWeather, clearWeatherCache } from '../services/weatherApi';
import { getClothingRecommendation, getFallbackRecommendation, calculateComfortAdjustment } from '../services/recommendationEngine';
import { getAllRuns, getAllFeedback, addFeedback } from '../services/database';
import { WeatherDisplay } from './WeatherDisplay';
import { ClothingRecommendation } from './ClothingRecommendation';
import { FeedbackModal } from './FeedbackModal';
import type { TemperatureUnit } from '../services/temperatureUtils';

type RunState = 'idle' | 'running' | 'feedback';

interface StartRunProps {
  apiKey: string;
  hasApiKey: boolean;
  temperatureUnit: TemperatureUnit;
  onNeedApiKey: () => void;
  testMode?: boolean;
  testWeather?: TestWeatherData | null;
  activity?: ActivityType;
}

export function StartRun({ apiKey, hasApiKey, temperatureUnit, onNeedApiKey, testMode = false, testWeather, activity = 'running' }: StartRunProps) {
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

  // Check for service worker updates
  const checkForUpdates = async () => {
    if ('serviceWorker' in navigator) {
      setIsCheckingUpdate(true);
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Check if there's already a waiting service worker
          if (registration.waiting) {
            setUpdateAvailable(true);
            setIsCheckingUpdate(false);
            return;
          }
          
          // Trigger an update check
          await registration.update();
          
          // Listen for new service worker installing
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                // When the new SW is installed and waiting, show update banner
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  setIsCheckingUpdate(false);
                }
              });
            }
          });
          
          // Also check again after a short delay (update may have just completed)
          setTimeout(() => {
            if (registration.waiting) {
              setUpdateAvailable(true);
            }
            setIsCheckingUpdate(false);
          }, 2000);
        } else {
          setIsCheckingUpdate(false);
        }
      } catch (err) {
        console.log('Update check failed:', err);
        setIsCheckingUpdate(false);
      }
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

      // Generate recommendations (filter by activity)
      setIsLoadingRec(true);
      const [runs, feedbackHistory] = await Promise.all([
        getAllRuns(activity),
        getAllFeedback(activity)
      ]);
      
      setFeedbackCount(feedbackHistory.length);
      
      // Calculate and display comfort adjustment
      const adjustment = calculateComfortAdjustment(weatherData, feedbackHistory);
      setComfortAdjustment(adjustment.temperatureOffset);
      
      if (runs.length > 0 || feedbackHistory.length > 0) {
        const rec = getClothingRecommendation(weatherData, runs, feedbackHistory, activity);
        setRecommendation(rec);
        setFallback(null);
        // Only update actualClothing if user hasn't made edits
        if (!hasUserEdits) {
          setActualClothing(rec.clothing);
        }
      } else {
        const fallbackRec = getFallbackRecommendation(weatherData, feedbackHistory, activity);
        setFallback(fallbackRec);
        setRecommendation(null);
        // Only update actualClothing if user hasn't made edits
        if (!hasUserEdits) {
          setActualClothing(fallbackRec);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setIsLoadingWeather(false);
      setIsLoadingRec(false);
    }
  };

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

  useEffect(() => {
    if (hasApiKey || testMode) {
      loadWeatherAndRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiKey, apiKey, testMode, testWeather, activity]);

  const handleClothingChange = (clothing: ClothingItems) => {
    setActualClothing(clothing);
    setHasUserEdits(true); // Mark that user has made edits
  };

  const handleStartRun = () => {
    setRunState('running');
    setRunStartTime(new Date());
  };

  const handleEndRun = () => {
    setRunState('feedback');
  };

  const handleFeedbackSubmit = async (comfort: ComfortLevel, comments?: string) => {
    if (!weather || !actualClothing) return;

    // Use local date instead of UTC to avoid timezone issues
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const feedback: Omit<RunFeedback, 'id'> = {
      date: localDate,
      temperature: weather.temperature,
      feelsLike: weather.feelsLike,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      precipitation: weather.precipitation,
      cloudCover: weather.cloudCover,
      clothing: actualClothing, // Store what they actually wore, not what was recommended
      comfort,
      timestamp: new Date(),
      activity,
      comments // Optional user notes
    };

    await addFeedback(feedback);
    setFeedbackCount(prev => prev + 1);
    setRunState('idle');
    setHasUserEdits(false); // Reset edits flag after submitting feedback
    
    // Refresh recommendations with new feedback
    loadWeatherAndRecommendations(false);
  };

  const handleFeedbackCancel = () => {
    setRunState('idle');
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
              <WeatherDisplay weather={weather} unit={temperatureUnit} compact />
            </div>
          )}
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
      {/* Feedback modal */}
      {runState === 'feedback' && (
        <FeedbackModal
          onSubmit={handleFeedbackSubmit}
          onCancel={handleFeedbackCancel}
          activityName={activityConfig.name.toLowerCase()}
        />
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
                ({comfortAdjustment > 0 ? 'you run cold' : 'you run hot'})
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
      {weather && <WeatherDisplay weather={weather} unit={temperatureUnit} />}

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
        />
      )}

      {/* Start run button */}
      {weather && !isLoadingRec && (
        <div className="animate-slide-up delay-400">
          <button 
            onClick={handleStartRun}
            className="btn-primary w-full text-lg py-4 animate-pulse-glow"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start {activityConfig.name}!
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
