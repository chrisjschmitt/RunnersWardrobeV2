/**
 * Test walking activity suggestions (uses outerLayer only, no midLayer)
 */

import { describe, it, expect } from 'vitest';
import { generateClothingSuggestions } from '../services/recommendationSuggestions';
import type { WeatherData, RunRecord, ClothingItems } from '../types';

// Helper to create mock weather data with specific T_comfort for walking
// For walking: T_comfort = tempC + 0.5 + (0.80 × delta) + thermal_offset
// Simplest case: temp = feelsLike (delta = 0), average preference (offset = 0)
// So: T_comfort = tempC + 0.5, therefore tempC = T_comfort - 0.5
function createWeatherForTComfort(tComfortC: number): WeatherData {
  const tempC = tComfortC - 0.5; // For walking with no delta and average preference
  const tempF = (tempC * 9/5) + 32;
  return {
    temperature: tempF,
    feelsLike: tempF,
    humidity: 50,
    pressure: 30,
    precipitation: 0,
    uvIndex: 0,
    windSpeed: 5,
    cloudCover: 50,
    description: 'clear sky',
    icon: '01d',
    location: 'Test Location',
    timestamp: new Date(),
    sunrise: new Date(new Date().setHours(6, 30, 0, 0)),
    sunset: new Date(new Date().setHours(18, 30, 0, 0)),
  };
}

function createRunRecordWithTComfort(tComfortC: number, date: string = '2024-01-01'): RunRecord {
  const tempC = tComfortC - 0.5; // For walking with no delta and average preference
  const tempF = (tempC * 9/5) + 32;
  return {
    date,
    time: '10:00 AM',
    location: 'Test Location',
    temperature: tempF,
    feelsLike: tempF,
    humidity: 50,
    pressure: 30,
    precipitation: 0,
    uvIndex: 0,
    windSpeed: 5,
    cloudCover: 50,
    clothing: {},
    activity: 'walking'
  };
}

describe('Walking Activity Suggestions', () => {
  it('should suggest adding outerLayer when current T_comfort is significantly colder', () => {
    // Current: -5°C T_comfort
    // Historical: 0°C T_comfort
    // Difference: -5°C
    const currentWeather = createWeatherForTComfort(-5);
    const historicalRun = createRunRecordWithTComfort(0);
    
    const currentClothing: ClothingItems = {
      tops: 'Long sleeve',
      outerLayer: 'None',
      bottoms: 'Casual pants',
      shoes: 'Sneakers'
    };

    const result = generateClothingSuggestions(
      currentClothing,
      currentWeather,
      'walking',
      'average',
      undefined,
      45, // Medium confidence
      2,
      [historicalRun],
      'fahrenheit'
    );

    expect(result).not.toBeNull();
    
    if (result && result.suggestions && result.suggestions.length > 0) {
      const outerLayerSuggestion = result.suggestions.find(s => s.category === 'outerLayer');
      
      // Should suggest adding outerLayer
      expect(outerLayerSuggestion).toBeDefined();
      expect(outerLayerSuggestion?.reason).toContain('colder');
      expect(outerLayerSuggestion?.current).toBe('None');
      expect(outerLayerSuggestion?.suggested).not.toBe('None');
      
      // Should NOT suggest midLayer (walking doesn't have midLayer category)
      const midLayerSuggestion = result.suggestions.find(s => s.category === 'midLayer');
      expect(midLayerSuggestion).toBeUndefined();
    }
  });

  it('should suggest removing outerLayer when current T_comfort is significantly warmer', () => {
    // Current: 10°C T_comfort
    // Historical: 5°C T_comfort
    // Difference: +5°C
    const currentWeather = createWeatherForTComfort(10);
    const historicalRun = createRunRecordWithTComfort(5);
    
    const currentClothing: ClothingItems = {
      tops: 'Long sleeve',
      outerLayer: 'Winter coat',
      bottoms: 'Casual pants',
      shoes: 'Sneakers'
    };

    const result = generateClothingSuggestions(
      currentClothing,
      currentWeather,
      'walking',
      'average',
      undefined,
      45,
      2,
      [historicalRun],
      'fahrenheit'
    );

    expect(result).not.toBeNull();
    
    if (result && result.suggestions && result.suggestions.length > 0) {
      const outerLayerSuggestion = result.suggestions.find(s => s.category === 'outerLayer');
      
      // Should suggest removing outerLayer
      expect(outerLayerSuggestion).toBeDefined();
      expect(outerLayerSuggestion?.reason).toContain('warmer');
      expect(outerLayerSuggestion?.current).not.toBe('None');
      expect(outerLayerSuggestion?.suggested).toBe('none');
    }
  });

  it('should only suggest outerLayer (not midLayer or other items)', () => {
    const currentWeather = createWeatherForTComfort(-5);
    const historicalRun = createRunRecordWithTComfort(0);
    
    const currentClothing: ClothingItems = {
      tops: 'Long sleeve',
      outerLayer: 'None',
      bottoms: 'Casual pants',
      shoes: 'Sneakers',
      gloves: 'None',
      headCover: 'None'
    };

    const result = generateClothingSuggestions(
      currentClothing,
      currentWeather,
      'walking',
      'average',
      undefined,
      45,
      2,
      [historicalRun],
      'fahrenheit'
    );

    expect(result).not.toBeNull();
    
    if (result && result.suggestions && result.suggestions.length > 0) {
      const outerLayerSuggestions = result.suggestions.filter(s => s.category === 'outerLayer');
      const nonOuterLayerSuggestions = result.suggestions.filter(s => s.category !== 'outerLayer');
      
      expect(outerLayerSuggestions.length).toBeGreaterThan(0);
      expect(nonOuterLayerSuggestions.length).toBe(0); // No suggestions for other categories
      
      // Walking doesn't have midLayer, so no midLayer suggestions
      const midLayerSuggestions = result.suggestions.filter(s => s.category === 'midLayer');
      expect(midLayerSuggestions.length).toBe(0);
    }
  });

  it('should not suggest when difference is below threshold (< 2°C)', () => {
    // Current: 1°C T_comfort
    // Historical: 0°C T_comfort
    // Difference: 1°C (below 2°C threshold)
    const currentWeather = createWeatherForTComfort(1);
    const historicalRun = createRunRecordWithTComfort(0);
    
    const currentClothing: ClothingItems = {
      tops: 'Long sleeve',
      outerLayer: 'None',
      bottoms: 'Casual pants',
      shoes: 'Sneakers'
    };

    const result = generateClothingSuggestions(
      currentClothing,
      currentWeather,
      'walking',
      'average',
      undefined,
      45,
      2,
      [historicalRun],
      'fahrenheit'
    );

    expect(result).not.toBeNull();
    // Should have no suggestions when difference is too small
    expect(result?.suggestions.length).toBe(0);
  });
});

