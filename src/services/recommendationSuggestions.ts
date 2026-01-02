/**
 * Generate clothing suggestions for low/medium confidence recommendations
 */

import type { ClothingItems, ActivityType, WeatherData, ThermalPreference, ActivityLevel } from '../types';
import { getFallbackRecommendation } from './recommendationEngine';
import { getClothingCategories } from '../types';

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
 * Generate suggestions by comparing current recommendation to fallback defaults
 * Only generates suggestions when confidence is below 70%
 */
export function generateClothingSuggestions(
  currentClothing: ClothingItems,
  weather: WeatherData,
  activity: ActivityType,
  thermalPreference: ThermalPreference = 'average',
  activityLevel?: ActivityLevel,
  confidence?: number,
  matchingRuns?: number
): SuggestionContext | null {
  // Only suggest when confidence is low/medium
  if (confidence !== undefined && confidence >= 70) {
    return null;
  }

  // Get fallback defaults for comparison
  const fallbackDefaults = getFallbackRecommendation(
    weather,
    [],
    activity,
    thermalPreference,
    activityLevel
  );

  const categories = getClothingCategories(activity);
  const suggestions: ClothingSuggestion[] = [];
  
  // Compare each category
  for (const cat of categories) {
    const current = currentClothing[cat.key]?.toLowerCase() || 'none';
    const defaultItem = fallbackDefaults[cat.key]?.toLowerCase() || 'none';
    
    // Skip if they match
    if (current === defaultItem) {
      continue;
    }

    // Generate a reason based on the difference
    const reason = generateReason(cat.key, current, defaultItem, weather);
    
    if (reason) {
      suggestions.push({
        category: cat.key,
        categoryLabel: cat.label,
        current: currentClothing[cat.key] || 'None',
        suggested: fallbackDefaults[cat.key] || 'None',
        reason
      });
    }
  }

  // Generate explanation
  const explanation = generateExplanation(confidence, matchingRuns);

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
  weather: WeatherData
): string | null {
  const tempF = weather.temperature;
  const isCold = tempF < 40;
  const isVeryCold = tempF < 25;
  const isRaining = weather.precipitation > 0;

  // Skip if current is already appropriate (e.g., both have gloves in cold weather)
  if (current === 'none' && suggested === 'none') {
    return null;
  }

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

  if (categoryKey === 'baseLayer') {
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
    if (current.includes('short') && suggested.includes('tight') || suggested.includes('pant')) {
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
    return null; // Don't suggest removing items, only adding
  }

  // Different items - provide generic suggestion
  return 'Default recommendation differs from your current selection';
}

function generateExplanation(
  confidence: number | undefined,
  matchingRuns: number | undefined
): string {
  if (confidence === undefined || matchingRuns === undefined) {
    return 'Comparing with typical recommendations for these conditions';
  }

  if (matchingRuns === 0) {
    return 'No similar sessions found. These suggestions are based on typical recommendations for these conditions.';
  }

  if (matchingRuns === 1) {
    return `Based on only 1 similar session. These suggestions compare with typical recommendations.`;
  }

  if (confidence < 40) {
    return `Low confidence (${confidence}%) from ${matchingRuns} sessions. Consider these typical recommendations:`;
  }

  return `Medium confidence (${confidence}%) from ${matchingRuns} sessions. Here are some typical recommendations to consider:`;
}

