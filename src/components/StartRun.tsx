import { useState, useEffect } from 'react';
import type { WeatherData, ClothingRecommendation as ClothingRec, ClothingItems, RunFeedback, ComfortLevel } from '../types';
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
}

export function StartRun({ apiKey, hasApiKey, temperatureUnit, onNeedApiKey }: StartRunProps) {
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
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [comfortAdjustment, setComfortAdjustment] = useState<number>(0);

  const loadWeatherAndRecommendations = async (forceRefresh = false) => {
    if (!hasApiKey) {
      onNeedApiKey();
      return;
    }

    setError(null);
    setIsLoadingWeather(true);

    try {
      // Get location
      const position = await getCurrentPosition();
      
      // Fetch weather
      if (forceRefresh) {
        clearWeatherCache();
      }
      const weatherData = await fetchWeather(apiKey, position, forceRefresh);
      setWeather(weatherData);
      setLastUpdate(new Date());

      // Generate recommendations
      setIsLoadingRec(true);
      const [runs, feedbackHistory] = await Promise.all([
        getAllRuns(),
        getAllFeedback()
      ]);
      
      setFeedbackCount(feedbackHistory.length);
      
      // Calculate and display comfort adjustment
      const adjustment = calculateComfortAdjustment(weatherData, feedbackHistory);
      setComfortAdjustment(adjustment.temperatureOffset);
      
      if (runs.length > 0) {
        const rec = getClothingRecommendation(weatherData, runs, feedbackHistory);
        setRecommendation(rec);
        setFallback(null);
        setActualClothing(rec.clothing);
      } else {
        const fallbackRec = getFallbackRecommendation(weatherData, feedbackHistory);
        setFallback(fallbackRec);
        setRecommendation(null);
        setActualClothing(fallbackRec);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setIsLoadingWeather(false);
      setIsLoadingRec(false);
    }
  };

  useEffect(() => {
    if (hasApiKey) {
      loadWeatherAndRecommendations();
    }
  }, [hasApiKey, apiKey]);

  const handleClothingChange = (clothing: ClothingItems) => {
    setActualClothing(clothing);
  };

  const handleStartRun = () => {
    setRunState('running');
    setRunStartTime(new Date());
  };

  const handleEndRun = () => {
    setRunState('feedback');
  };

  const handleFeedbackSubmit = async (comfort: ComfortLevel) => {
    if (!weather || !actualClothing) return;

    const feedback: Omit<RunFeedback, 'id'> = {
      date: new Date().toISOString().split('T')[0],
      temperature: weather.temperature,
      feelsLike: weather.feelsLike,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      precipitation: weather.precipitation,
      cloudCover: weather.cloudCover,
      clothing: actualClothing, // Store what they actually wore, not what was recommended
      comfort,
      timestamp: new Date()
    };

    await addFeedback(feedback);
    setFeedbackCount(prev => prev + 1);
    setRunState('idle');
    
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
          <h2 className="text-2xl font-bold mb-2">Running...</h2>
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
            fallback={actualClothing}
            isLoading={false}
            editable={true}
            onClothingChange={handleClothingChange}
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
            End Run
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
        />
      )}

      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ready to Run?</h1>
          {lastUpdate && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Updated {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => loadWeatherAndRecommendations(true)}
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
          isLoading={isLoadingRec}
          editable={true}
          onClothingChange={handleClothingChange}
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
              Start Your Run!
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
