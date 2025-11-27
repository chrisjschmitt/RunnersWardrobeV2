// Weather data from OpenWeatherMap API
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  precipitation: number;
  uvIndex: number;
  windSpeed: number;
  cloudCover: number;
  description: string;
  icon: string;
  location: string;
  timestamp: Date;
}

// Clothing items for each category
export interface ClothingItems {
  headCover: string;
  tops: string;
  bottoms: string;
  shoes: string;
  socks: string;
  gloves: string;
  rainGear: string;
}

// A single run record from the CSV
export interface RunRecord {
  id?: number;
  date: string;
  time: string;
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  precipitation: number;
  uvIndex: number;
  windSpeed: number;
  cloudCover: number;
  clothing: ClothingItems;
}

// CSV column mapping
export interface CSVColumnMap {
  date: string;
  time: string;
  location: string;
  temperature: string;
  feels_like: string;
  humidity: string;
  pressure: string;
  precipitation: string;
  uv: string;
  wind_speed: string;
  cloud_cover: string;
  head_cover: string;
  tops: string;
  bottoms: string;
  shoes: string;
  socks: string;
  gloves: string;
  rain_gear: string;
}

// Clothing recommendation with confidence
export interface ClothingRecommendation {
  clothing: ClothingItems;
  confidence: number;
  matchingRuns: number;
  totalRuns: number;
  similarConditions: RunRecord[];
}

// App settings stored in IndexedDB
export interface AppSettings {
  id?: number;
  weatherApiKey: string;
  temperatureUnit: 'fahrenheit' | 'celsius';
  lastLocation?: {
    lat: number;
    lon: number;
    name: string;
  };
}

// Navigation views
export type AppView = 'home' | 'upload' | 'history' | 'settings';

// Geolocation position
export interface GeoPosition {
  lat: number;
  lon: number;
}

// Comfort feedback after a run
export type ComfortLevel = 'too_cold' | 'just_right' | 'too_hot';

// Feedback record stored after each run
export interface RunFeedback {
  id?: number;
  date: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  cloudCover: number;
  clothing: ClothingItems;
  comfort: ComfortLevel;
  timestamp: Date;
}

// Temperature adjustment based on feedback history
export interface ComfortAdjustment {
  temperatureOffset: number; // positive = dress warmer, negative = dress cooler
  confidence: number;
}

