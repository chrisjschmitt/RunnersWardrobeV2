import { useState, useEffect } from 'react';
import type { AppView, TestWeatherData, ActivityType } from './types';
import { ACTIVITY_CONFIGS } from './types';
import { getSettings, getRunCount, saveSettings, isOnboardingComplete, setOnboardingComplete } from './services/database';
import { StartRun } from './components/StartRun';
import { FileUpload } from './components/FileUpload';
import { RunHistory } from './components/RunHistory';
import { Settings } from './components/Settings';
import { Help } from './components/Help';
import { Onboarding } from './components/Onboarding';
import type { TemperatureUnit } from './services/temperatureUtils';
import { isProxyMode } from './services/weatherApi';

function App() {
  const [view, setView] = useState<AppView>('home');
  const [apiKey, setApiKey] = useState<string>('');
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('celsius');
  const [runCount, setRunCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [testWeather, setTestWeather] = useState<TestWeatherData | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('running');
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [settings, count, onboardingDone] = await Promise.all([
        getSettings(),
        getRunCount(),
        isOnboardingComplete()
      ]);
      
      if (settings?.weatherApiKey) {
        setApiKey(settings.weatherApiKey);
      }
      if (settings?.temperatureUnit) {
        setTemperatureUnit(settings.temperatureUnit);
      }
      if (settings?.selectedActivity) {
        setSelectedActivity(settings.selectedActivity);
      }
      setRunCount(count);
      
      // Show onboarding for first-time users
      if (!onboardingDone) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    await setOnboardingComplete();
    setShowOnboarding(false);
  };

  const handleActivityChange = async (activity: ActivityType) => {
    setSelectedActivity(activity);
    setShowActivityPicker(false);
    
    // Save to settings
    try {
      const settings = await getSettings();
      await saveSettings({
        weatherApiKey: settings?.weatherApiKey || '',
        temperatureUnit: settings?.temperatureUnit || 'celsius',
        selectedActivity: activity,
        testMode: settings?.testMode
      });
    } catch (error) {
      console.error('Failed to save activity:', error);
    }
  };

  const handleUploadComplete = (count: number) => {
    setRunCount(count);
    // Go back to home after successful upload
    setTimeout(() => setView('home'), 1500);
  };

  const handleSettingsSaved = async () => {
    const settings = await getSettings();
    if (settings?.weatherApiKey) {
      setApiKey(settings.weatherApiKey);
    }
    if (settings?.temperatureUnit) {
      setTemperatureUnit(settings.temperatureUnit);
    }
  };

  const handleDataCleared = () => {
    setRunCount(0);
  };

  const activityConfig = ACTIVITY_CONFIGS[selectedActivity];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner animate-spin mx-auto mb-4 w-8 h-8"></div>
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Header */}
      <header className="safe-top sticky top-0 z-50 backdrop-blur-lg bg-[rgba(15,23,35,0.8)] border-b border-[rgba(255,255,255,0.1)]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => setView('home')}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-lg flex items-center justify-center text-lg">
                {activityConfig.icon}
              </div>
              <span className="font-semibold text-lg">TrailKit</span>
            </div>
            
            {/* Activity Selector */}
            <button
              onClick={() => setShowActivityPicker(!showActivityPicker)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] transition-colors"
            >
              <span className="text-sm">{activityConfig.icon} {activityConfig.name}</span>
              <svg className={`w-4 h-4 transition-transform ${showActivityPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Activity Dropdown */}
          {showActivityPicker && (
            <div className="absolute right-4 top-16 z-50 bg-[rgba(30,41,59,0.98)] backdrop-blur-lg rounded-lg border border-[rgba(255,255,255,0.1)] shadow-xl overflow-hidden">
              {Object.values(ACTIVITY_CONFIGS).map((config) => (
                <button
                  key={config.id}
                  onClick={() => handleActivityChange(config.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[rgba(255,255,255,0.1)] transition-colors ${
                    selectedActivity === config.id ? 'bg-[rgba(255,255,255,0.05)]' : ''
                  }`}
                >
                  <span className="text-xl">{config.icon}</span>
                  <span className="text-sm">{config.name}</span>
                  {selectedActivity === config.id && (
                    <svg className="w-4 h-4 ml-auto text-[var(--color-accent)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto" onClick={() => setShowActivityPicker(false)}>
        {view === 'home' && (
          <StartRun 
            apiKey={apiKey}
            hasApiKey={!!apiKey || isProxyMode() || testMode}
            temperatureUnit={temperatureUnit}
            onNeedApiKey={() => setView('settings')}
            testMode={testMode}
            testWeather={testWeather}
            activity={selectedActivity}
          />
        )}
        {view === 'upload' && (
          <FileUpload 
            onUploadComplete={handleUploadComplete}
            existingCount={runCount}
            activity={selectedActivity}
          />
        )}
        {view === 'history' && (
          <RunHistory 
            onDataCleared={handleDataCleared}
            temperatureUnit={temperatureUnit}
            activity={selectedActivity}
          />
        )}
        {view === 'settings' && (
          <Settings 
            onSettingsSaved={handleSettingsSaved}
            initialApiKey={apiKey}
            initialUnit={temperatureUnit}
            onUploadClick={() => setView('upload')}
            testMode={testMode}
            onTestModeChange={setTestMode}
            testWeather={testWeather}
            onTestWeatherChange={setTestWeather}
          />
        )}
        {view === 'help' && <Help />}
      </main>

      {/* Bottom navigation */}
      <nav className="safe-bottom sticky bottom-0 backdrop-blur-lg bg-[rgba(15,23,35,0.9)] border-t border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-around py-2">
          <NavButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            label="Home"
            active={view === 'home'}
            onClick={() => setView('home')}
          />
          <NavButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Help"
            active={view === 'help'}
            onClick={() => setView('help')}
          />
          <NavButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="History"
            active={view === 'history'}
            onClick={() => setView('history')}
          />
          <NavButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Settings"
            active={view === 'settings'}
            onClick={() => setView('settings')}
          />
        </div>
      </nav>
    </div>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavButton({ icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
        active 
          ? 'text-[var(--color-accent)]' 
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default App;
