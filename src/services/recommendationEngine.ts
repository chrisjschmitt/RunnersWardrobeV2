import type { WeatherData, RunRecord, ClothingItems, ClothingRecommendation, RunFeedback, ComfortAdjustment, ActivityType, ClothingCategory, RecommendationDebugInfo, SimilarMatchDebug, ClothingVoteDebug, SafetyOverrideDebug, ThermalPreference } from '../types';
import { getDefaultClothing, getClothingCategories, isDarkOutside, isSunny, THERMAL_OFFSETS } from '../types';
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
//    - Recency boost: up to +30% for recent sessions (30 / days_ago × 0.1)
//    - Comfort boost: +10% if the session was marked "just right"
//
// 5. VOTING
//    Higher-scoring matches get more "votes" when determining clothing.
//    Feedback sessions get 2x voting weight compared to CSV imports.

// Weather similarity thresholds - the "threshold" in the similarity formula
// A difference equal to the threshold gives a 50% score for that factor
const THRESHOLDS = {
  temperature: 5,      // ±5°F  → perfect match if within 5°F, 0% if >10°F different
  feelsLike: 7,        // ±7°F  → perfect match if within 7°F, 0% if >14°F different
  humidity: 15,        // ±15%  → perfect match if within 15%, 0% if >30% different
  windSpeed: 5,        // ±5 mph → perfect match if within 5mph, 0% if >10mph different
  precipitation: 0.1,  // Binary comparison (rain/no-rain), not continuous
  cloudCover: 20,      // ±20%  → perfect match if within 20%, 0% if >40% different
  uvIndex: 2           // ±2    → perfect match if within 2, 0% if >4 different
};

// Weights for similarity scoring (higher = more important)
// These determine how much each weather factor contributes to the final match percentage.
// Example: With these weights, temperature (3.0) matters 6x more than cloud cover (0.5)
const WEIGHTS = {
  temperature: 3.0,    // Most important - primary driver of clothing choices
  feelsLike: 2.5,      // Very important - accounts for wind chill / heat index
  humidity: 1.0,       // Moderate - affects comfort but less than temp
  windSpeed: 1.5,      // Important - affects perceived temperature
  precipitation: 2.0,  // Important - rain/no-rain is a major clothing decision
  cloudCover: 0.5,     // Minor - affects sun exposure
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
 * Calculate how similar two weather conditions are (0-1, higher = more similar)
 * 
 * Example calculation for 42°F current vs 45°F historical:
 *   Temperature:   diff=3°F  → score = 1 - (3/10) = 0.70 × 3.0 weight = 2.10
 *   Feels Like:    diff=4°F  → score = 1 - (4/14) = 0.71 × 2.5 weight = 1.78
 *   Wind:          diff=3mph → score = 1 - (3/10) = 0.70 × 1.5 weight = 1.05
 *   Precipitation: match     → score = 1.0        × 2.0 weight = 2.00
 *   Humidity:      diff=5%   → score = 1 - (5/30) = 0.83 × 1.0 weight = 0.83
 *   Cloud Cover:   diff=10%  → score = 1 - (10/40) = 0.75 × 0.5 weight = 0.38
 *   UV Index:      diff=1    → score = 1 - (1/4) = 0.75 × 0.5 weight = 0.38
 *   
 *   Total = 8.52 / 11.0 = 77% match
 */
function calculateSimilarity(current: WeatherData, historical: RunRecord): number {
  let totalWeight = 0;
  let weightedScore = 0;

  // Temperature similarity
  const tempDiff = Math.abs(current.temperature - historical.temperature);
  const tempScore = Math.max(0, 1 - tempDiff / (THRESHOLDS.temperature * 2));
  weightedScore += tempScore * WEIGHTS.temperature;
  totalWeight += WEIGHTS.temperature;

  // Feels like similarity
  const feelsLikeDiff = Math.abs(current.feelsLike - historical.feelsLike);
  const feelsLikeScore = Math.max(0, 1 - feelsLikeDiff / (THRESHOLDS.feelsLike * 2));
  weightedScore += feelsLikeScore * WEIGHTS.feelsLike;
  totalWeight += WEIGHTS.feelsLike;

  // Humidity similarity
  const humidityDiff = Math.abs(current.humidity - historical.humidity);
  const humidityScore = Math.max(0, 1 - humidityDiff / (THRESHOLDS.humidity * 2));
  weightedScore += humidityScore * WEIGHTS.humidity;
  totalWeight += WEIGHTS.humidity;

  // Wind speed similarity
  const windDiff = Math.abs(current.windSpeed - historical.windSpeed);
  const windScore = Math.max(0, 1 - windDiff / (THRESHOLDS.windSpeed * 2));
  weightedScore += windScore * WEIGHTS.windSpeed;
  totalWeight += WEIGHTS.windSpeed;

  // Precipitation similarity (binary-ish: both have or don't have)
  const currentHasRain = current.precipitation > 0;
  const historicalHasRain = historical.precipitation > 0;
  const precipScore = currentHasRain === historicalHasRain ? 1 : 0.3;
  weightedScore += precipScore * WEIGHTS.precipitation;
  totalWeight += WEIGHTS.precipitation;

  // Cloud cover similarity
  const cloudDiff = Math.abs(current.cloudCover - historical.cloudCover);
  const cloudScore = Math.max(0, 1 - cloudDiff / (THRESHOLDS.cloudCover * 2));
  weightedScore += cloudScore * WEIGHTS.cloudCover;
  totalWeight += WEIGHTS.cloudCover;

  // UV index similarity
  const uvDiff = Math.abs(current.uvIndex - historical.uvIndex);
  const uvScore = Math.max(0, 1 - uvDiff / (THRESHOLDS.uvIndex * 2));
  weightedScore += uvScore * WEIGHTS.uvIndex;
  totalWeight += WEIGHTS.uvIndex;

  return weightedScore / totalWeight;
}

// Calculate similarity between current weather and feedback weather
function calculateFeedbackSimilarity(current: WeatherData, feedback: RunFeedback): number {
  let totalWeight = 0;
  let weightedScore = 0;

  // Temperature similarity (most important for feedback)
  const tempDiff = Math.abs(current.temperature - feedback.temperature);
  const tempScore = Math.max(0, 1 - tempDiff / (THRESHOLDS.temperature * 2));
  weightedScore += tempScore * 3.5;
  totalWeight += 3.5;

  // Feels like similarity
  const feelsLikeDiff = Math.abs(current.feelsLike - feedback.feelsLike);
  const feelsLikeScore = Math.max(0, 1 - feelsLikeDiff / (THRESHOLDS.feelsLike * 2));
  weightedScore += feelsLikeScore * 2.5;
  totalWeight += 2.5;

  // Wind similarity
  const windDiff = Math.abs(current.windSpeed - feedback.windSpeed);
  const windScore = Math.max(0, 1 - windDiff / (THRESHOLDS.windSpeed * 2));
  weightedScore += windScore * 1.5;
  totalWeight += 1.5;

  // Humidity similarity
  const humidityDiff = Math.abs(current.humidity - feedback.humidity);
  const humidityScore = Math.max(0, 1 - humidityDiff / (THRESHOLDS.humidity * 2));
  weightedScore += humidityScore * 1.0;
  totalWeight += 1.0;

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
function feedbackToRunRecord(feedback: RunFeedback): RunRecord & { comfort?: string; comments?: string } {
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
    comments: feedback.comments
  };
}

/**
 * Find runs with similar weather conditions
 * 
 * This function:
 * 1. Calculates similarity scores for all historical sessions (both CSV imports and feedback)
 * 2. Filters out sessions below the minimum similarity threshold (default 40%)
 * 3. Applies boosts to feedback sessions:
 *    - Recency boost: up to +30% for sessions from the last 30 days
 *    - Comfort boost: +10% if the user marked the session as "just right"
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
  minSimilarity: number = 0.5
): SimilarityScore[] {
  const similarities: SimilarityScore[] = [];

  // Add CSV runs (no boosts applied - these are historical imports)
  for (const run of runs) {
    const score = calculateSimilarity(currentWeather, run);
    if (score >= minSimilarity) {
      similarities.push({ record: run, score, isFromFeedback: false });
    }
  }

  // Add ALL feedback records as runs (with boosts for recency and comfort)
  for (const feedback of feedbackHistory) {
    const runRecord = feedbackToRunRecord(feedback);
    const score = calculateSimilarity(currentWeather, runRecord);
    
    if (score >= minSimilarity) {
      // Recency boost: more recent = higher boost
      // Formula: 30 / days_ago × 0.1, capped at 0.3 (30%)
      // Examples: 1 day ago = +30%, 3 days ago = +10%, 30 days ago = +1%
      const daysSince = Math.max(1, (Date.now() - new Date(feedback.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      const recencyBoost = Math.min(0.3, 30 / daysSince * 0.1);
      
      // Comfort boost: +10% if user said this session was "just right"
      const comfortBoost = feedback.comfort === 'just_right' ? 0.1 : 0;
      
      // Apply boosts, but cap at 100%
      const boostedScore = Math.min(1, score + recencyBoost + comfortBoost);
      
      similarities.push({ record: runRecord, score: boostedScore, isFromFeedback: true });
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
  thermalPreference: ThermalPreference = 'average'
): ClothingRecommendation {
  // Use thermal preference setting for temperature offset (replaces calculated comfort adjustment)
  const thermalOffset = THERMAL_OFFSETS[thermalPreference];
  const comfortAdjustment: ComfortAdjustment = {
    temperatureOffset: thermalOffset,
    confidence: 100  // Static setting, not calculated
  };
  const categories = getClothingCategories(activity);
  const adjustedTemp = currentWeather.temperature - thermalOffset;
  
  // Initialize debug info
  const debugSafetyOverrides: SafetyOverrideDebug[] = [];
  
  const adjustedWeather: WeatherData = {
    ...currentWeather,
    temperature: currentWeather.temperature - thermalOffset,
    feelsLike: currentWeather.feelsLike - thermalOffset
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
        temperatureOffset: comfortAdjustment.temperatureOffset,
        confidence: comfortAdjustment.confidence,
        adjustedTemp,
        tempRange: getTempRange(adjustedTemp),
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

  const similarRuns = findSimilarRuns(adjustedWeather, runs, feedbackHistory, 0.4);
  
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
  
  const confidence = Math.min(100, Math.round(
    (Math.min(similarRuns.length, 10) / 10) * 50 +
    avgSimilarity * 50
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
      temperatureOffset: comfortAdjustment.temperatureOffset,
      confidence: comfortAdjustment.confidence,
      adjustedTemp,
      tempRange: getTempRange(adjustedTemp),
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
  thermalPreference: ThermalPreference = 'average'
): ClothingItems {
  // Check if we have any feedback with similar temperature
  const relevantFeedback = feedbackHistory.filter(f => {
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
  
  // Use thermal preference setting for temperature offset
  const thermalOffset = THERMAL_OFFSETS[thermalPreference];
  const adjustedTemp = weather.temperature - thermalOffset;
  
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
