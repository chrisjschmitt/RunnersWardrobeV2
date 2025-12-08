import type { WeatherData, RunRecord, ClothingItems, ClothingRecommendation, RunFeedback, ComfortAdjustment, ActivityType, ClothingCategory } from '../types';
import { getDefaultClothing, getClothingCategories, isDarkOutside, isSunny } from '../types';
import { ACTIVITY_TEMP_DEFAULTS, getTempRange, getWeatherOverrides, type WeatherModifiers } from '../data/activityDefaults';

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
    // Note: needsSunglasses and needsHeadlamp are mutually exclusive (can't be sunny when dark)
    if (currentAccessory === 'none' || currentAccessory === '') {
      if (needsSunglasses) {
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
  // TODO: Consider consolidating weather detection logic with getFallbackRecommendation
  // and getWeatherOverrides() in activityDefaults.ts to reduce duplication
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
  // TODO: This duplicates logic in getWeatherOverrides() - consider using that instead
  const rainKey = categories.find(c => c.key === 'rainGear' || c.key === 'outerLayer');
  if (rainKey && isRaining && clothing[rainKey.key]?.toLowerCase() === 'none') {
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

  const VERY_COLD_GLOVES = [
    // Standard
    'Heavy gloves', 'Warm gloves', 'Insulated gloves', 'Mittens',
    // Specialty
    'Heavy mittens', 'Lobster mitts', 'Lobster gloves', 'Liner + mittens',
    // Cycling
    'Thermal gloves'
  ];

  const COLD_GLOVES = [
    'Light gloves', 'Warm gloves', 'Fleece gloves',
    // Cycling
    'Full finger light',
    // XC Skiing
    'XC gloves'
  ];

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

  // Gloves override for cold
  const glovesKey = categories.find(c => c.key === 'gloves');
  if (glovesKey && adjustedTemp < 35 && clothing[glovesKey.key]?.toLowerCase() === 'none') {
    const gloves = adjustedTemp < 25 
      ? findValidOption('gloves', VERY_COLD_GLOVES)
      : findValidOption('gloves', COLD_GLOVES);
    if (gloves) clothing[glovesKey.key] = gloves;
  }

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

  // Get base defaults for this activity
  const clothing = getDefaultClothing(activity);
  const categories = getClothingCategories(activity);
  
  // Calculate adjusted temperature based on comfort history
  const comfortAdjustment = calculateComfortAdjustment(weather, feedbackHistory);
  const adjustedTemp = weather.temperature - comfortAdjustment.temperatureOffset;
  
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
