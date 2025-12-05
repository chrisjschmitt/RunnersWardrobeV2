import type { WeatherData, GeoPosition, WeatherForecast, WeatherAlert } from '../types';

const OPENWEATHERMAP_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Check if we're deployed on Vercel (use proxy) or local development
const isProduction = import.meta.env.PROD;
const useProxy = isProduction || import.meta.env.VITE_USE_PROXY === 'true';

interface OpenWeatherResponse {
  coord: { lon: number; lat: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  main: {
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
  };
  wind: { speed: number; deg?: number };
  clouds: { all: number };
  rain?: { '1h'?: number; '3h'?: number };
  snow?: { '1h'?: number; '3h'?: number };
  name: string;
  sys: { country: string };
}

interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
  };
  weather: Array<{ description: string; icon: string; main: string }>;
  wind: { speed: number };
  rain?: { '3h'?: number };
  snow?: { '3h'?: number };
}

interface ForecastResponse {
  list: ForecastItem[];
}

interface UVIndexResponse {
  value: number;
}

// Cache for weather data (5 minutes)
let weatherCache: { data: WeatherData; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please enable location access in your browser settings.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out.'));
            break;
          default:
            reject(new Error('An unknown error occurred while getting location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

export async function fetchWeather(
  apiKey: string,
  position: GeoPosition,
  forceRefresh = false
): Promise<WeatherData> {
  // Check cache first
  if (!forceRefresh && weatherCache && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
    return weatherCache.data;
  }

  const { lat, lon } = position;

  let weatherData: OpenWeatherResponse;
  let forecastData: ForecastResponse | null = null;

  if (useProxy) {
    // Use serverless proxy (API key is stored securely on server)
    const proxyUrl = `/api/weather?lat=${lat}&lon=${lon}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Weather API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    weatherData = data.current;
    forecastData = data.forecast;
  } else {
    // Direct API calls (for local development)
    if (!apiKey) {
      throw new Error('API key required for local development. Set it in Settings.');
    }
    
    // Fetch current weather and forecast in parallel
    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(`${OPENWEATHERMAP_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`),
      fetch(`${OPENWEATHERMAP_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial&cnt=3`)
    ]);
    
    if (!weatherResponse.ok) {
      if (weatherResponse.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key in settings.');
      }
      if (weatherResponse.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      throw new Error(`Weather API error: ${weatherResponse.statusText}`);
    }
    
    weatherData = await weatherResponse.json();
    
    if (forecastResponse.ok) {
      forecastData = await forecastResponse.json();
    }
  }

  // Try to fetch UV index (separate endpoint, may fail)
  let uvIndex = 0;
  if (!useProxy && apiKey) {
    try {
      const uvUrl = `${OPENWEATHERMAP_BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`;
      const uvResponse = await fetch(uvUrl);
      if (uvResponse.ok) {
        const uvData: UVIndexResponse = await uvResponse.json();
        uvIndex = uvData.value;
      }
    } catch {
      // UV index is optional, continue without it
      console.warn('Could not fetch UV index');
    }
  }

  // Calculate precipitation (rain or snow in last hour)
  const precipitation = (weatherData.rain?.['1h'] || 0) + (weatherData.snow?.['1h'] || 0);

  // Parse forecast data
  const forecast: WeatherForecast[] = forecastData?.list?.map((item: ForecastItem) => ({
    time: new Date(item.dt * 1000),
    temperature: Math.round(item.main.temp),
    feelsLike: Math.round(item.main.feels_like),
    description: item.weather[0]?.description || 'Unknown',
    icon: item.weather[0]?.icon || '01d',
    precipitation: (item.rain?.['3h'] || 0) + (item.snow?.['3h'] || 0),
    windSpeed: Math.round(item.wind.speed)
  })) || [];

  const result: WeatherData = {
    temperature: Math.round(weatherData.main.temp),
    feelsLike: Math.round(weatherData.main.feels_like),
    humidity: weatherData.main.humidity,
    pressure: weatherData.main.pressure,
    precipitation: precipitation,
    uvIndex: uvIndex,
    windSpeed: Math.round(weatherData.wind.speed),
    cloudCover: weatherData.clouds.all,
    description: weatherData.weather[0]?.description || 'Unknown',
    icon: weatherData.weather[0]?.icon || '01d',
    location: `${weatherData.name}, ${weatherData.sys.country}`,
    timestamp: new Date(),
    forecast: forecast
  };

  // Update cache
  weatherCache = { data: result, timestamp: Date.now() };

  return result;
}

// Analyze forecast to detect upcoming weather changes
export function getWeatherAlerts(weather: WeatherData, temperatureUnit: 'fahrenheit' | 'celsius' = 'fahrenheit'): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  
  // Helper to format temperature difference for display
  const formatTempDiff = (diffF: number): string => {
    if (temperatureUnit === 'celsius') {
      const diffC = Math.round(diffF * 5 / 9);
      return `${Math.abs(diffC)}°C`;
    }
    return `${Math.abs(Math.round(diffF))}°F`;
  };
  
  if (!weather.forecast || weather.forecast.length === 0) {
    return alerts;
  }

  const currentTemp = weather.temperature;
  const currentPrecip = weather.precipitation;
  const currentWind = weather.windSpeed;
  const currentDescription = weather.description.toLowerCase();

  // Check each forecast period
  for (const forecast of weather.forecast) {
    const hoursFromNow = Math.round((forecast.time.getTime() - Date.now()) / (1000 * 60 * 60));
    const timeframe = hoursFromNow <= 1 ? 'within 1 hour' : `in ~${hoursFromNow} hours`;

    // Temperature drop (more than 5°F)
    const tempDiff = forecast.temperature - currentTemp;
    if (tempDiff <= -5) {
      alerts.push({
        type: 'temperature_drop',
        message: `Temperature dropping ${formatTempDiff(tempDiff)} ${timeframe}`,
        severity: tempDiff <= -10 ? 'warning' : 'info',
        timeframe
      });
      break; // Only show first significant change
    }

    // Temperature rise (more than 5°F)
    if (tempDiff >= 5) {
      alerts.push({
        type: 'temperature_rise',
        message: `Temperature rising ${formatTempDiff(tempDiff)} ${timeframe}`,
        severity: 'info',
        timeframe
      });
      break;
    }

    // Rain coming
    const forecastDesc = forecast.description.toLowerCase();
    const isRainyForecast = forecastDesc.includes('rain') || forecastDesc.includes('drizzle') || forecastDesc.includes('shower');
    const isRainyNow = currentDescription.includes('rain') || currentDescription.includes('drizzle') || currentDescription.includes('shower');
    
    if (isRainyForecast && !isRainyNow && forecast.precipitation > 0) {
      alerts.push({
        type: 'rain_coming',
        message: `Rain expected ${timeframe}`,
        severity: 'warning',
        timeframe
      });
      break;
    }

    // Rain clearing
    if (isRainyNow && !isRainyForecast && currentPrecip > 0) {
      alerts.push({
        type: 'clearing',
        message: `Rain clearing ${timeframe}`,
        severity: 'info',
        timeframe
      });
      break;
    }

    // Wind increase (more than 5 mph)
    const windDiff = forecast.windSpeed - currentWind;
    if (windDiff >= 5) {
      alerts.push({
        type: 'wind_increase',
        message: `Wind increasing to ${forecast.windSpeed} mph ${timeframe}`,
        severity: windDiff >= 10 ? 'warning' : 'info',
        timeframe
      });
      break;
    }
  }

  return alerts;
}

export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export function clearWeatherCache(): void {
  weatherCache = null;
}

// Helper to validate API key format (basic check)
export function isValidApiKeyFormat(apiKey: string): boolean {
  // OpenWeatherMap API keys are 32 character hex strings
  return /^[a-f0-9]{32}$/i.test(apiKey);
}

// Check if proxy mode is enabled (no API key needed)
export function isProxyMode(): boolean {
  return useProxy;
}
