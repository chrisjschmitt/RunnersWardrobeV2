import type { WeatherData, RunRecord, ClothingItems, ClothingRecommendation, RunFeedback, ComfortAdjustment, ActivityType } from '../types';
import { getDefaultClothing, getClothingCategories, isDarkOutside, isSunny } from '../types';

// Weather similarity thresholds
const THRESHOLDS = {
  temperature: 5,      // ±5°F
  feelsLike: 7,        // ±7°F
  humidity: 15,        // ±15%
  windSpeed: 5,        // ±5 mph
  precipitation: 0.1,  // ±0.1 inches
  cloudCover: 20,      // ±20%
  uvIndex: 2           // ±2
};

// Weights for similarity scoring (higher = more important)
const WEIGHTS = {
  temperature: 3.0,
  feelsLike: 2.5,
  humidity: 1.0,
  windSpeed: 1.5,
  precipitation: 2.0,
  cloudCover: 0.5,
  uvIndex: 0.5
};

// Temperature adjustment per feedback type (in °F)
const FEEDBACK_ADJUSTMENT = {
  too_cold: 8,    // If too cold, treat weather as 8°F colder for clothing selection
  just_right: 0,  // No adjustment needed
  too_hot: -8     // If too hot, treat weather as 8°F warmer for clothing selection
};

interface SimilarityScore {
  record: RunRecord;
  score: number;
  isFromFeedback?: boolean;
}

// Calculate how similar two weather conditions are (0-1, higher = more similar)
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
function feedbackToRunRecord(feedback: RunFeedback): RunRecord {
  return {
    date: feedback.date,
    time: '',
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
    activity: feedback.activity
  };
}

// Find runs with similar weather conditions
function findSimilarRuns(
  currentWeather: WeatherData,
  runs: RunRecord[],
  feedbackHistory: RunFeedback[],
  minSimilarity: number = 0.5
): SimilarityScore[] {
  const similarities: SimilarityScore[] = [];

  // Add CSV runs
  for (const run of runs) {
    const score = calculateSimilarity(currentWeather, run);
    if (score >= minSimilarity) {
      similarities.push({ record: run, score, isFromFeedback: false });
    }
  }

  // Add ALL feedback records as runs
  for (const feedback of feedbackHistory) {
    const runRecord = feedbackToRunRecord(feedback);
    const score = calculateSimilarity(currentWeather, runRecord);
    
    if (score >= minSimilarity) {
      const daysSince = Math.max(1, (Date.now() - new Date(feedback.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      const recencyBoost = Math.min(0.3, 30 / daysSince * 0.1);
      const comfortBoost = feedback.comfort === 'just_right' ? 0.1 : 0;
      const boostedScore = Math.min(1, score + recencyBoost + comfortBoost);
      
      similarities.push({ record: runRecord, score: boostedScore, isFromFeedback: true });
    }
  }

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
  
  // Determine what's needed based on conditions
  const needsSunglasses = isSunny(weather);
  const needsHeadlamp = isDarkOutside(weather);
  
  // Handle 'eyewear' category (cycling, XC skiing)
  const hasEyewear = categories.some(c => c.key === 'eyewear');
  if (hasEyewear) {
    const currentEyewear = result.eyewear?.toLowerCase() || 'none';
    if (currentEyewear === 'none' || currentEyewear === '') {
      if (needsSunglasses) {
        result.eyewear = 'Sunglasses';
      } else if (needsHeadlamp) {
        result.eyewear = 'Clear glasses'; // For visibility at dusk/night
      }
    }
  }
  
  // Handle 'accessories' category (running, trail running, hiking, etc.)
  const hasAccessories = categories.some(c => c.key === 'accessories');
  if (hasAccessories) {
    const currentAccessory = result.accessories?.toLowerCase() || 'none';
    
    // Only override if current is "none" or empty
    if (currentAccessory === 'none' || currentAccessory === '') {
      if (needsSunglasses && needsHeadlamp) {
        result.accessories = 'Sunglasses + headlamp';
      } else if (needsSunglasses) {
        result.accessories = 'Sunglasses';
      } else if (needsHeadlamp) {
        result.accessories = 'Headlamp';
      }
    }
  }
  
  return result;
}

// Main recommendation function with activity support
export function getClothingRecommendation(
  currentWeather: WeatherData,
  runs: RunRecord[],
  feedbackHistory: RunFeedback[] = [],
  activity: ActivityType = 'running'
): ClothingRecommendation {
  const comfortAdjustment = calculateComfortAdjustment(currentWeather, feedbackHistory);
  const categories = getClothingCategories(activity);
  
  const adjustedWeather: WeatherData = {
    ...currentWeather,
    temperature: currentWeather.temperature - comfortAdjustment.temperatureOffset,
    feelsLike: currentWeather.feelsLike - comfortAdjustment.temperatureOffset
  };

  // Check for recent similar feedback first
  const recentMatch = findRecentSimilarFeedback(currentWeather, feedbackHistory);
  if (recentMatch) {
    const clothing = applyAccessoryLogic(recentMatch.clothing, currentWeather, activity);
    return {
      clothing,
      confidence: 95,
      matchingRuns: 1,
      totalRuns: runs.length + feedbackHistory.length,
      similarConditions: [feedbackToRunRecord(recentMatch)]
    };
  }

  const similarRuns = findSimilarRuns(adjustedWeather, runs, feedbackHistory, 0.4);
  
  // Build clothing from similar runs for each category
  const clothingVotes: Record<string, string[]> = {};
  for (const cat of categories) {
    clothingVotes[cat.key] = [];
  }

  for (const { record, score, isFromFeedback } of similarRuns) {
    const baseRepeat = Math.ceil(score * 3);
    const repeatCount = isFromFeedback ? baseRepeat * 2 : baseRepeat;
    
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

  // Apply smart overrides
  const adjustedTemp = currentWeather.temperature - comfortAdjustment.temperatureOffset;
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
  const rainKey = categories.find(c => c.key === 'rainGear' || c.key === 'outerLayer');
  if (rainKey && isRaining && clothing[rainKey.key]?.toLowerCase() === 'none') {
    clothing[rainKey.key] = adjustedTemp < 50 ? 'Waterproof jacket' : 'Light rain jacket';
  }

  // Base layer override for cold - prevent T-shirt recommendations in freezing weather
  const baseKey = categories.find(c => c.key === 'baseLayer' || c.key === 'tops');
  if (baseKey) {
    const currentBase = clothing[baseKey.key]?.toLowerCase() || '';
    const isTooLight = currentBase.includes('t-shirt') || currentBase.includes('singlet') || currentBase.includes('tank');
    
    if (adjustedTemp < 25 && isTooLight) {
      // Very cold: need heavy base layer
      clothing[baseKey.key] = baseKey.key === 'baseLayer' ? 'Heavy merino' : 'Base layer + jacket';
    } else if (adjustedTemp < 40 && isTooLight) {
      // Cold: need at least a long sleeve
      clothing[baseKey.key] = baseKey.key === 'baseLayer' ? 'Merino base' : 'Long sleeve';
    } else if (adjustedTemp < 50 && currentBase.includes('singlet')) {
      // Cool: singlet is too light
      clothing[baseKey.key] = baseKey.key === 'baseLayer' ? 'Long sleeve' : 'Long sleeve';
    }
  }

  // Mid layer override for very cold
  const midKey = categories.find(c => c.key === 'midLayer');
  if (midKey && adjustedTemp < 25 && clothing[midKey.key]?.toLowerCase() === 'none') {
    clothing[midKey.key] = 'Fleece';
  }

  // Outer layer override for very cold (when not raining/snowing which is already handled)
  const outerKey = categories.find(c => c.key === 'outerLayer');
  if (outerKey && adjustedTemp < 20 && clothing[outerKey.key]?.toLowerCase() === 'none') {
    clothing[outerKey.key] = 'Insulated jacket';
  }

  // Gloves override for cold
  const glovesKey = categories.find(c => c.key === 'gloves');
  if (glovesKey && adjustedTemp < 35 && clothing[glovesKey.key]?.toLowerCase() === 'none') {
    clothing[glovesKey.key] = adjustedTemp < 25 ? 'Heavy gloves' : 'Light gloves';
  }

  // Head cover override for cold
  const headKey = categories.find(c => c.key === 'headCover' || c.key === 'helmet');
  if (headKey && headKey.key === 'headCover' && adjustedTemp < 40 && clothing[headKey.key]?.toLowerCase() === 'none') {
    clothing[headKey.key] = adjustedTemp < 25 ? 'Beanie' : 'Headband';
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

  return {
    clothing: finalClothing,
    confidence,
    matchingRuns: similarRuns.length,
    totalRuns: runs.length + feedbackHistory.length,
    similarConditions: similarRuns.slice(0, 5).map(s => s.record)
  };
}

// Get fallback recommendation when no history exists
export function getFallbackRecommendation(
  weather: WeatherData,
  feedbackHistory: RunFeedback[] = [],
  activity: ActivityType = 'running'
): ClothingItems {
  // Check if we have any feedback with similar temperature
  const relevantFeedback = feedbackHistory.filter(f => {
    const tempDiff = Math.abs(weather.temperature - f.temperature);
    return tempDiff <= 10;
  });

  if (relevantFeedback.length > 0) {
    relevantFeedback.sort((a, b) => {
      if (a.comfort === 'just_right' && b.comfort !== 'just_right') return -1;
      if (b.comfort === 'just_right' && a.comfort !== 'just_right') return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return applyAccessoryLogic(relevantFeedback[0].clothing, weather, activity);
  }

  // Get default clothing for this activity
  const clothing = getDefaultClothing(activity);
  const categories = getClothingCategories(activity);
  
  const comfortAdjustment = calculateComfortAdjustment(weather, feedbackHistory);
  const temp = weather.temperature - comfortAdjustment.temperatureOffset;
  const description = weather.description.toLowerCase();
  const isWindy = weather.windSpeed > 10;
  
  // Check if it's snowing (below freezing OR snow in description)
  const isSnowing = description.includes('snow') || 
    description.includes('flurr') ||
    description.includes('sleet') ||
    (weather.temperature < 32 && weather.precipitation > 0);
  
  // Only consider it rain if it's NOT snowing  
  const hasRain = !isSnowing && weather.precipitation > 0;

  // Apply temperature-based adjustments
  if (temp < 25) {
    // Very cold
    applyIfExists(clothing, categories, 'headCover', 'Beanie');
    applyIfExists(clothing, categories, 'tops', 'Base layer + jacket');
    applyIfExists(clothing, categories, 'baseLayer', 'Heavy merino');
    applyIfExists(clothing, categories, 'midLayer', 'Heavy puffy');
    applyIfExists(clothing, categories, 'outerLayer', 'Insulated jacket');
    applyIfExists(clothing, categories, 'bottoms', 'Tights');
    applyIfExists(clothing, categories, 'gloves', 'Heavy gloves');
    applyIfExists(clothing, categories, 'socks', 'Wool');
  } else if (temp < 40) {
    // Cold
    applyIfExists(clothing, categories, 'headCover', 'Beanie');
    applyIfExists(clothing, categories, 'tops', 'Long sleeve');
    applyIfExists(clothing, categories, 'baseLayer', 'Merino base');
    applyIfExists(clothing, categories, 'midLayer', 'Fleece');
    applyIfExists(clothing, categories, 'bottoms', 'Tights');
    applyIfExists(clothing, categories, 'gloves', 'Light gloves');
    applyIfExists(clothing, categories, 'socks', 'Wool');
  } else if (temp < 55) {
    // Cool
    applyIfExists(clothing, categories, 'headCover', temp < 45 ? 'Headband' : 'None');
    applyIfExists(clothing, categories, 'tops', 'Long sleeve');
    applyIfExists(clothing, categories, 'baseLayer', 'Long sleeve');
    applyIfExists(clothing, categories, 'bottoms', 'Tights');
    applyIfExists(clothing, categories, 'gloves', temp < 45 ? 'Light gloves' : 'None');
  } else if (temp < 65) {
    // Mild
    applyIfExists(clothing, categories, 'tops', isWindy ? 'Long sleeve' : 'T-shirt');
    applyIfExists(clothing, categories, 'bottoms', 'Shorts');
  } else if (temp < 75) {
    // Warm
    applyIfExists(clothing, categories, 'tops', 'T-shirt');
    applyIfExists(clothing, categories, 'bottoms', 'Shorts');
  } else {
    // Hot
    applyIfExists(clothing, categories, 'headCover', weather.uvIndex > 5 ? 'Cap' : 'None');
    applyIfExists(clothing, categories, 'tops', 'Singlet');
    applyIfExists(clothing, categories, 'bottoms', 'Short shorts');
    applyIfExists(clothing, categories, 'socks', 'Light');
  }

  // Rain adjustments
  if (hasRain) {
    applyIfExists(clothing, categories, 'rainGear', temp < 50 ? 'Waterproof jacket' : 'Light rain jacket');
    applyIfExists(clothing, categories, 'outerLayer', 'Rain jacket');
  }

  // Apply accessory logic
  return applyAccessoryLogic(clothing, weather, activity);
}

// Helper to apply a value only if the category exists
function applyIfExists(
  clothing: ClothingItems, 
  categories: { key: string }[], 
  key: string, 
  value: string
): void {
  if (categories.some(c => c.key === key)) {
    clothing[key] = value;
  }
}
