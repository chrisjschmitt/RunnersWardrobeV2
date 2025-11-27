import type { WeatherData, GeoPosition } from '../types';

const OPENWEATHERMAP_BASE_URL = 'https://api.openweathermap.org/data/2.5';

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

  // Fetch current weather
  const weatherUrl = `${OPENWEATHERMAP_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
  
  const weatherResponse = await fetch(weatherUrl);
  
  if (!weatherResponse.ok) {
    if (weatherResponse.status === 401) {
      throw new Error('Invalid API key. Please check your OpenWeatherMap API key in settings.');
    }
    if (weatherResponse.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Weather API error: ${weatherResponse.statusText}`);
  }

  const weatherData: OpenWeatherResponse = await weatherResponse.json();

  // Try to fetch UV index (separate endpoint, may fail)
  let uvIndex = 0;
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

  // Calculate precipitation (rain or snow in last hour)
  const precipitation = (weatherData.rain?.['1h'] || 0) + (weatherData.snow?.['1h'] || 0);

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
    timestamp: new Date()
  };

  // Update cache
  weatherCache = { data: result, timestamp: Date.now() };

  return result;
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

