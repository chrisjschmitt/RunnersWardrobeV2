/**
 * Generate clothing suggestions for low/medium confidence recommendations
 */

import type { ClothingItems, ActivityType, WeatherData, ThermalPreference, ActivityLevel, RunRecord } from '../types';
import { getFallbackRecommendation, calculateComfortTemperature } from './recommendationEngine';
import { getClothingCategories } from '../types';
import type { TemperatureUnit } from './temperatureUtils';

export interface ClothingSuggestion {
  category: string;
  categoryLabel: string;
  current: string;
  suggested: string;
  reason: string;
}

export interface SuggestionContext {
  suggestions: ClothingSuggestion[];
  explanation: string;
  confidence: number;
  matchingRuns: number;
}

/**
 * Generate suggestions by comparing current recommendation to historical T_comfort
 * Only generates suggestions when confidence is below 70%
 * 
 * The suggestions guide users to add or remove layers based on whether
 * current T_comfort is colder or warmer than historical T_comfort.
 */
export function generateClothingSuggestions(
  currentClothing: ClothingItems,
  weather: WeatherData,
  activity: ActivityType,
  thermalPreference: ThermalPreference = 'average',
  activityLevel?: ActivityLevel,
  confidence?: number,
  matchingRuns?: number,
  similarConditions?: RunRecord[],
  temperatureUnit: TemperatureUnit = 'fahrenheit'
): SuggestionContext | null {
  // Only suggest when confidence is low/medium
  if (confidence !== undefined && confidence >= 70) {
    return null;
  }

  // Calculate current T_comfort
  const currentComfort = calculateComfortTemperature(weather, activity, thermalPreference, activityLevel);
  const currentComfortC = currentComfort.comfortTempC;

  // Calculate average historical T_comfort from similar conditions
  let avgHistoricalComfortC: number | null = null;
  let comfortDiffC = 0;
  let needsWarmer = false;
  let needsCooler = false;

  if (similarConditions && similarConditions.length > 0) {
    let totalHistoricalComfort = 0;
    let historicalCount = 0;

    for (const record of similarConditions) {
      const historicalWeather: WeatherData = {
        temperature: record.temperature,
        feelsLike: record.feelsLike,
        humidity: record.humidity,
        pressure: 0,
        windSpeed: record.windSpeed,
        precipitation: record.precipitation,
        cloudCover: record.cloudCover,
        uvIndex: record.uvIndex,
        icon: '',
        description: '',
        location: '',
        timestamp: new Date()
      };
      const historicalActivityLevel = (record as RunRecord & { activityLevel?: ActivityLevel }).activityLevel;
      const historicalComfort = calculateComfortTemperature(historicalWeather, activity, thermalPreference, historicalActivityLevel);
      totalHistoricalComfort += historicalComfort.comfortTempC;
      historicalCount++;
    }

    avgHistoricalComfortC = totalHistoricalComfort / historicalCount;
    comfortDiffC = currentComfortC - avgHistoricalComfortC; // Positive = current is warmer, negative = current is colder

    // Determine if we need to suggest warmer or cooler clothing
    // Only suggest if difference is significant (≥2°C to avoid noise)
    if (Math.abs(comfortDiffC) >= 2) {
      needsWarmer = comfortDiffC < 0; // Current is colder than historical
      needsCooler = comfortDiffC > 0; // Current is warmer than historical
    }
  }

  // Get fallback defaults for comparison (as a reference point)
  const fallbackDefaults = getFallbackRecommendation(
    weather,
    [],
    activity,
    thermalPreference,
    activityLevel
  );

  const categories = getClothingCategories(activity);
  const suggestions: ClothingSuggestion[] = [];
  
  // Compare each category and generate suggestions
  for (const cat of categories) {
    const current = currentClothing[cat.key]?.toLowerCase() || 'none';
    const defaultItem = fallbackDefaults[cat.key]?.toLowerCase() || 'none';
    
    // Skip if they match
    if (current === defaultItem && !needsWarmer && !needsCooler) {
      continue;
    }

    // Generate a reason based on T_comfort difference and category
    const reason = generateReason(
      cat.key,
      current,
      defaultItem,
      weather,
      currentComfortC,
      avgHistoricalComfortC,
      comfortDiffC,
      needsWarmer,
      needsCooler,
      temperatureUnit,
      confidence
    );
    
    if (reason) {
      // Determine suggested item based on whether we need warmer or cooler
      let suggestedItem = defaultItem;
      if (needsWarmer) {
        // Suggest warmer option (prefer default if it's warmer, otherwise keep current)
        suggestedItem = defaultItem !== 'none' && isWarmerOption(cat.key, defaultItem, current) 
          ? defaultItem 
          : getWarmerOption(cat.key, current, categories);
      } else if (needsCooler) {
        // Suggest cooler option (prefer default if it's cooler, otherwise keep current)
        suggestedItem = defaultItem !== 'none' && isCoolerOption(cat.key, defaultItem, current)
          ? defaultItem
          : getCoolerOption(cat.key, current, categories);
      }

      if (suggestedItem && suggestedItem !== current) {
        suggestions.push({
          category: cat.key,
          categoryLabel: cat.label,
          current: currentClothing[cat.key] || 'None',
          suggested: suggestedItem,
          reason
        });
      }
    }
  }

  // Generate explanation with T_comfort context
  const explanation = generateExplanation(confidence, matchingRuns, currentComfortC, avgHistoricalComfortC, comfortDiffC, temperatureUnit);

  return {
    suggestions,
    explanation,
    confidence: confidence || 0,
    matchingRuns: matchingRuns || 0
  };
}

function generateReason(
  categoryKey: string,
  current: string,
  suggested: string,
  weather: WeatherData,
  currentComfortC: number,
  avgHistoricalComfortC: number | null,
  comfortDiffC: number,
  needsWarmer: boolean,
  needsCooler: boolean,
  temperatureUnit: TemperatureUnit = 'fahrenheit',
  confidence?: number
): string | null {
  // Use T_comfort for cold/warm assessments (convert to Fahrenheit for thresholds)
  const currentComfortF = (currentComfortC * 9 / 5) + 32;
  const isCold = currentComfortF < 40; // ~4.4°C
  const isVeryCold = currentComfortF < 25; // ~-3.9°C
  const isRaining = weather.precipitation > 0;

  // Skip if current is already appropriate (e.g., both have gloves in cold weather)
  if (current === 'none' && suggested === 'none' && !needsWarmer && !needsCooler) {
    return null;
  }

  // Determine if we should use strong language (low confidence)
  const isLowConfidence = confidence !== undefined && confidence < 40;
  
  // Primary guidance: Add or remove layers based on T_comfort difference
  if (avgHistoricalComfortC !== null && Math.abs(comfortDiffC) >= 2) {
    // Format the absolute difference in the user's preferred unit
    const diffAbs = Math.abs(comfortDiffC);
    const diffFormatted = temperatureUnit === 'celsius' 
      ? diffAbs.toFixed(1) 
      : (diffAbs * 9 / 5).toFixed(0);
    const diffSymbol = temperatureUnit === 'celsius' ? '°C' : '°F';
    
    if (needsWarmer) {
      // Current T_comfort is colder than historical - suggest adding layers
      if (categoryKey === 'midLayer' || categoryKey === 'outerLayer') {
        if (current === 'none' && suggested !== 'none') {
          if (diffAbs >= 5) {
            return `Current conditions are ${diffFormatted}${diffSymbol} colder than your historical sessions. Add a layer for warmth.`;
          } else {
            if (isLowConfidence) {
              return `Current conditions are ${diffFormatted}${diffSymbol} colder than your historical sessions. Add a layer for warmth.`;
            }
            return `Current conditions are ${diffFormatted}${diffSymbol} colder than your historical sessions. Consider adding a layer.`;
          }
        }
      }
      
      if (categoryKey === 'baseLayer' || categoryKey === 'tops') {
        // Check if suggested is warmer than current
        if (isWarmerOption(categoryKey, suggested, current)) {
          if (diffAbs >= 5) {
            return `Current conditions are ${diffFormatted}${diffSymbol} colder. Upgrade to a warmer top.`;
          } else {
            if (isLowConfidence) {
              return `Current conditions are ${diffFormatted}${diffSymbol} colder. Use a warmer top.`;
            }
            return `Current conditions are ${diffFormatted}${diffSymbol} colder. Consider a warmer top.`;
          }
        }
      }
      
      if (categoryKey === 'headCover' || categoryKey === 'gloves') {
        if (current === 'none' && suggested !== 'none') {
          if (diffAbs >= 5) {
            return `Current conditions are ${diffFormatted}${diffSymbol} colder. Essential for protecting extremities.`;
          } else {
            if (isLowConfidence) {
              return `Current conditions are ${diffFormatted}${diffSymbol} colder. Wear this to protect extremities.`;
            }
            return `Current conditions are ${diffFormatted}${diffSymbol} colder. Recommended for warmth.`;
          }
        }
      }
      
      if (categoryKey === 'bottoms') {
        if (current.includes('short') && (suggested.includes('tight') || suggested.includes('pant'))) {
          if (isLowConfidence) {
            return `Current conditions are ${diffFormatted}${diffSymbol} colder. Wear long bottoms.`;
          }
          return `Current conditions are ${diffFormatted}${diffSymbol} colder. Long bottoms recommended.`;
        }
      }
    }
    
    if (needsCooler) {
      // Current T_comfort is warmer than historical - suggest removing layers
      if (categoryKey === 'midLayer' || categoryKey === 'outerLayer') {
        if (current !== 'none' && suggested === 'none') {
          if (isLowConfidence) {
            return `Current conditions are ${diffFormatted}${diffSymbol} warmer than your historical sessions. Remove this layer.`;
          }
          return `Current conditions are ${diffFormatted}${diffSymbol} warmer than your historical sessions. Consider removing this layer.`;
        }
      }
      
      if (categoryKey === 'baseLayer' || categoryKey === 'tops') {
        if (isWarmerOption(categoryKey, current, suggested)) {
          if (isLowConfidence) {
            return `Current conditions are ${diffFormatted}${diffSymbol} warmer. Use a lighter top.`;
          }
          return `Current conditions are ${diffFormatted}${diffSymbol} warmer. Consider a lighter top.`;
        }
      }
    }
  }

  // Fallback to T_comfort-based suggestions if no historical comparison available
  // Layer-related suggestions
  if (categoryKey === 'midLayer' || categoryKey === 'outerLayer') {
    if (current === 'none' && suggested !== 'none') {
      if (isVeryCold) {
        return 'Very cold conditions typically require an additional layer';
      } else if (isCold) {
        return 'Cold conditions often benefit from an extra layer';
      }
    }
  }

  if (categoryKey === 'baseLayer' || categoryKey === 'tops') {
    if (current.includes('short') && suggested.includes('long')) {
      return 'Long sleeves are more appropriate for this temperature';
    }
  }

  // Head/gloves suggestions
  if (categoryKey === 'headCover' || categoryKey === 'gloves') {
    if (current === 'none' && suggested !== 'none') {
      if (isVeryCold) {
        return 'Essential for protecting extremities in very cold weather';
      } else if (isCold) {
        return 'Recommended for cold conditions';
      }
    }
  }

  // Bottoms suggestions
  if (categoryKey === 'bottoms') {
    if (current.includes('short') && (suggested.includes('tight') || suggested.includes('pant'))) {
      if (isCold) {
        return 'Long bottoms are more appropriate for this temperature';
      }
    }
  }

  // Rain gear
  if (categoryKey === 'rainGear' && isRaining) {
    if (current === 'none' && suggested !== 'none') {
      return 'Rain protection is recommended when precipitation is expected';
    }
  }

  // Generic fallback
  if (suggested !== 'none' && current === 'none') {
    return 'Consider adding this item based on typical recommendations';
  }

  if (current !== 'none' && suggested === 'none') {
    return null; // Don't suggest removing items unless explicitly needed
  }

  // Different items - provide generic suggestion
  return 'Default recommendation differs from your current selection';
}

function generateExplanation(
  confidence: number | undefined,
  matchingRuns: number | undefined,
  _currentComfortC?: number,
  avgHistoricalComfortC?: number | null,
  comfortDiffC?: number,
  temperatureUnit: TemperatureUnit = 'fahrenheit'
): string {
  if (confidence === undefined || matchingRuns === undefined) {
    return 'Comparing with typical recommendations for these conditions';
  }

  // Build explanation with T_comfort context if available
  let baseExplanation = '';
  
  if (matchingRuns === 0) {
    baseExplanation = 'No similar sessions found. These suggestions are based on typical recommendations for these conditions.';
  } else if (matchingRuns === 1) {
    baseExplanation = `Based on only 1 similar session.`;
  } else if (confidence < 40) {
    baseExplanation = `Low confidence (${confidence}%) from ${matchingRuns} sessions.`;
  } else {
    baseExplanation = `Medium confidence (${confidence}%) from ${matchingRuns} sessions.`;
  }

  // Determine if we should use strong language (low confidence)
  const isLowConfidence = confidence !== undefined && confidence < 40;
  
  // Add T_comfort comparison if available
  if (avgHistoricalComfortC !== null && comfortDiffC !== undefined && Math.abs(comfortDiffC) >= 2) {
    // Format the absolute difference in the user's preferred unit
    const diffAbs = Math.abs(comfortDiffC);
    const diffFormatted = temperatureUnit === 'celsius' 
      ? diffAbs.toFixed(1) 
      : (diffAbs * 9 / 5).toFixed(0);
    const diffSymbol = temperatureUnit === 'celsius' ? '°C' : '°F';
    
    if (comfortDiffC < 0) {
      if (isLowConfidence) {
        baseExplanation += ` Current conditions are ${diffFormatted}${diffSymbol} colder than your historical sessions. Add layers for warmth.`;
      } else {
        baseExplanation += ` Current conditions are ${diffFormatted}${diffSymbol} colder than your historical sessions. Consider adding layers.`;
      }
    } else {
      if (isLowConfidence) {
        baseExplanation += ` Current conditions are ${diffFormatted}${diffSymbol} warmer than your historical sessions. Remove layers to avoid overheating.`;
      } else {
        baseExplanation += ` Current conditions are ${diffFormatted}${diffSymbol} warmer than your historical sessions. Consider removing layers.`;
      }
    }
  } else if (matchingRuns > 0) {
    if (isLowConfidence) {
      baseExplanation += ' Follow these recommendations:';
    } else {
      baseExplanation += ' Consider these recommendations:';
    }
  }

  return baseExplanation;
}

// Helper functions to determine if options are warmer/cooler
function isWarmerOption(_categoryKey: string, option1: string, option2: string): boolean {
  const warmTerms = ['merino', 'base layer + jacket', 'base layer + fleece', 'expedition', 'heavy', 'fleece', 'puffy', 'jacket', 'softshell'];
  const coldTerms = ['t-shirt', 'singlet', 'tank', 'short sleeve', 'short', 'none'];
  
  const opt1Lower = option1.toLowerCase();
  const opt2Lower = option2.toLowerCase();
  
  const opt1Warm = warmTerms.some(term => opt1Lower.includes(term));
  const opt2Warm = warmTerms.some(term => opt2Lower.includes(term));
  const opt2Cold = coldTerms.some(term => opt2Lower.includes(term));
  
  // Option1 is warmer if it has warm terms and option2 doesn't, or option2 has cold terms
  return (opt1Warm && !opt2Warm) || (opt1Warm && opt2Cold);
}

function isLighterOption(categoryKey: string, option1: string, option2: string): boolean {
  return isWarmerOption(categoryKey, option2, option1); // Reversed
}

function isCoolerOption(categoryKey: string, option1: string, option2: string): boolean {
  return isLighterOption(categoryKey, option1, option2);
}

function getWarmerOption(categoryKey: string, current: string, categories: any[]): string {
  const category = categories.find(c => c.key === categoryKey);
  if (!category) return current;
  
  const warmTerms = ['merino', 'base layer + jacket', 'base layer + fleece', 'expedition', 'heavy', 'fleece', 'puffy', 'jacket', 'softshell'];
  
  // Find a warmer option than current
  for (const option of category.options) {
    const optLower = option.toLowerCase();
    const currentLower = current.toLowerCase();
    
    // If current has cold terms and option has warm terms, it's warmer
    const hasColdTerm = ['t-shirt', 'singlet', 'tank', 'short'].some(term => currentLower.includes(term));
    const hasWarmTerm = warmTerms.some(term => optLower.includes(term));
    
    if (hasColdTerm && hasWarmTerm) {
      return option;
    }
  }
  
  return current; // No warmer option found
}

function getCoolerOption(categoryKey: string, current: string, categories: any[]): string {
  const category = categories.find(c => c.key === categoryKey);
  if (!category) return current;
  
  const warmTerms = ['merino', 'base layer + jacket', 'base layer + fleece', 'expedition', 'heavy', 'fleece', 'puffy', 'jacket', 'softshell'];
  const currentLower = current.toLowerCase();
  const hasWarmTerm = warmTerms.some(term => currentLower.includes(term));
  
  if (!hasWarmTerm) return current; // Already cool enough
  
  // Find a cooler option
  for (const option of category.options) {
    const optLower = option.toLowerCase();
    const hasOptWarmTerm = warmTerms.some(term => optLower.includes(term));
    
    if (!hasOptWarmTerm && optLower !== currentLower) {
      return option;
    }
  }
  
  return current; // No cooler option found
}

