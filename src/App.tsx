import { useState, useEffect } from 'react';
import type { AppView } from './types';
import { getSettings, getRunCount } from './services/database';
import { StartRun } from './components/StartRun';
import { FileUpload } from './components/FileUpload';
import { RunHistory } from './components/RunHistory';
import { Settings } from './components/Settings';
import { Help } from './components/Help';
import type { TemperatureUnit } from './services/temperatureUtils';

function App() {
  const [view, setView] = useState<AppView>('home');
  const [apiKey, setApiKey] = useState<string>('');
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('fahrenheit');
  const [runCount, setRunCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [settings, count] = await Promise.all([
        getSettings(),
        getRunCount()
      ]);
      
      if (settings?.weatherApiKey) {
        setApiKey(settings.weatherApiKey);
      }
      if (settings?.temperatureUnit) {
        setTemperatureUnit(settings.temperatureUnit);
      }
      setRunCount(count);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
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
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-semibold text-lg">Runner's Wardrobe</span>
            </div>
            <div className="flex items-center gap-1">
              {runCount > 0 && (
                <span className="text-xs bg-[var(--color-accent)] text-white px-2 py-0.5 rounded-full">
                  {runCount} runs
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        {view === 'home' && (
          <StartRun 
            apiKey={apiKey}
            hasApiKey={!!apiKey}
            temperatureUnit={temperatureUnit}
            onNeedApiKey={() => setView('settings')}
          />
        )}
        {view === 'upload' && (
          <FileUpload 
            onUploadComplete={handleUploadComplete}
            existingCount={runCount}
          />
        )}
        {view === 'history' && (
          <RunHistory 
            onDataCleared={handleDataCleared}
            temperatureUnit={temperatureUnit}
          />
        )}
        {view === 'settings' && (
          <Settings 
            onSettingsSaved={handleSettingsSaved}
            initialApiKey={apiKey}
            initialUnit={temperatureUnit}
            onHelpClick={() => setView('help')}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            }
            label="Upload"
            active={view === 'upload'}
            onClick={() => setView('upload')}
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
