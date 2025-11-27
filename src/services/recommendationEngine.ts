import type { WeatherData, RunRecord, ClothingItems, ClothingRecommendation, RunFeedback, ComfortAdjustment } from '../types';

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
    clothing: feedback.clothing
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

  // Add ALL feedback records as runs (with extra weight for recency)
  // The clothing the user actually wore is valuable data regardless of comfort level
  for (const feedback of feedbackHistory) {
    const runRecord = feedbackToRunRecord(feedback);
    const score = calculateSimilarity(currentWeather, runRecord);
    
    if (score >= minSimilarity) {
      // Boost score for recent feedback (user's actual choices are more relevant)
      const daysSince = Math.max(1, (Date.now() - new Date(feedback.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      const recencyBoost = Math.min(0.3, 30 / daysSince * 0.1); // Up to 0.3 boost for recent feedback
      
      // Give extra boost to "just_right" feedback since it was comfortable
      const comfortBoost = feedback.comfort === 'just_right' ? 0.1 : 0;
      
      const boostedScore = Math.min(1, score + recencyBoost + comfortBoost);
      
      similarities.push({ record: runRecord, score: boostedScore, isFromFeedback: true });
    }
  }

  // Sort by similarity score (highest first)
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

// Main recommendation function with feedback adjustment
export function getClothingRecommendation(
  currentWeather: WeatherData,
  runs: RunRecord[],
  feedbackHistory: RunFeedback[] = []
): ClothingRecommendation {
  // Calculate comfort adjustment from feedback
  const comfortAdjustment = calculateComfortAdjustment(currentWeather, feedbackHistory);
  
  // Create adjusted weather for clothing lookup
  // If user tends to run cold, we look for clothing worn at lower temps (warmer clothes)
  // If user tends to run hot, we look for clothing worn at higher temps (lighter clothes)
  const adjustedWeather: WeatherData = {
    ...currentWeather,
    temperature: currentWeather.temperature - comfortAdjustment.temperatureOffset,
    feelsLike: currentWeather.feelsLike - comfortAdjustment.temperatureOffset
  };

  // Find similar runs using adjusted weather (includes both CSV runs and feedback)
  const similarRuns = findSimilarRuns(adjustedWeather, runs, feedbackHistory, 0.4);
  
  // Extract clothing from similar runs, weighted by similarity
  const clothingCategories = {
    headCover: [] as string[],
    tops: [] as string[],
    bottoms: [] as string[],
    shoes: [] as string[],
    socks: [] as string[],
    gloves: [] as string[],
    rainGear: [] as string[]
  };

  // Add items from similar runs (more similar = add more times for weighting)
  // Feedback-based records get extra weight (2x) since they're user's actual choices
  for (const { record, score, isFromFeedback } of similarRuns) {
    // Add items proportional to similarity score (1-3 times)
    // Double the weight for feedback-based records
    const baseRepeat = Math.ceil(score * 3);
    const repeatCount = isFromFeedback ? baseRepeat * 2 : baseRepeat;
    
    for (let i = 0; i < repeatCount; i++) {
      clothingCategories.headCover.push(record.clothing.headCover);
      clothingCategories.tops.push(record.clothing.tops);
      clothingCategories.bottoms.push(record.clothing.bottoms);
      clothingCategories.shoes.push(record.clothing.shoes);
      clothingCategories.socks.push(record.clothing.socks);
      clothingCategories.gloves.push(record.clothing.gloves);
      clothingCategories.rainGear.push(record.clothing.rainGear);
    }
  }

  // Get most common item for each category
  const headCoverResult = getMostCommonItem(clothingCategories.headCover, 'None');
  const topsResult = getMostCommonItem(clothingCategories.tops, 'T-shirt');
  const bottomsResult = getMostCommonItem(clothingCategories.bottoms, 'Shorts');
  const shoesResult = getMostCommonItem(clothingCategories.shoes, 'Running shoes');
  const socksResult = getMostCommonItem(clothingCategories.socks, 'Regular');
  const glovesResult = getMostCommonItem(clothingCategories.gloves, 'None');
  const rainGearResult = getMostCommonItem(clothingCategories.rainGear, 'None');

  // Calculate overall confidence based on number of matching runs and their similarity
  const avgSimilarity = similarRuns.length > 0
    ? similarRuns.reduce((sum, r) => sum + r.score, 0) / similarRuns.length
    : 0;
  
  const confidence = Math.min(100, Math.round(
    (Math.min(similarRuns.length, 10) / 10) * 50 + // Up to 50% from number of matches
    avgSimilarity * 50 // Up to 50% from average similarity
  ));

  return {
    clothing: {
      headCover: headCoverResult.item,
      tops: topsResult.item,
      bottoms: bottomsResult.item,
      shoes: shoesResult.item,
      socks: socksResult.item,
      gloves: glovesResult.item,
      rainGear: rainGearResult.item
    },
    confidence,
    matchingRuns: similarRuns.length,
    totalRuns: runs.length + feedbackHistory.length,
    similarConditions: similarRuns.slice(0, 5).map(s => s.record)
  };
}

// Get a simple weather-based fallback recommendation when no history exists
export function getFallbackRecommendation(
  weather: WeatherData,
  feedbackHistory: RunFeedback[] = []
): ClothingItems {
  // Check if we have any feedback with similar temperature to use directly
  const relevantFeedback = feedbackHistory.filter(f => {
    const tempDiff = Math.abs(weather.temperature - f.temperature);
    return tempDiff <= 10; // Within 10°F
  });

  // If we have relevant feedback, prefer "just_right" but use any feedback
  if (relevantFeedback.length > 0) {
    // Sort by: just_right first, then by recency
    relevantFeedback.sort((a, b) => {
      if (a.comfort === 'just_right' && b.comfort !== 'just_right') return -1;
      if (b.comfort === 'just_right' && a.comfort !== 'just_right') return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return relevantFeedback[0].clothing;
  }

  // Apply comfort adjustment if we have feedback
  const comfortAdjustment = calculateComfortAdjustment(weather, feedbackHistory);
  const adjustedTemp = weather.temperature - comfortAdjustment.temperatureOffset;
  
  const temp = adjustedTemp;
  const hasRain = weather.precipitation > 0;
  const isWindy = weather.windSpeed > 10;

  let headCover = 'None';
  let tops = 'T-shirt';
  let bottoms = 'Shorts';
  let socks = 'Regular';
  let gloves = 'None';
  let rainGear = 'None';

  // Cold weather (below 40°F)
  if (temp < 40) {
    headCover = 'Beanie';
    tops = 'Base layer + jacket';
    bottoms = 'Tights';
    socks = 'Wool';
    gloves = 'Heavy';
  }
  // Cool weather (40-55°F)
  else if (temp < 55) {
    headCover = temp < 45 ? 'Light beanie' : 'None';
    tops = 'Long sleeve';
    bottoms = 'Tights';
    socks = 'Light wool';
    gloves = temp < 45 ? 'Light' : 'None';
  }
  // Mild weather (55-65°F)
  else if (temp < 65) {
    tops = isWindy ? 'Long sleeve' : 'T-shirt';
    bottoms = 'Shorts or capris';
  }
  // Warm weather (65-75°F)
  else if (temp < 75) {
    tops = 'T-shirt';
    bottoms = 'Shorts';
  }
  // Hot weather (75°F+)
  else {
    headCover = weather.uvIndex > 5 ? 'Running cap' : 'None';
    tops = 'Singlet or light t-shirt';
    bottoms = 'Short shorts';
    socks = 'Light';
  }

  // Rain adjustments
  if (hasRain) {
    rainGear = 'Light rain jacket';
    if (temp < 50) {
      rainGear = 'Waterproof jacket';
    }
  }

  return {
    headCover,
    tops,
    bottoms,
    shoes: 'Running shoes',
    socks,
    gloves,
    rainGear
  };
}
