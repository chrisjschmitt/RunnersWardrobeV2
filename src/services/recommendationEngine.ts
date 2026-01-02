import type { WeatherData, RunRecord, ClothingItems, ClothingRecommendation, RunFeedback, ComfortAdjustment, ActivityType, ClothingCategory, RecommendationDebugInfo, SimilarMatchDebug, ClothingVoteDebug, SafetyOverrideDebug, ThermalPreference, ActivityLevel } from '../types';
import { getDefaultClothing, getClothingCategories, isDarkOutside, isSunny, THERMAL_OFFSETS, ACTIVITY_THERMAL_PARAMS } from '../types';
import { ACTIVITY_TEMP_DEFAULTS, getTempRange, getWeatherOverrides, type WeatherModifiers } from '../data/activityDefaults';

// ============ DEBUG STORAGE ============
const DEBUG_STORAGE_KEY = 'trailkit_recommendation_debug';

let lastDebugInfo: RecommendationDebugInfo | null = null;

export function getLastRecommendationDebug(): RecommendationDebugInfo | null {
  // Try to get from memory first
  if (lastDebugInfo) return lastDebugInfo;
  
  // Fall back to localStorage
  try {
    const stored = localStorage.getItem(DEBUG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

function saveDebugInfo(info: RecommendationDebugInfo): void {
  lastDebugInfo = info;
  try {
    localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(info));
  } catch {
    // Ignore storage errors
  }
}

// ============ T_COMFORT CALCULATION ============
// T_comfort = T_actual + B(activity) + I(intensity) + wΔ(activity) × Δ + thermal_offset
// Where Δ = clamp(FeelsLike − Actual, −15°C, +8°C)

// Intensity adjustment values (in °C)
// Higher intensity = more body heat = raises T_comfort (positive adjustment)
// Lower intensity = less body heat = lowers T_comfort (negative adjustment)
const INTENSITY_ADJUSTMENTS: Record<ActivityLevel, number> = {
  low: -0.5,     // Less body heat, need warmer clothes (lowers T_comfort by 0.5°C)
  medium: 0.0,   // Baseline, no adjustment
  high: 1.5      // More body heat, can wear lighter clothes (raises T_comfort by 1.5°C)
};

export interface ComfortTemperatureBreakdown {
  actualTempC: number;        // T_actual in °C
  feelsLikeTempC: number;     // Feels-like in °C
  delta: number;              // Clamped Δ
  B: number;                  // Activity base adjustment
  wDelta: number;             // Activity feels-like weight
  intensityAdjustment: number; // Activity intensity adjustment (expert mode)
  thermalOffset: number;      // User's thermal preference offset
  comfortTempC: number;       // Final T_comfort in °C
}

/**
 * Calculate the comfort-adjusted temperature (T_comfort)
 * 
 * Formula: T_comfort = T_actual + B(activity) + I(intensity) + wΔ(activity) × Δ + thermal_offset
 * Where: Δ = clamp(FeelsLike − Actual, −15°C, +8°C)
 * 
 * @param weather Current weather data (temps in °F from API)
 * @param activity The activity type
 * @param thermalPreference User's thermal preference setting
 * @param activityLevel Optional activity intensity level (expert mode)
 * @returns ComfortTemperatureBreakdown with all intermediate values
 */
export function calculateComfortTemperature(
  weather: WeatherData,
  activity: ActivityType,
  thermalPreference: ThermalPreference = 'average',
  activityLevel?: ActivityLevel
): ComfortTemperatureBreakdown {
  // Convert from °F (API) to °C for calculation
  const actualTempC = (weather.temperature - 32) * 5 / 9;
  const feelsLikeTempC = (weather.feelsLike - 32) * 5 / 9;
  
  // Get activity-specific parameters
  const params = ACTIVITY_THERMAL_PARAMS[activity];
  const B = params.B;
  const wDelta = params.wDelta;
  
  // Calculate clamped delta: Δ = clamp(FeelsLike − Actual, −15, +8)
  const rawDelta = feelsLikeTempC - actualTempC;
  const delta = Math.max(-15, Math.min(8, rawDelta));
  
  // Get intensity adjustment (expert mode)
  const intensityAdjustment = activityLevel ? INTENSITY_ADJUSTMENTS[activityLevel] : 0;
  
  // Get thermal preference offset (already in °C)
  const thermalOffset = THERMAL_OFFSETS[thermalPreference];
  
  // Calculate T_comfort: T_actual + B + I + (wΔ × Δ) + thermal_offset
  const comfortTempC = actualTempC + B + intensityAdjustment + (wDelta * delta) + thermalOffset;
  
  return {
    actualTempC,
    feelsLikeTempC,
    delta,
    B,
    wDelta,
    intensityAdjustment,
    thermalOffset,
    comfortTempC
  };
}

/**
 * Convert T_comfort from °C to °F for use with existing temp range logic
 */
export function comfortTempToFahrenheit(comfortTempC: number): number {
  return (comfortTempC * 9 / 5) + 32;
}

// ============ SIMILARITY MATCHING ============
//
// How Activity Matching Works:
// 
// 1. FILTER BY ACTIVITY TYPE
//    Only history from the SAME activity is considered. If you're getting a 
//    recommendation for Running, only Running history is used (not Cycling, Walking, etc.).
//
// 2. CALCULATE SIMILARITY SCORE (0-100%)
//    For each historical session, we calculate a weighted similarity score by 
//    comparing 7 weather factors. The formula for each factor is:
//      score = 1 - (difference / (threshold * 2))
//    This gives a score of 1.0 for a perfect match, 0.0 if difference exceeds 2x threshold.
//
// 3. MINIMUM THRESHOLD
//    Only sessions with ≥40% similarity are included in the analysis.
//
// 4. FEEDBACK BOOSTS (for sessions from user feedback, not CSV imports)
//    - Recency multiplier: up to 1.05× (5% boost) for sessions within last 7 days
//      This acts as a tie-breaker - weather similarity remains primary
//    - Comfort multiplier: 1.05× (5% boost) if the session was marked "just right" or "satisfied"
//
// 5. VOTING
//    Higher-scoring matches get more "votes" when determining clothing.
//    Feedback sessions get 2x voting weight compared to CSV imports.

// ============ T_COMFORT-BASED SIMILARITY ============
// Since T_comfort = T_actual + B(activity) + wΔ × Δ + thermal_offset,
// we use T_comfort as the PRIMARY matching metric. It already captures:
// - Temperature
// - Feels-like (via Δ = FeelsLike - Actual, clamped and weighted by wΔ)
// - Activity-specific body heat (B)
// - User thermal preference
//
// We still separately match on precipitation (rain/no-rain) and UV.

// T_comfort-based thresholds
const THRESHOLDS = {
  comfortTemp: 3,      // ±3°C T_comfort → perfect match if within 3°C, 0% if >6°C different
  precipitation: 0.1,  // Binary comparison (rain/no-rain), not continuous
  uvIndex: 2           // ±2 → perfect match if within 2, 0% if >4 different
};

// Weights for T_comfort-based similarity scoring
const WEIGHTS = {
  comfortTemp: 5.0,    // Primary driver - T_comfort encapsulates temp/feels-like/activity
  precipitation: 2.5,  // Important - rain/no-rain is a major clothing decision
  uvIndex: 0.5         // Minor - affects sunglasses/sun protection
};


// Temperature adjustment per feedback type (in °F)
// Note: New feedback types (satisfied/adjusted) have no temp adjustment - 
// thermal preference is now handled via Settings
const FEEDBACK_ADJUSTMENT: Record<string, number> = {
  too_cold: 8,    // Legacy: If too cold, treat weather as 8°F colder
  just_right: 0,  // Legacy: No adjustment needed
  too_hot: -8,    // Legacy: If too hot, treat weather as 8°F warmer
  satisfied: 0,   // New: User was happy with outfit, no adjustment
  adjusted: 0     // New: User made clothing changes before saving, no temp adjustment
};

interface SimilarityScore {
  record: RunRecord;
  score: number;
  isFromFeedback?: boolean;
}

/**
 * Calculate how similar two weather conditions are using T_comfort (0-1, higher = more similar)
 * 
 * Uses T_comfort as the primary metric since it already encapsulates:
 * - Actual temperature
 * - Feels-like (via Δ)
 * - Activity-specific body heat (B)
 * 
 * Also considers precipitation and UV separately.
 * 
 * Example calculation for 10°C T_comfort current vs 12°C T_comfort historical:
 *   T_comfort:     diff=2°C  → score = 1 - (2/6) = 0.67 × 5.0 weight = 3.33
 *   Precipitation: match     → score = 1.0       × 2.5 weight = 2.50
 *   UV Index:      diff=1    → score = 1 - (1/4) = 0.75 × 0.5 weight = 0.38
 *   
 *   Total = 6.21 / 8.0 = 78% match
 */
function calculateSimilarity(
  current: WeatherData, 
  historical: RunRecord,
  activity: ActivityType = 'running',
  thermalPreference: ThermalPreference = 'average'
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  // Calculate T_comfort for both current and historical weather
  const currentComfort = calculateComfortTemperature(current, activity, thermalPreference);
  
  // For historical, create a WeatherData-like object
  const historicalWeather: WeatherData = {
    temperature: historical.temperature,
    feelsLike: historical.feelsLike,
    humidity: historical.humidity,
    pressure: 0, // Not stored in RunRecord
    windSpeed: historical.windSpeed,
    precipitation: historical.precipitation,
    cloudCover: historical.cloudCover,
    uvIndex: historical.uvIndex,
    icon: '',
    description: '',
    location: '',
    timestamp: new Date()
  };
  const historicalComfort = calculateComfortTemperature(historicalWeather, activity, thermalPreference);

  // T_comfort similarity (in °C)
  const comfortDiff = Math.abs(currentComfort.comfortTempC - historicalComfort.comfortTempC);
  const comfortScore = Math.max(0, 1 - comfortDiff / (THRESHOLDS.comfortTemp * 2));
  weightedScore += comfortScore * WEIGHTS.comfortTemp;
  totalWeight += WEIGHTS.comfortTemp;

  // Precipitation similarity (binary-ish: both have or don't have)
  const currentHasRain = current.precipitation > 0;
  const historicalHasRain = historical.precipitation > 0;
  const precipScore = currentHasRain === historicalHasRain ? 1 : 0.3;
  weightedScore += precipScore * WEIGHTS.precipitation;
  totalWeight += WEIGHTS.precipitation;

  // UV index similarity
  const uvDiff = Math.abs(current.uvIndex - historical.uvIndex);
  const uvScore = Math.max(0, 1 - uvDiff / (THRESHOLDS.uvIndex * 2));
  weightedScore += uvScore * WEIGHTS.uvIndex;
  totalWeight += WEIGHTS.uvIndex;

  return weightedScore / totalWeight;
}

// Calculate similarity between current weather and feedback weather
/**
 * Calculate similarity between current weather and feedback weather using T_comfort
 */
function calculateFeedbackSimilarity(
  current: WeatherData, 
  feedback: RunFeedback,
  activity: ActivityType = 'running',
  thermalPreference: ThermalPreference = 'average'
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  // Calculate T_comfort for both current and feedback weather
  const currentComfort = calculateComfortTemperature(current, activity, thermalPreference);
  
  // For feedback, create a WeatherData-like object
  const feedbackWeather: WeatherData = {
    temperature: feedback.temperature,
    feelsLike: feedback.feelsLike,
    humidity: feedback.humidity,
    pressure: 0, // Not stored in feedback
    windSpeed: feedback.windSpeed,
    precipitation: 0, // Not stored in feedback
    cloudCover: 0,
    uvIndex: 0,
    icon: '',
    description: '',
    location: '',
    timestamp: new Date()
  };
  const feedbackComfort = calculateComfortTemperature(feedbackWeather, activity, thermalPreference);

  // T_comfort similarity (in °C)
  const comfortDiff = Math.abs(currentComfort.comfortTempC - feedbackComfort.comfortTempC);
  const comfortScore = Math.max(0, 1 - comfortDiff / (THRESHOLDS.comfortTemp * 2));
  weightedScore += comfortScore * WEIGHTS.comfortTemp;
  totalWeight += WEIGHTS.comfortTemp;

  return weightedScore / totalWeight;
}

// Calculate comfort adjustment based on feedback history
export function calculateComfortAdjustment(
  currentWeather: WeatherData,
  feedbackHistory: RunFeedback[]
): ComfortAdjustment {
  if (feedbackHistory.length === 0) {
    return { temperatureOffset: 0, confidence: 0 };
  }

  let totalWeight = 0;
  let weightedOffset = 0;

  for (const feedback of feedbackHistory) {
    const similarity = calculateFeedbackSimilarity(currentWeather, feedback);
    
    // Only consider feedback with reasonable similarity (> 0.4)
    if (similarity > 0.4) {
      const adjustment = FEEDBACK_ADJUSTMENT[feedback.comfort];
      // Weight by similarity and recency (more recent = more weight)
      const daysSince = Math.max(1, (Date.now() - new Date(feedback.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      const recencyWeight = Math.max(0.3, 1 - daysSince / 365); // Decay over a year
      const weight = similarity * recencyWeight;
      
      weightedOffset += adjustment * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return { temperatureOffset: 0, confidence: 0 };
  }

  const offset = weightedOffset / totalWeight;
  const confidence = Math.min(100, Math.round(totalWeight * 25)); // Scale confidence

  return { temperatureOffset: offset, confidence };
}

// Find recent feedback that closely matches current weather
function findRecentSimilarFeedback(
  currentWeather: WeatherData,
  feedbackHistory: RunFeedback[]
): RunFeedback | null {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  const recentFeedback = feedbackHistory.filter(f => 
    new Date(f.timestamp).getTime() > sevenDaysAgo
  );
  
  if (recentFeedback.length === 0) return null;
  
  let bestMatch: RunFeedback | null = null;
  let bestSimilarity = 0;
  
  for (const feedback of recentFeedback) {
    const similarity = calculateFeedbackSimilarity(currentWeather, feedback);
    
    if (similarity > 0.85 && similarity > bestSimilarity) {
      bestMatch = feedback;
      bestSimilarity = similarity;
    }
  }
  
  return bestMatch;
}

// Convert feedback records to run records for clothing recommendations
// Extends RunRecord with feedback-specific fields for display
function feedbackToRunRecord(feedback: RunFeedback): RunRecord & { comfort?: string; comments?: string; activityLevel?: string; duration?: string } {
  // Extract time from timestamp
  const time = feedback.timestamp 
    ? new Date(feedback.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
  
  return {
    date: feedback.date,
    time,
    location: 'From feedback',
    temperature: feedback.temperature,
    feelsLike: feedback.feelsLike,
    humidity: feedback.humidity,
    pressure: 0,
    precipitation: feedback.precipitation,
    uvIndex: 0,
    windSpeed: feedback.windSpeed,
    cloudCover: feedback.cloudCover,
    clothing: feedback.clothing,
    activity: feedback.activity,
    // Include feedback-specific fields
    comfort: feedback.comfort,
    comments: feedback.comments,
    activityLevel: feedback.activityLevel,
    duration: feedback.duration
  };
}

/**
 * Find runs with similar weather conditions
 * 
 * This function:
 * 1. Calculates similarity scores for all historical sessions (both CSV imports and feedback)
 * 2. Filters out sessions below the minimum similarity threshold (default 40%)
 * 3. Applies multipliers to feedback sessions (weather similarity remains primary):
 *    - Recency multiplier: up to 1.05× (5% boost) for sessions within last 7 days
 *    - Comfort multiplier: 1.05× (5% boost) if the user marked the session as "just right" or "satisfied"
 * 4. Returns sessions sorted by score (highest first)
 * 
 * @param currentWeather - Current weather conditions to match against
 * @param runs - Historical runs from CSV imports
 * @param feedbackHistory - Historical sessions from user feedback
 * @param minSimilarity - Minimum similarity threshold (default 0.4 = 40%)
 * @returns Array of similar sessions with scores, sorted highest to lowest
 */
function findSimilarRuns(
  currentWeather: WeatherData,
  runs: RunRecord[],
  feedbackHistory: RunFeedback[],
  minSimilarity: number = 0.5,
  activity: ActivityType = 'running',
  thermalPreference: ThermalPreference = 'average'
): SimilarityScore[] {
  const similarities: SimilarityScore[] = [];

  // Add CSV runs (no boosts applied - these are historical imports)
  for (const run of runs) {
    const score = calculateSimilarity(currentWeather, run, activity, thermalPreference);
    if (score >= minSimilarity) {
      similarities.push({ record: run, score, isFromFeedback: false });
    }
  }

  // Add ALL feedback records as runs (with boosts for recency and comfort)
  for (const feedback of feedbackHistory) {
    const runRecord = feedbackToRunRecord(feedback);
    const score = calculateSimilarity(currentWeather, runRecord, activity, thermalPreference);
    
    if (score >= minSimilarity) {
      // Recency multiplier: more recent = slight boost (tie-breaker, not compensation)
      // Formula: 1.0 + (0.05 × min(1, 7 / days_ago))
      // Examples: 1 day ago = 1.05×, 3.5 days ago = 1.05×, 7 days ago = 1.05×, 30 days ago = 1.01×, 100+ days = 1.0×
      // This gives a small boost (up to 5%) to recent sessions without overriding weather similarity
      const daysSince = Math.max(1, (Date.now() - new Date(feedback.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      const recencyMultiplier = 1.0 + (0.05 * Math.min(1, 7 / daysSince));
      
      // Comfort boost: +5% multiplier if user said this session was "just right" or "satisfied"
      const comfortMultiplier = (feedback.comfort === 'just_right' || feedback.comfort === 'satisfied') ? 1.05 : 1.0;
      
      // Apply multipliers (weather similarity remains primary, recency/comfort are tie-breakers)
      const adjustedScore = Math.min(1, score * recencyMultiplier * comfortMultiplier);
      
      similarities.push({ record: runRecord, score: adjustedScore, isFromFeedback: true });
    }
  }

  // Sort by score, highest first
  return similarities.sort((a, b) => b.score - a.score);
}

// Get most common item for a clothing category
function getMostCommonItem(
  items: string[],
  defaultValue: string = 'none'
): { item: string; count: number; total: number } {
  if (items.length === 0) {
    return { item: defaultValue, count: 0, total: 0 };
  }

  const counts = new Map<string, number>();
  for (const item of items) {
    const normalized = item.toLowerCase().trim();
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }

  let maxCount = 0;
  let mostCommon = defaultValue;
  
  counts.forEach((count, item) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = item;
    }
  });

  // Capitalize first letter
  mostCommon = mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1);

  return { item: mostCommon, count: maxCount, total: items.length };
}

// Apply smart accessory and eyewear logic based on conditions
function applyAccessoryLogic(
  clothing: ClothingItems,
  weather: WeatherData,
  activity: ActivityType
): ClothingItems {
  const result = { ...clothing };
  const categories = getClothingCategories(activity);
  
  // Determine what's needed based on CURRENT conditions
  const needsSunglasses = isSunny(weather);
  const needsHeadlamp = isDarkOutside(weather);
  
  // Handle 'eyewear' category (cycling, XC skiing)
  const hasEyewear = categories.some(c => c.key === 'eyewear');
  if (hasEyewear) {
    const currentEyewear = result.eyewear?.toLowerCase() || 'none';
    
    // Override based on current lighting - don't trust historical votes for lighting-dependent items
    if (needsSunglasses) {
      result.eyewear = 'Sunglasses';
    } else if (needsHeadlamp) {
      result.eyewear = 'Clear glasses'; // For visibility at dusk/night
    } else if (currentEyewear === 'sunglasses' || currentEyewear === 'clear glasses') {
      // It's neither sunny nor dark - remove lighting-specific eyewear from historical vote
      result.eyewear = 'None';
    }
  }
  
  // Handle 'accessories' category (running, trail running, hiking, etc.)
  const hasAccessories = categories.some(c => c.key === 'accessories');
  if (hasAccessories) {
    const currentAccessory = result.accessories?.toLowerCase() || 'none';
    
    // Override based on current lighting - headlamp/sunglasses depend on NOW, not history
    if (needsSunglasses) {
      result.accessories = 'Sunglasses';
    } else if (needsHeadlamp) {
      result.accessories = 'Headlamp';
    } else if (currentAccessory === 'headlamp' || currentAccessory === 'sunglasses') {
      // It's neither sunny nor dark - remove lighting-specific accessory from historical vote
      result.accessories = 'None';
    }
  }
  
  return result;
}

// Main recommendation function with activity support
export function getClothingRecommendation(
  currentWeather: WeatherData,
  runs: RunRecord[],
  feedbackHistory: RunFeedback[] = [],
  activity: ActivityType = 'running',
  thermalPreference: ThermalPreference = 'average',
  activityLevel?: ActivityLevel
): ClothingRecommendation {
  // Calculate T_comfort using new formula (includes intensity adjustment if provided)
  const comfortBreakdown = calculateComfortTemperature(currentWeather, activity, thermalPreference, activityLevel);
  const adjustedTempF = comfortTempToFahrenheit(comfortBreakdown.comfortTempC);
  
  const categories = getClothingCategories(activity);
  const adjustedTemp = adjustedTempF;  // Now using T_comfort in °F
  
  // Initialize debug info
  const debugSafetyOverrides: SafetyOverrideDebug[] = [];
  
  // Create adjusted weather using T_comfort for temperature-based decisions
  const adjustedWeather: WeatherData = {
    ...currentWeather,
    temperature: adjustedTempF,
    feelsLike: adjustedTempF  // T_comfort already incorporates feels-like
  };

  // Check for recent similar feedback first
  const recentMatch = findRecentSimilarFeedback(currentWeather, feedbackHistory);
  if (recentMatch) {
    const clothing = applyAccessoryLogic(recentMatch.clothing, currentWeather, activity);
    
    // Save debug info for recent match case
    const debugInfo: RecommendationDebugInfo = {
      timestamp: new Date(),
      activity,
      inputWeather: {
        temperature: currentWeather.temperature,
        feelsLike: currentWeather.feelsLike,
        humidity: currentWeather.humidity,
        windSpeed: currentWeather.windSpeed,
        precipitation: currentWeather.precipitation,
        cloudCover: currentWeather.cloudCover,
        uvIndex: currentWeather.uvIndex,
        description: currentWeather.description,
        sunrise: currentWeather.sunrise?.toLocaleTimeString() || undefined,
        sunset: currentWeather.sunset?.toLocaleTimeString() || undefined,
      },
      comfortAdjustment: {
        actualTempC: comfortBreakdown.actualTempC,
        feelsLikeTempC: comfortBreakdown.feelsLikeTempC,
        delta: comfortBreakdown.delta,
        B: comfortBreakdown.B,
        wDelta: comfortBreakdown.wDelta,
        intensityAdjustment: comfortBreakdown.intensityAdjustment,
        thermalOffset: comfortBreakdown.thermalOffset,
        comfortTempC: comfortBreakdown.comfortTempC,
        comfortTempF: adjustedTempF,
        tempRange: getTempRange(adjustedTempF),
      },
      recentExactMatch: true,
      similarMatches: [{
        date: recentMatch.date,
        score: 0.95,
        isFromFeedback: true,
        comfort: recentMatch.comfort,
        clothing: recentMatch.clothing,
      }],
      totalHistory: { runs: runs.length, feedback: feedbackHistory.length },
      clothingVotes: [],
      safetyOverrides: [],
      finalRecommendation: clothing,
      confidence: 95,
      source: 'recent_match',
    };
    saveDebugInfo(debugInfo);
    
    return {
      clothing,
      confidence: 95,
      matchingRuns: 1,
      totalRuns: runs.length + feedbackHistory.length,
      similarConditions: [feedbackToRunRecord(recentMatch)]
    };
  }

  const similarRuns = findSimilarRuns(adjustedWeather, runs, feedbackHistory, 0.4, activity, thermalPreference);
  
  // ============ VOTING SYSTEM ============
  // Build clothing votes from similar runs for each category
  // 
  // How it works:
  // 1. Each similar session "votes" for the clothing it used
  // 2. Higher similarity = more votes (score × 3, rounded up)
  // 3. Feedback sessions get 2× voting weight vs CSV imports
  // 4. The item with the most votes wins for each category
  //
  // Example with 3 similar sessions:
  //   Session A: 80% match, feedback → votes = ceil(0.8 × 3) × 2 = 6 votes
  //   Session B: 60% match, CSV     → votes = ceil(0.6 × 3) × 1 = 2 votes
  //   Session C: 50% match, feedback → votes = ceil(0.5 × 3) × 2 = 4 votes
  //
  // If A wore "Long sleeve", B wore "T-shirt", C wore "Long sleeve":
  //   Long sleeve: 6 + 4 = 10 votes → WINNER
  //   T-shirt: 2 votes
  
  const clothingVotes: Record<string, string[]> = {};
  for (const cat of categories) {
    clothingVotes[cat.key] = [];
  }

  for (const { record, score, isFromFeedback } of similarRuns) {
    // Higher similarity = more votes (1-3 votes based on score)
    const baseRepeat = Math.ceil(score * 3);
    // Feedback sessions get 2× voting weight
    const repeatCount = isFromFeedback ? baseRepeat * 2 : baseRepeat;
    
    // Add votes for each clothing category
    for (let i = 0; i < repeatCount; i++) {
      for (const cat of categories) {
        if (record.clothing[cat.key]) {
          clothingVotes[cat.key].push(record.clothing[cat.key]);
        }
      }
    }
  }

  // Get most common item for each category
  const clothing: ClothingItems = {};
  const results: Record<string, { item: string; count: number; total: number }> = {};
  
  for (const cat of categories) {
    results[cat.key] = getMostCommonItem(clothingVotes[cat.key], cat.defaultValue);
    clothing[cat.key] = results[cat.key].item;
  }

  // ============ SAFETY OVERRIDES ============
  // These overrides prevent dangerous recommendations that could leave the user
  // freezing or unprepared. They fire AFTER voting, so they can override
  // historical patterns when safety is at stake.
  //
  // Safety overrides only trigger if:
  // 1. The temperature is below a threshold, AND
  // 2. The voted recommendation is inadequate (e.g., "None" for gloves in freezing weather)
  //
  // Override thresholds:
  // - Tops:      <25°F → upgrade from t-shirt to warm layers
  //              <40°F → upgrade from t-shirt to long sleeve
  // - Head:      <40°F → add head cover if "None" voted
  //              <25°F → use beanie instead of headband
  // - Bottoms:   <25°F → upgrade from shorts to insulated pants
  //              <45°F → upgrade from shorts to tights
  // - Shoes:     <32°F or rain/snow → recommend waterproof footwear
  // - Rain gear: if raining → add rain jacket
  // - Sunglasses: if sunny → add to accessories
  // - Headlamp:  if dark/near sunset → add to accessories
  //
  // TODO: Consider consolidating weather detection logic with getFallbackRecommendation
  // and getWeatherOverrides() in activityDefaults.ts to reduce duplication
  const description = currentWeather.description.toLowerCase();
  
  // Check if it's snowing (below freezing OR snow in description)
  const isSnowing = description.includes('snow') || 
    description.includes('flurr') ||
    description.includes('sleet') ||
    (currentWeather.temperature < 32 && currentWeather.precipitation > 0);
  
  // Only consider it rain if it's NOT snowing
  const isRaining = !isSnowing && (
    currentWeather.precipitation > 0 || 
    description.includes('rain') ||
    description.includes('drizzle') ||
    description.includes('shower')
  );

  // Rain gear override - only for actual rain, not snow
  // TODO: This duplicates logic in getWeatherOverrides() - consider using that instead
  const rainKey = categories.find(c => c.key === 'rainGear' || c.key === 'outerLayer');
  const rainOverrideTriggered = rainKey && isRaining && clothing[rainKey.key]?.toLowerCase() === 'none';
  debugSafetyOverrides.push({
    name: '🌧️ Rain gear',
    triggered: !!rainOverrideTriggered,
    action: rainOverrideTriggered ? `→ ${adjustedTemp < 50 ? 'Waterproof jacket' : 'Light rain jacket'}` : undefined,
  });
  if (rainOverrideTriggered && rainKey) {
    clothing[rainKey.key] = adjustedTemp < 50 ? 'Waterproof jacket' : 'Light rain jacket';
  }

  // Helper to find first valid option from a list of preferences
  // This ensures we never set a value that doesn't exist in the activity's options
  const findValidOption = (categoryKey: string, preferences: string[]): string | null => {
    const category = categories.find(c => c.key === categoryKey);
    if (!category) return null;
    for (const pref of preferences) {
      const match = category.options.find(opt => opt.toLowerCase() === pref.toLowerCase());
      if (match) return match;
    }
    // If no preference matches, return null (keep existing value)
    return null;
  };

  // Comprehensive preference lists for all activities
  // When adding a new activity, add its clothing terms to these lists
  const WARM_TOPS = [
    // Athletic
    'Heavy merino', 'Base layer + jacket', 'Expedition weight',
    // Casual
    'Fleece', 'Sweater', 'Light jacket',
    // Cycling specific
    'Thermal jersey', 'Jersey + jacket', 'Jersey + vest',
    // XC Skiing specific
    'Wind jacket + fleece', 'XC jacket', 'Soft shell'
  ];
  
  const COLD_TOPS = [
    // Athletic
    'Merino base', 'Long sleeve', 'Base layer',
    // Casual
    'Sweater', 'Fleece',
    // Cycling specific
    'Long sleeve jersey', 'Thermal jersey',
    // XC Skiing specific
    'XC jacket'
  ];

  const WARM_OUTER = [
    'Insulated jacket', 'Down jacket', 'Winter coat', 
    'Hardshell', 'Heavy puffy', 'Softshell'
  ];

  // NOTE: VERY_COLD_GLOVES and COLD_GLOVES removed - gloves handled by activity defaults

  const VERY_COLD_HEAD = [
    'Beanie', 'Balaclava', 'Insulated hat', 'Light beanie'
  ];

  const COLD_HEAD = [
    'Headband', 'Ear warmers', 'Fleece headband', 'Beanie', 'Cap', 'Buff'
  ];

  // Base layer override for cold - prevent T-shirt recommendations in freezing weather
  const baseKey = categories.find(c => c.key === 'baseLayer' || c.key === 'tops');
  if (baseKey) {
    const currentBase = clothing[baseKey.key]?.toLowerCase() || '';
    const isTooLight = currentBase.includes('t-shirt') || 
                       currentBase.includes('singlet') || 
                       currentBase.includes('tank') ||
                       currentBase.includes('sleeveless') ||
                       currentBase.includes('short sleeve');
    
    if (adjustedTemp < 25 && isTooLight) {
      // Very cold: need heavy base layer
      const warmTop = findValidOption(baseKey.key, WARM_TOPS);
      if (warmTop) clothing[baseKey.key] = warmTop;
    } else if (adjustedTemp < 40 && isTooLight) {
      // Cold: need at least a long sleeve
      const coldTop = findValidOption(baseKey.key, COLD_TOPS);
      if (coldTop) clothing[baseKey.key] = coldTop;
    } else if (adjustedTemp < 50 && (currentBase.includes('singlet') || currentBase.includes('sleeveless'))) {
      // Cool: singlet/sleeveless is too light
      const coolTop = findValidOption(baseKey.key, ['Long sleeve', 'Long sleeve jersey', 'T-shirt']);
      if (coolTop) clothing[baseKey.key] = coolTop;
    }
  }

  // Mid layer override for very cold
  const midKey = categories.find(c => c.key === 'midLayer');
  if (midKey && adjustedTemp < 25 && clothing[midKey.key]?.toLowerCase() === 'none') {
    const midLayer = findValidOption('midLayer', ['Fleece', 'Light fleece', 'Grid fleece', 'Light puffy', 'Heavy puffy']);
    if (midLayer) clothing[midKey.key] = midLayer;
  }

  // Outer layer override for very cold (when not raining/snowing which is already handled)
  const outerKey = categories.find(c => c.key === 'outerLayer');
  if (outerKey && adjustedTemp < 20 && clothing[outerKey.key]?.toLowerCase() === 'none') {
    const outerLayer = findValidOption('outerLayer', WARM_OUTER);
    if (outerLayer) clothing[outerKey.key] = outerLayer;
  }

  // NOTE: Gloves override removed - activity defaults already handle gloves for cold temps,
  // and users may prefer their own choices (mittens, light gloves, etc.)

  // Head cover override for cold
  const headKey = categories.find(c => c.key === 'headCover' || c.key === 'helmet');
  if (headKey && headKey.key === 'headCover' && adjustedTemp < 40 && clothing[headKey.key]?.toLowerCase() === 'none') {
    const headCover = adjustedTemp < 25
      ? findValidOption('headCover', VERY_COLD_HEAD)
      : findValidOption('headCover', COLD_HEAD);
    if (headCover) clothing[headKey.key] = headCover;
  }

  // Bottoms override for cold - prevent shorts in freezing weather
  const bottomsKey = categories.find(c => c.key === 'bottoms' || c.key === 'bibs');
  if (bottomsKey) {
    const currentBottoms = clothing[bottomsKey.key]?.toLowerCase() || '';
    const isTooLight = currentBottoms.includes('shorts') || 
                       currentBottoms.includes('short') ||
                       currentBottoms.includes('capri');
    
    // Comprehensive preference lists for cold weather bottoms
    const VERY_COLD_BOTTOMS = [
      // Athletic
      'Insulated pants', 'Tights', 'Fleece-lined leggings', 'Softshell pants', 
      'Hardshell pants', 'Bibs', 'Bib tights',
      // Casual
      'Jeans', 'Casual pants', 'Leggings',
      // Cycling
      'Bib tights', 'Tights over bibs',
      // XC Skiing
      'XC pants', 'Softshell pants'
    ];
    
    const COLD_BOTTOMS = [
      // Athletic
      'Tights', 'Fleece-lined leggings', 'Hiking pants',
      // Casual
      'Casual pants', 'Leggings', 'Jeans',
      // Cycling
      'Bib tights', '3/4 bibs'
    ];
    
    if (adjustedTemp < 25 && isTooLight) {
      // Very cold: need insulated pants or tights
      const warmBottoms = findValidOption(bottomsKey.key, VERY_COLD_BOTTOMS);
      if (warmBottoms) clothing[bottomsKey.key] = warmBottoms;
    } else if (adjustedTemp < 45 && isTooLight) {
      // Cold: at least need tights or pants
      const coldBottoms = findValidOption(bottomsKey.key, COLD_BOTTOMS);
      if (coldBottoms) clothing[bottomsKey.key] = coldBottoms;
    }
  }

  // Footwear override for cold/wet weather
  const shoesKey = categories.find(c => c.key === 'shoes' || c.key === 'boots');
  if (shoesKey) {
    const shoeCategory = categories.find(c => c.key === shoesKey.key);
    const shoeOptions = shoeCategory?.options || [];
    const currentShoes = clothing[shoesKey.key]?.toLowerCase() || '';
    const isTooLight = currentShoes.includes('sandal') || 
                       currentShoes.includes('sneaker') || 
                       currentShoes.includes('flat') ||
                       currentShoes === 'running shoes';
    
    // Helper to find first valid shoe option
    const findValidShoe = (preferences: string[]): string | null => {
      for (const pref of preferences) {
        const match = shoeOptions.find(opt => opt.toLowerCase() === pref.toLowerCase());
        if (match) return match;
      }
      return null;
    };
    
    // In freezing temps, recommend boots/warmer footwear
    if (adjustedTemp < 32 && isTooLight) {
      const coldShoe = findValidShoe([
        'Waterproof boots', 'Waterproof shoes', 'Boots', 'Winter boots', 
        'Hiking boots', 'Walking shoes'
      ]);
      if (coldShoe) {
        clothing[shoesKey.key] = coldShoe;
      }
    }
    
    // If it's wet/snowy, recommend waterproof options
    if ((isSnowing || isRaining) && isTooLight) {
      const wetShoe = findValidShoe([
        'Waterproof shoes', 'Waterproof boots', 'Boots', 'Winter boots'
      ]);
      if (wetShoe) {
        clothing[shoesKey.key] = wetShoe;
      }
    }
  }

  // Apply accessory logic
  const finalClothing = applyAccessoryLogic(clothing, currentWeather, activity);

  const avgSimilarity = similarRuns.length > 0
    ? similarRuns.reduce((sum, r) => sum + r.score, 0) / similarRuns.length
    : 0;
  
  // Confidence calculation: 30% based on session count, 70% based on match quality
  // This weights similarity more heavily - a few close matches = high confidence
  const confidence = Math.min(100, Math.round(
    (Math.min(similarRuns.length, 10) / 10) * 30 +
    avgSimilarity * 70
  ));

  // Build clothing votes debug info
  const clothingVotesDebug: ClothingVoteDebug[] = [];
  for (const cat of categories) {
    const voteCounts = new Map<string, number>();
    for (const vote of clothingVotes[cat.key]) {
      const normalized = vote.toLowerCase();
      voteCounts.set(normalized, (voteCounts.get(normalized) || 0) + 1);
    }
    const sortedVotes = Array.from(voteCounts.entries())
      .map(([item, count]) => ({ item: item.charAt(0).toUpperCase() + item.slice(1), count }))
      .sort((a, b) => b.count - a.count);
    clothingVotesDebug.push({
      category: cat.key,
      votes: sortedVotes.slice(0, 5),
      winner: finalClothing[cat.key] || cat.defaultValue,
    });
  }

  // Build similar matches debug info
  const similarMatchesDebug: SimilarMatchDebug[] = similarRuns.slice(0, 10).map(s => ({
    date: s.record.date,
    score: Math.round(s.score * 100) / 100,
    isFromFeedback: s.isFromFeedback || false,
    comfort: (s.record as RunRecord & { comfort?: string }).comfort,
    clothing: s.record.clothing,
  }));

  // Track additional safety overrides by comparing voted winners vs final
  const needsSunglasses = isSunny(currentWeather);
  const needsHeadlamp = isDarkOutside(currentWeather);
  
  debugSafetyOverrides.push({
    name: '❄️ Cold tops (<40°F)',
    triggered: adjustedTemp < 40,
    action: adjustedTemp < 40 ? `Temp: ${Math.round(adjustedTemp)}°F` : undefined,
  });
  // NOTE: Gloves override removed - handled by activity defaults
  debugSafetyOverrides.push({
    name: '🧢 Head cover (<40°F)',
    triggered: adjustedTemp < 40,
    action: adjustedTemp < 40 ? `→ ${adjustedTemp < 25 ? 'Beanie' : 'Headband'}` : undefined,
  });
  debugSafetyOverrides.push({
    name: '☀️ Sunglasses',
    triggered: needsSunglasses,
    action: needsSunglasses ? '→ Sunglasses' : undefined,
  });
  debugSafetyOverrides.push({
    name: '🔦 Headlamp/dark',
    triggered: needsHeadlamp,
    action: needsHeadlamp ? '→ Headlamp' : undefined,
  });

  // Save debug info
  const debugInfo: RecommendationDebugInfo = {
    timestamp: new Date(),
    activity,
    inputWeather: {
      temperature: currentWeather.temperature,
      feelsLike: currentWeather.feelsLike,
      humidity: currentWeather.humidity,
      windSpeed: currentWeather.windSpeed,
      precipitation: currentWeather.precipitation,
      cloudCover: currentWeather.cloudCover,
      uvIndex: currentWeather.uvIndex,
      description: currentWeather.description,
      sunrise: currentWeather.sunrise?.toLocaleTimeString() || undefined,
      sunset: currentWeather.sunset?.toLocaleTimeString() || undefined,
    },
    comfortAdjustment: {
      actualTempC: comfortBreakdown.actualTempC,
      feelsLikeTempC: comfortBreakdown.feelsLikeTempC,
      delta: comfortBreakdown.delta,
      B: comfortBreakdown.B,
      wDelta: comfortBreakdown.wDelta,
      intensityAdjustment: comfortBreakdown.intensityAdjustment,
      thermalOffset: comfortBreakdown.thermalOffset,
      comfortTempC: comfortBreakdown.comfortTempC,
      comfortTempF: adjustedTempF,
      tempRange: getTempRange(adjustedTempF),
    },
    recentExactMatch: false,
    similarMatches: similarMatchesDebug,
    totalHistory: { runs: runs.length, feedback: feedbackHistory.length },
    clothingVotes: clothingVotesDebug,
    safetyOverrides: debugSafetyOverrides,
    finalRecommendation: finalClothing,
    confidence,
    source: similarRuns.length > 0 ? 'similar_sessions' : 'fallback_defaults',
  };
  saveDebugInfo(debugInfo);

  return {
    clothing: finalClothing,
    confidence,
    matchingRuns: similarRuns.length,
    totalRuns: runs.length + feedbackHistory.length,
    similarConditions: similarRuns.slice(0, 5).map(s => s.record)
  };
}

// Get fallback recommendation when no history exists
// Uses data-driven activity-specific defaults from activityDefaults.ts
export function getFallbackRecommendation(
  weather: WeatherData,
  feedbackHistory: RunFeedback[] = [],
  activity: ActivityType = 'running',
  thermalPreference: ThermalPreference = 'average',
  activityLevel?: ActivityLevel
): ClothingItems {
  // Calculate T_comfort for this activity (includes intensity adjustment if provided)
  const comfortBreakdown = calculateComfortTemperature(weather, activity, thermalPreference, activityLevel);
  const adjustedTempF = comfortTempToFahrenheit(comfortBreakdown.comfortTempC);
  
  // Check if we have any feedback with similar T_comfort
  const relevantFeedback = feedbackHistory.filter(f => {
    // Compare using T_comfort difference (in °F for now)
    const tempDiff = Math.abs(weather.temperature - f.temperature);
    return tempDiff <= 10;
  });

  if (relevantFeedback.length > 0) {
    relevantFeedback.sort((a, b) => {
      // Prioritize "satisfied" over "adjusted" feedback
      if (a.comfort === 'satisfied' && b.comfort !== 'satisfied') return -1;
      if (b.comfort === 'satisfied' && a.comfort !== 'satisfied') return 1;
      // Then prioritize by recency
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return applyAccessoryLogic(relevantFeedback[0].clothing, weather, activity);
  }

  // Get base defaults for this activity
  const clothing = getDefaultClothing(activity);
  const categories = getClothingCategories(activity);
  
  // Use T_comfort for temperature band selection
  const adjustedTemp = adjustedTempF;
  
  // Get temperature range
  const tempRange = getTempRange(adjustedTemp);
  
  // Get activity-specific defaults for this temperature range
  const activityDefaults = ACTIVITY_TEMP_DEFAULTS[activity];
  const tempDefaults = activityDefaults[tempRange];
  
  // Apply temperature-based defaults (only if the value exists in the category's options)
  for (const [key, value] of Object.entries(tempDefaults)) {
    if (value) {
      applyIfExists(clothing, categories, key, value);
    }
  }
  
  // Calculate weather modifiers
  // TODO: This logic is duplicated in getClothingRecommendation - consider extracting
  // to a shared utility function like detectWeatherConditions(weather)
  const description = weather.description.toLowerCase();
  const isSnowing = description.includes('snow') || 
    description.includes('flurr') ||
    description.includes('sleet') ||
    (weather.temperature < 32 && weather.precipitation > 0);
  const isRaining = !isSnowing && weather.precipitation > 0;
  
  const modifiers: WeatherModifiers = {
    isRaining,
    isSnowing,
    isWindy: weather.windSpeed > 10,
    isSunny: isSunny(weather),
    isDark: isDarkOutside(weather),
  };
  
  // Get weather-based overrides
  const weatherOverrides = getWeatherOverrides(activity, modifiers, tempRange);
  
  // Apply weather overrides
  for (const [key, value] of Object.entries(weatherOverrides)) {
    if (value) {
      applyIfExists(clothing, categories, key, value);
    }
  }

  // Apply accessory logic (sunglasses/headlamp based on conditions)
  return applyAccessoryLogic(clothing, weather, activity);
}

// Helper to apply a value only if the category exists AND the value is valid
function applyIfExists(
  clothing: ClothingItems, 
  categories: ClothingCategory[], 
  key: string, 
  value: string
): void {
  const category = categories.find(c => c.key === key);
  if (category) {
    // Check if the value exists in options (case-insensitive)
    const validOption = category.options.find(
      opt => opt.toLowerCase() === value.toLowerCase()
    );
    if (validOption) {
      clothing[key] = validOption; // Use the properly-cased version
    }
    // If value isn't valid, don't change the default
  }
}
