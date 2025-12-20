import { useState } from 'react';
import type { WeatherData, WeatherAlert, ActivityType, ThermalPreference } from '../types';
import { getWeatherIconUrl, getWeatherAlerts } from '../services/weatherApi';
import { formatTemperature, getUnitSymbol, formatWindSpeed, formatPrecipitation, type TemperatureUnit } from '../services/temperatureUtils';
import { calculateComfortTemperature } from '../services/recommendationEngine';

interface WeatherDisplayProps {
  weather: WeatherData;
  unit: TemperatureUnit;
  compact?: boolean;
  activity?: ActivityType;
  thermalPreference?: ThermalPreference;
}

export function WeatherDisplay({ weather, unit, compact = false, activity = 'running', thermalPreference = 'average' }: WeatherDisplayProps) {
  const [showThermalHelp, setShowThermalHelp] = useState(false);
  const alerts = getWeatherAlerts(weather, unit);
  
  // Calculate T_comfort
  const comfortBreakdown = calculateComfortTemperature(weather, activity, thermalPreference);
  const thermalComfortDisplay = unit === 'celsius' 
    ? `${Math.round(comfortBreakdown.comfortTempC)}°C`
    : `${Math.round((comfortBreakdown.comfortTempC * 9/5) + 32)}°F`;
  
  // Format time for sunrise/sunset display
  const formatTime = (date?: Date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <img 
          src={getWeatherIconUrl(weather.icon)} 
          alt={weather.description}
          className="w-12 h-12"
        />
        <div>
          <div className="text-2xl font-bold">{formatTemperature(weather.temperature, unit)}</div>
          <div className="text-sm text-[var(--color-text-muted)] capitalize">{weather.description}</div>
        </div>
      </div>
    );
  }

  const unitSymbol = getUnitSymbol(unit);

  return (
    <div className="animate-slide-up">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-[var(--color-text-muted)]">Current Weather</h2>
            <p className="text-sm text-[var(--color-accent)]">{weather.location}</p>
          </div>
          <img 
            src={getWeatherIconUrl(weather.icon)} 
            alt={weather.description}
            className="weather-icon"
          />
        </div>

        <div className="flex items-end gap-2 mb-6">
          <span className="text-6xl font-bold">{formatTemperature(weather.temperature, unit).replace(unitSymbol, '')}</span>
          <span className="text-2xl text-[var(--color-text-muted)] mb-2">{unitSymbol}</span>
        </div>

        <p className="text-lg capitalize mb-6 text-[var(--color-text-muted)]">{weather.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <WeatherStat 
            icon={<ThermometerIcon />}
            label="Feels Like"
            value={formatTemperature(weather.feelsLike, unit)}
          />
          <div 
            className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-colors relative"
            onClick={() => setShowThermalHelp(!showThermalHelp)}
          >
            <div className="text-[var(--color-accent)]">
              <ThermalComfortIcon />
            </div>
            <div className="flex-1">
              <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                Thermal Comfort
                <span className="text-[10px] bg-[var(--color-accent)] text-white rounded-full w-4 h-4 flex items-center justify-center">?</span>
              </div>
              <div className="font-medium text-[var(--color-success)]">{thermalComfortDisplay}</div>
            </div>
            {showThermalHelp && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-accent)] rounded-lg shadow-lg z-10 text-xs">
                <p className="font-semibold text-[var(--color-accent)] mb-1">What is Thermal Comfort?</p>
                <p className="text-[var(--color-text-muted)]">
                  Adjusted temperature based on your activity ({activity}) and personal preference. 
                  Higher activity = more body heat = feels warmer.
                </p>
              </div>
            )}
          </div>
          <WeatherStat 
            icon={<DropletIcon />}
            label="Humidity"
            value={`${weather.humidity}%`}
          />
          <WeatherStat 
            icon={<WindIcon />}
            label="Wind"
            value={formatWindSpeed(weather.windSpeed, unit)}
          />
          <WeatherStat 
            icon={<CloudIcon />}
            label="Cloud Cover"
            value={`${weather.cloudCover}%`}
          />
          <WeatherStat 
            icon={<SunIcon />}
            label="UV Index"
            value={`${weather.uvIndex}`}
          />
          <WeatherStat 
            icon={<RainIcon />}
            label="Precipitation"
            value={formatPrecipitation(weather.precipitation, unit)}
          />
          <WeatherStat 
            icon={<SunriseIcon />}
            label="Sunrise"
            value={formatTime(weather.sunrise)}
          />
          <WeatherStat 
            icon={<SunsetIcon />}
            label="Sunset"
            value={formatTime(weather.sunset)}
          />
        </div>

        {/* Weather Alerts */}
        {alerts.length > 0 && (
          <div className="mt-6 space-y-2">
            {alerts.map((alert, index) => (
              <WeatherAlertBanner key={index} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface WeatherStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function WeatherStat({ icon, label, value }: WeatherStatProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
      <div className="text-[var(--color-accent)]">
        {icon}
      </div>
      <div>
        <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

interface WeatherAlertBannerProps {
  alert: WeatherAlert;
}

function WeatherAlertBanner({ alert }: WeatherAlertBannerProps) {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'temperature_drop':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case 'temperature_rise':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'rain_coming':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        );
      case 'wind_increase':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        );
      case 'clearing':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const isWarning = alert.severity === 'warning';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      isWarning 
        ? 'bg-[rgba(251,191,36,0.2)] border border-yellow-500/50' 
        : 'bg-[rgba(59,130,246,0.2)] border border-blue-500/50'
    }`}>
      <div className={isWarning ? 'text-yellow-400' : 'text-blue-400'}>
        {getAlertIcon()}
      </div>
      <div className="flex-1">
        <div className={`text-sm font-medium ${isWarning ? 'text-yellow-300' : 'text-blue-300'}`}>
          {isWarning ? '⚠️ Weather Alert' : '📊 Weather Change'}
        </div>
        <div className="text-sm text-[var(--color-text-muted)]">
          {alert.message}
        </div>
      </div>
    </div>
  );
}

// Icon components
function ThermometerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
    </svg>
  );
}

function WindIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function RainIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function SunriseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 0V3m0 1a9 9 0 019 9M12 4a9 9 0 00-9 9m9-9v1m0 16v1m-9-9h1m16 0h1M5.636 5.636l.707.707m12.02-.707l-.707.707M12 9v3m0 0l2 2m-2-2l-2 2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17h18M7 17l5-5 5 5" />
    </svg>
  );
}

function SunsetIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 0V3m0 1a9 9 0 019 9M12 4a9 9 0 00-9 9m9-9v1m0 16v1m-9-9h1m16 0h1M5.636 5.636l.707.707m12.02-.707l-.707.707" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17h18M7 17l5 5 5-5" />
    </svg>
  );
}

function ThermalComfortIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
