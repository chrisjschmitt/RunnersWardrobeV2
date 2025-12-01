import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/database';
import { isValidApiKeyFormat, isProxyMode } from '../services/weatherApi';
import type { TemperatureUnit } from '../services/temperatureUtils';

interface SettingsProps {
  onSettingsSaved: () => void;
  initialApiKey?: string;
  initialUnit?: TemperatureUnit;
  onHelpClick?: () => void;
}

export function Settings({ onSettingsSaved, initialApiKey = '', initialUnit = 'celsius', onHelpClick }: SettingsProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(initialUnit);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const proxyMode = isProxyMode();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      if (settings) {
        setApiKey(settings.weatherApiKey || '');
        setTemperatureUnit(settings.temperatureUnit || 'celsius');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);

    // Only validate API key if not in proxy mode
    if (!proxyMode) {
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
        temperatureUnit: temperatureUnit
      });
      setSaved(true);
      onSettingsSaved();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
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
          {/* Temperature Unit Section */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Temperature Unit
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
                <span className="text-lg">°F</span>
                <span className="block text-xs mt-1 opacity-80">Fahrenheit</span>
              </button>
              <button
                onClick={() => setTemperatureUnit('celsius')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  temperatureUnit === 'celsius'
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
                }`}
              >
                <span className="text-lg">°C</span>
                <span className="block text-xs mt-1 opacity-80">Celsius</span>
              </button>
            </div>
          </div>

          {/* API Key Section - only show if not in proxy mode */}
          {!proxyMode && (
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
          {proxyMode && (
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

      {/* Help section - only show if not in proxy mode */}
      {!proxyMode && (
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

      {/* Help button */}
      {onHelpClick && (
        <button
          onClick={onHelpClick}
          className="w-full mt-6 glass-card p-4 flex items-center justify-between hover:bg-[rgba(255,255,255,0.08)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <div className="font-medium">Help & FAQ</div>
              <div className="text-sm text-[var(--color-text-muted)]">Learn how the app works</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Version info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-[var(--color-text-muted)]">
          Runner's Wardrobe v1.9.0
        </p>
      </div>
    </div>
  );
}
