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
  
  // Only suggest adding or removing layers (midLayer and outerLayer)
  const layerCategories = categories.filter(cat => cat.key === 'midLayer' || cat.key === 'outerLayer');
  
  for (const cat of layerCategories) {
    const current = currentClothing[cat.key]?.toLowerCase() || 'none';
    const defaultItem = fallbackDefaults[cat.key]?.toLowerCase() || 'none';
    
    // Skip if they match and no temperature adjustment needed
    if (current === defaultItem && !needsWarmer && !needsCooler) {
      continue;
    }

    // Generate a reason based on T_comfort difference
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
      // For layers, suggest adding (default item) if needs warmer, removing (none) if needs cooler
      let suggestedItem = defaultItem;
      if (needsWarmer && current === 'none' && defaultItem !== 'none') {
        suggestedItem = defaultItem;
      } else if (needsCooler && current !== 'none' && defaultItem === 'none') {
        suggestedItem = 'none';
      } else if (current === defaultItem) {
        // If they match but we have a temperature difference, skip
        continue;
      }

      if (suggestedItem !== current) {
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
  _weather: WeatherData,
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

  // Skip if current is already appropriate (e.g., both have gloves in cold weather)
  if (current === 'none' && suggested === 'none' && !needsWarmer && !needsCooler) {
    return null;
  }

  // Only generate suggestions for layers (midLayer and outerLayer)
  if (categoryKey !== 'midLayer' && categoryKey !== 'outerLayer') {
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
    
    if (needsCooler) {
      // Current T_comfort is warmer than historical - suggest removing layers
      if (current !== 'none' && suggested === 'none') {
        if (isLowConfidence) {
          return `Current conditions are ${diffFormatted}${diffSymbol} warmer than your historical sessions. Remove this layer.`;
        }
        return `Current conditions are ${diffFormatted}${diffSymbol} warmer than your historical sessions. Consider removing this layer.`;
      }
    }
  }

  // Fallback to T_comfort-based suggestions if no historical comparison available
  if (current === 'none' && suggested !== 'none') {
    if (isVeryCold) {
      return 'Very cold conditions typically require an additional layer';
    } else if (isCold) {
      return 'Cold conditions often benefit from an extra layer';
    }
  }

  // If current has a layer but suggested is none, and we're not in a needsCooler scenario, don't suggest
  if (current !== 'none' && suggested === 'none' && !needsCooler) {
    return null;
  }

  return null;
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


