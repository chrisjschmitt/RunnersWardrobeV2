import type { WeatherData } from '../types';
import { getWeatherIconUrl } from '../services/weatherApi';
import { formatTemperature, getUnitSymbol, type TemperatureUnit } from '../services/temperatureUtils';

interface WeatherDisplayProps {
  weather: WeatherData;
  unit: TemperatureUnit;
  compact?: boolean;
}

export function WeatherDisplay({ weather, unit, compact = false }: WeatherDisplayProps) {
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
          <WeatherStat 
            icon={<DropletIcon />}
            label="Humidity"
            value={`${weather.humidity}%`}
          />
          <WeatherStat 
            icon={<WindIcon />}
            label="Wind"
            value={`${weather.windSpeed} mph`}
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
            value={weather.precipitation > 0 ? `${weather.precipitation}"` : 'None'}
          />
        </div>
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
