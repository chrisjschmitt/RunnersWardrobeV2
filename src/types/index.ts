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
  forecast?: WeatherForecast[];
  sunrise?: Date;
  sunset?: Date;
}

// Forecast data for upcoming hours
export interface WeatherForecast {
  time: Date;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  precipitation: number;
  windSpeed: number;
}

// Weather change alert
export interface WeatherAlert {
  type: 'temperature_drop' | 'temperature_rise' | 'rain_coming' | 'wind_increase' | 'clearing';
  message: string;
  severity: 'info' | 'warning';
  timeframe: string;
}

// ============ ACTIVITY TYPES ============

export type ActivityType = 
  | 'running' 
  | 'trail_running' 
  | 'hiking' 
  | 'walking'
  | 'cycling' 
  | 'snowshoeing' 
  | 'cross_country_skiing';

export interface ActivityInfo {
  id: ActivityType;
  name: string;
  icon: string;
  clothingCategories: ClothingCategory[];
}

export interface ClothingCategory {
  key: string;
  label: string;
  defaultValue: string;
  options: string[];
}

// Activity-specific clothing schemas
// 
// IMPORTANT: When adding a new activity, also update the preference lists in
// src/services/recommendationEngine.ts (search for "WARM_TOPS", "COLD_GLOVES", etc.)
// This ensures smart weather overrides work correctly for the new activity.
//
export const ACTIVITY_CONFIGS: Record<ActivityType, ActivityInfo> = {
  running: {
    id: 'running',
    name: 'Running',
    icon: '🏃',
    clothingCategories: [
      { key: 'headCover', label: 'Head', defaultValue: 'None', options: ['None', 'Cap', 'Visor', 'Headband', 'Beanie', 'Balaclava'] },
      { key: 'tops', label: 'Top', defaultValue: 'T-shirt', options: ['Singlet', 'T-shirt', 'Long sleeve', 'Base layer', 'Base layer + jacket', 'Vest + long sleeve'] },
      { key: 'bottoms', label: 'Bottom', defaultValue: 'Shorts', options: ['Short shorts', 'Shorts', 'Capris', 'Tights', 'Shorts over tights'] },
      { key: 'shoes', label: 'Shoes', defaultValue: 'Running shoes', options: ['Running shoes', 'Racing flats', 'Track spikes'] },
      { key: 'socks', label: 'Socks', defaultValue: 'Regular', options: ['No-show', 'Regular', 'Wool', 'Compression'] },
      { key: 'gloves', label: 'Gloves', defaultValue: 'None', options: ['None', 'Light gloves', 'Heavy gloves', 'Mittens'] },
      { key: 'rainGear', label: 'Rain Gear', defaultValue: 'None', options: ['None', 'Light rain jacket', 'Waterproof jacket'] },
      { key: 'accessories', label: 'Accessories', defaultValue: 'None', options: ['None', 'Sunglasses', 'Headlamp', 'Sunglasses + watch', 'Headlamp + reflective vest'] },
    ]
  },
  trail_running: {
    id: 'trail_running',
    name: 'Trail Running',
    icon: '🏔️',
    clothingCategories: [
      { key: 'headCover', label: 'Head', defaultValue: 'None', options: ['None', 'Cap', 'Visor', 'Buff', 'Beanie', 'Balaclava'] },
      { key: 'tops', label: 'Top', defaultValue: 'T-shirt', options: ['Singlet', 'T-shirt', 'Long sleeve', 'Base layer', 'Base layer + jacket', 'Wind jacket'] },
      { key: 'bottoms', label: 'Bottom', defaultValue: 'Shorts', options: ['Short shorts', 'Shorts', 'Capris', 'Tights', 'Shorts over tights'] },
      { key: 'shoes', label: 'Shoes', defaultValue: 'Trail shoes', options: ['Trail shoes', 'Light trail shoes', 'Aggressive trail shoes', 'Approach shoes'] },
      { key: 'socks', label: 'Socks', defaultValue: 'Regular', options: ['No-show', 'Regular', 'Wool', 'Compression', 'Waterproof'] },
      { key: 'gloves', label: 'Gloves', defaultValue: 'None', options: ['None', 'Light gloves', 'Heavy gloves', 'Mittens'] },
      { key: 'rainGear', label: 'Rain/Wind', defaultValue: 'None', options: ['None', 'Wind jacket', 'Light rain jacket', 'Waterproof jacket', 'Rain pants'] },
      { key: 'hydration', label: 'Hydration', defaultValue: 'None', options: ['None', 'Handheld bottle', 'Waist belt', 'Hydration vest', 'Running pack'] },
      { key: 'accessories', label: 'Accessories', defaultValue: 'None', options: ['None', 'Sunglasses', 'Headlamp', 'Poles', 'Gaiters', 'Sunglasses + poles', 'Headlamp + poles'] },
    ]
  },
  hiking: {
    id: 'hiking',
    name: 'Hiking',
    icon: '🥾',
    clothingCategories: [
      { key: 'headCover', label: 'Head', defaultValue: 'None', options: ['None', 'Sun hat', 'Cap', 'Beanie', 'Balaclava'] },
      { key: 'baseLayer', label: 'Base Layer', defaultValue: 'T-shirt', options: ['None', 'T-shirt', 'Long sleeve', 'Merino base', 'Synthetic base'] },
      { key: 'midLayer', label: 'Mid Layer', defaultValue: 'None', options: ['None', 'Fleece', 'Light puffy', 'Heavy puffy', 'Softshell'] },
      { key: 'outerLayer', label: 'Outer Layer', defaultValue: 'None', options: ['None', 'Wind jacket', 'Rain jacket', 'Hardshell', 'Insulated jacket'] },
      { key: 'bottoms', label: 'Pants', defaultValue: 'Hiking pants', options: ['Shorts', 'Convertible pants', 'Hiking pants', 'Softshell pants', 'Insulated pants', 'Rain pants'] },
      { key: 'shoes', label: 'Footwear', defaultValue: 'Hiking boots', options: ['Trail runners', 'Hiking shoes', 'Hiking boots', 'Waterproof boots', 'Mountaineering boots'] },
      { key: 'socks', label: 'Socks', defaultValue: 'Hiking socks', options: ['Light hiking', 'Hiking socks', 'Heavy wool', 'Liner + wool'] },
      { key: 'gloves', label: 'Gloves', defaultValue: 'None', options: ['None', 'Light gloves', 'Fleece gloves', 'Insulated gloves', 'Mittens'] },
      { key: 'pack', label: 'Pack', defaultValue: 'Daypack', options: ['None', 'Waist pack', 'Daypack (20L)', 'Daypack (30L)', 'Overnight pack'] },
      { key: 'accessories', label: 'Accessories', defaultValue: 'None', options: ['None', 'Sunglasses', 'Headlamp', 'Trekking poles', 'Gaiters', 'Sunglasses + poles', 'Headlamp + poles'] },
    ]
  },
  walking: {
    id: 'walking',
    name: 'Walking',
    icon: '🚶',
    clothingCategories: [
      { key: 'headCover', label: 'Head', defaultValue: 'None', options: ['None', 'Sun hat', 'Cap', 'Beanie', 'Ear warmers'] },
      { key: 'tops', label: 'Top', defaultValue: 'T-shirt', options: ['T-shirt', 'Long sleeve', 'Sweater', 'Fleece', 'Light jacket'] },
      { key: 'outerLayer', label: 'Jacket', defaultValue: 'None', options: ['None', 'Light jacket', 'Rain jacket', 'Winter coat', 'Down jacket'] },
      { key: 'bottoms', label: 'Pants', defaultValue: 'Casual pants', options: ['Shorts', 'Capris', 'Casual pants', 'Jeans', 'Leggings', 'Fleece-lined leggings', 'Sweatpants', 'Insulated pants'] },
      { key: 'shoes', label: 'Shoes', defaultValue: 'Sneakers', options: ['Sandals', 'Sneakers', 'Walking shoes', 'Boots', 'Waterproof shoes'] },
      { key: 'socks', label: 'Socks', defaultValue: 'Regular', options: ['No-show', 'Regular', 'Wool', 'Thick'] },
      { key: 'gloves', label: 'Gloves', defaultValue: 'None', options: ['None', 'Light gloves', 'Warm gloves', 'Mittens'] },
      { key: 'accessories', label: 'Accessories', defaultValue: 'None', options: ['None', 'Sunglasses', 'Umbrella', 'Scarf', 'Sunglasses + hat'] },
    ]
  },
  cycling: {
    id: 'cycling',
    name: 'Cycling',
    icon: '🚴',
    clothingCategories: [
      { key: 'helmet', label: 'Helmet', defaultValue: 'Road helmet', options: ['Road helmet', 'Aero helmet', 'MTB helmet', 'Commuter helmet'] },
      { key: 'tops', label: 'Jersey/Top', defaultValue: 'Short sleeve jersey', options: ['Sleeveless jersey', 'Short sleeve jersey', 'Long sleeve jersey', 'Thermal jersey', 'Jersey + vest', 'Jersey + jacket'] },
      { key: 'bottoms', label: 'Shorts/Bibs', defaultValue: 'Bib shorts', options: ['Shorts', 'Bib shorts', '3/4 bibs', 'Bib tights', 'Tights over bibs'] },
      { key: 'shoes', label: 'Shoes', defaultValue: 'Road shoes', options: ['Road shoes', 'MTB shoes', 'Flat pedal shoes', 'Shoe covers'] },
      { key: 'socks', label: 'Socks', defaultValue: 'Cycling socks', options: ['No-show', 'Cycling socks', 'Wool socks', 'Thermal socks', 'Overshoes'] },
      { key: 'gloves', label: 'Gloves', defaultValue: 'None', options: ['None', 'Fingerless', 'Full finger light', 'Thermal gloves', 'Lobster gloves'] },
      { key: 'armWarmers', label: 'Arm/Leg', defaultValue: 'None', options: ['None', 'Arm warmers', 'Leg warmers', 'Knee warmers', 'Arm + leg warmers', 'Arm + knee warmers'] },
      { key: 'eyewear', label: 'Eyewear', defaultValue: 'None', options: ['None', 'Sunglasses', 'Clear glasses', 'Photochromic'] },
      { key: 'rainGear', label: 'Rain Gear', defaultValue: 'None', options: ['None', 'Rain cape', 'Rain jacket', 'Shoe covers', 'Full rain kit'] },
      { key: 'accessories', label: 'Accessories', defaultValue: 'None', options: ['None', 'Lights', 'Headlamp', 'Reflective vest', 'Lights + vest'] },
    ]
  },
  snowshoeing: {
    id: 'snowshoeing',
    name: 'Snowshoeing',
    icon: '❄️',
    clothingCategories: [
      { key: 'headCover', label: 'Head', defaultValue: 'Beanie', options: ['Beanie', 'Balaclava', 'Fleece headband', 'Insulated hat'] },
      { key: 'baseLayer', label: 'Base Layer', defaultValue: 'Merino base', options: ['Light synthetic', 'Merino base', 'Heavy merino', 'Expedition weight'] },
      { key: 'midLayer', label: 'Mid Layer', defaultValue: 'Fleece', options: ['Light fleece', 'Fleece', 'Grid fleece', 'Light puffy', 'Heavy puffy'] },
      { key: 'outerLayer', label: 'Outer Layer', defaultValue: 'Softshell', options: ['None', 'Wind jacket', 'Softshell', 'Hardshell', 'Insulated jacket'] },
      { key: 'bottoms', label: 'Pants', defaultValue: 'Softshell pants', options: ['Hiking pants', 'Softshell pants', 'Insulated pants', 'Hardshell pants', 'Bibs'] },
      { key: 'boots', label: 'Boots', defaultValue: 'Winter boots', options: ['Hiking boots', 'Winter hiking boots', 'Winter boots', 'Pac boots'] },
      { key: 'socks', label: 'Socks', defaultValue: 'Heavy wool', options: ['Wool', 'Heavy wool', 'Liner + wool', 'Heated socks'] },
      { key: 'gloves', label: 'Gloves', defaultValue: 'Insulated gloves', options: ['Light gloves', 'Insulated gloves', 'Heavy mittens', 'Lobster mitts', 'Liner + mittens'] },
      { key: 'gaiters', label: 'Gaiters', defaultValue: 'Gaiters', options: ['None', 'Low gaiters', 'Gaiters', 'Full gaiters'] },
      { key: 'accessories', label: 'Accessories', defaultValue: 'Poles', options: ['None', 'Poles', 'Sunglasses', 'Goggles', 'Poles + sunglasses', 'Poles + goggles', 'Headlamp + poles'] },
    ]
  },
  cross_country_skiing: {
    id: 'cross_country_skiing',
    name: 'XC Skiing',
    icon: '⛷️',
    clothingCategories: [
      { key: 'headCover', label: 'Head', defaultValue: 'Headband', options: ['Headband', 'Light beanie', 'Beanie', 'Balaclava'] },
      { key: 'baseLayer', label: 'Base Layer', defaultValue: 'Light synthetic', options: ['Light synthetic', 'Merino base', 'Race suit base'] },
      { key: 'tops', label: 'Top', defaultValue: 'XC jacket', options: ['Race suit top', 'XC jacket', 'Soft shell', 'Wind jacket + fleece'] },
      { key: 'bottoms', label: 'Pants', defaultValue: 'XC pants', options: ['Race suit tights', 'XC pants', 'Softshell pants', 'Wind pants over tights'] },
      { key: 'boots', label: 'Boots', defaultValue: 'Classic boots', options: ['Classic boots', 'Skate boots', 'Combi boots', 'Insulated boots'] },
      { key: 'socks', label: 'Socks', defaultValue: 'XC socks', options: ['Thin socks', 'XC socks', 'Wool socks'] },
      { key: 'gloves', label: 'Gloves', defaultValue: 'XC gloves', options: ['Light gloves', 'XC gloves', 'Lobster mitts', 'Heavy mittens'] },
      { key: 'eyewear', label: 'Eyewear', defaultValue: 'None', options: ['None', 'Sunglasses', 'Goggles', 'Photochromic'] },
      { key: 'accessories', label: 'Accessories', defaultValue: 'None', options: ['None', 'Neck gaiter', 'Hand warmers', 'Headlamp', 'Neck gaiter + hand warmers'] },
    ]
  }
};

// Generic clothing items (flexible key-value pairs)
export interface ClothingItems {
  [key: string]: string;
}

// Legacy support - base running schema
export interface BaseClothingItems {
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
  activity?: ActivityType;
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

// Thermal preference - how the user typically feels during outdoor activity
export type ThermalPreference = 'cold' | 'average' | 'warm';

// Temperature offsets for thermal preferences (in °F)
// 'cold' = user runs cold, recommend warmer clothes (positive offset)
// 'warm' = user runs hot, recommend lighter clothes (negative offset)
// Thermal preference offsets in °C
// Positive = user runs cold, needs warmer clothes
// Negative = user runs warm, needs lighter clothes
export const THERMAL_OFFSETS: Record<ThermalPreference, number> = {
  cold: 4.4,    // +4.4°C offset → warmer recommendations
  average: 0,   // No adjustment
  warm: -4.4    // -4.4°C offset → lighter recommendations
};

// Activity-specific thermal parameters for T_comfort calculation
// B = base body heat generation (°C), higher = more heat = lighter clothes
// wΔ = feels-like weight, higher = more affected by wind/humidity
export interface ActivityThermalParams {
  B: number;   // Base adjustment in °C
  wDelta: number;  // Feels-like weight (0-1)
}

// T_comfort = T_actual + B(activity) + wΔ(activity) × Δ + thermal_offset
// Where Δ = clamp(FeelsLike − Actual, −15°C, +8°C)
export const ACTIVITY_THERMAL_PARAMS: Record<ActivityType, ActivityThermalParams> = {
  walking:             { B: 0.5,  wDelta: 0.80 },  // Low heat, high wind impact
  hiking:              { B: 2.0,  wDelta: 0.65 },  // Moderate heat, moderate wind
  snowshoeing:         { B: 3.0,  wDelta: 0.60 },  // Good heat, some wind buffer
  cycling:             { B: 4.0,  wDelta: 0.50 },  // High heat, consistent wind
  cross_country_skiing: { B: 4.5,  wDelta: 0.50 },  // Very high heat, good protection
  trail_running:       { B: 5.5,  wDelta: 0.40 },  // Very high heat, wind matters less
  running:             { B: 6.0,  wDelta: 0.35 },  // Highest heat, least wind impact
};

// App settings stored in IndexedDB
export interface AppSettings {
  id?: number;
  weatherApiKey: string;
  temperatureUnit: 'fahrenheit' | 'celsius';
  thermalPreference?: ThermalPreference;  // How user feels during activity
  lastLocation?: {
    lat: number;
    lon: number;
    name: string;
  };
  testMode?: boolean;
  selectedActivity?: ActivityType;
  onboardingComplete?: boolean;
}

// Test weather data for testing different conditions
export interface TestWeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  cloudCover: number;
  description: string;
}

// Navigation views
export type AppView = 'home' | 'upload' | 'history' | 'settings' | 'help' | 'terms';

// Geolocation position
export interface GeoPosition {
  lat: number;
  lon: number;
}

// Comfort feedback after a run
// New values: 'satisfied' (wore as-is), 'adjusted' (made changes before saving)
// Legacy values: 'too_cold', 'just_right', 'too_hot' (for backward compatibility with old data)
export type ComfortLevel = 'satisfied' | 'adjusted' | 'too_cold' | 'just_right' | 'too_hot';

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
  activity?: ActivityType;
  comments?: string;  // Optional notes like "don't wear heavy gloves next time"
}

// Temperature adjustment based on feedback history
export interface ComfortAdjustment {
  temperatureOffset: number; // positive = dress warmer, negative = dress cooler
  confidence: number;
}

// Custom clothing options added by user
export interface CustomClothingOptions {
  id?: number;
  category: string;
  options: string[];
  activity?: ActivityType;
}

// Helper to get clothing categories for an activity
export function getClothingCategories(activity: ActivityType): ClothingCategory[] {
  return ACTIVITY_CONFIGS[activity]?.clothingCategories || ACTIVITY_CONFIGS.running.clothingCategories;
}

// Helper to get default clothing for an activity
export function getDefaultClothing(activity: ActivityType): ClothingItems {
  const categories = getClothingCategories(activity);
  const defaults: ClothingItems = {};
  for (const cat of categories) {
    defaults[cat.key] = cat.defaultValue;
  }
  return defaults;
}

// Helper to check if it's dark or near dark (for headlamp recommendations)
// Uses actual sunrise/sunset times if available, with 30-minute buffer
export function isDarkOutside(weather?: WeatherData): boolean {
  const now = new Date();
  
  // If we have actual sunrise/sunset data, use it
  if (weather?.sunrise && weather?.sunset) {
    const sunrise = new Date(weather.sunrise);
    const sunset = new Date(weather.sunset);
    
    // Validate the dates are actually valid
    if (!isNaN(sunrise.getTime()) && !isNaN(sunset.getTime())) {
      // Buffer times for safety:
      // - 30 minutes before sunrise (still dark)
      // - 60 minutes BEFORE sunset (recommend headlamp for activities that might extend into dark)
      const preBufferMs = 30 * 60 * 1000; // 30 minutes before sunrise
      const sunsetBufferMs = 60 * 60 * 1000; // 60 minutes before sunset
      
      const sunriseWithBuffer = new Date(sunrise.getTime() - preBufferMs);
      const sunsetWithBuffer = new Date(sunset.getTime() - sunsetBufferMs); // Note: BEFORE sunset now
      
      // It's "dark" (need headlamp) if:
      // - Before sunrise + buffer, OR
      // - Within 60 minutes of sunset or after
      return now < sunriseWithBuffer || now >= sunsetWithBuffer;
    }
  }
  
  // Fallback: use conservative hour-based logic
  // Before 5:30 AM or after 7:30 PM (earlier to account for dusk)
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const timeValue = hour + minutes / 60;
  return timeValue < 5.5 || timeValue >= 19.5;
}

// Helper to check if sunny (for sunglasses recommendations)
// Requires: daytime AND (low cloud cover OR decent UV)
export function isSunny(weather: WeatherData): boolean {
  // Can't be sunny if it's dark outside!
  if (isDarkOutside(weather)) {
    return false;
  }
  
  // Sunny if: very few clouds (<30%) OR moderate clouds (<50%) with good UV
  const veryClear = weather.cloudCover < 30;
  const clearWithUV = weather.cloudCover < 50 && weather.uvIndex > 3;
  return veryClear || clearWithUV;
}

// ============ RECOMMENDATION DEBUG ============

export interface SimilarMatchDebug {
  date: string;
  score: number;
  isFromFeedback: boolean;
  comfort?: string;
  clothing: ClothingItems;
}

export interface SafetyOverrideDebug {
  name: string;
  triggered: boolean;
  action?: string;
}

export interface ClothingVoteDebug {
  category: string;
  votes: { item: string; count: number }[];
  winner: string;
}

export interface RecommendationDebugInfo {
  timestamp: Date;
  activity: ActivityType;
  // Input
  inputWeather: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    cloudCover: number;
    uvIndex: number;
    description: string;
    sunrise?: string;
    sunset?: string;
  };
  // T_comfort calculation breakdown
  comfortAdjustment: {
    // Input values (in °C)
    actualTempC: number;           // Raw temperature
    feelsLikeTempC: number;        // Feels-like temperature
    // Calculation components
    delta: number;                 // Clamped Δ = clamp(FeelsLike - Actual, -15, +8)
    B: number;                     // Activity base adjustment
    wDelta: number;                // Activity feels-like weight
    thermalOffset: number;         // User thermal preference offset
    // Result
    comfortTempC: number;          // Final T_comfort in °C
    comfortTempF: number;          // Final T_comfort in °F (for display)
    tempRange: string;             // Temperature band
  };
  // Matching
  recentExactMatch: boolean;
  similarMatches: SimilarMatchDebug[];
  totalHistory: {
    runs: number;
    feedback: number;
  };
  // Voting
  clothingVotes: ClothingVoteDebug[];
  // Safety
  safetyOverrides: SafetyOverrideDebug[];
  // Final
  finalRecommendation: ClothingItems;
  confidence: number;
  source: 'recent_match' | 'similar_sessions' | 'fallback_defaults';
}
