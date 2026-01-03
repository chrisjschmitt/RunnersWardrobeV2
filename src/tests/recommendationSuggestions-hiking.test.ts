/**
 * Test hiking activity suggestions (uses midLayer/outerLayer)
 */

import { describe, it, expect } from 'vitest';
import { generateClothingSuggestions } from '../services/recommendationSuggestions';
import type { WeatherData, RunRecord, ClothingItems } from '../types';

// Helper to create mock weather data with specific T_comfort for hiking
// For hiking: T_comfort = tempC + 3.0 + (0.35 × delta) + thermal_offset
// Simplest case: temp = feelsLike (delta = 0), average preference (offset = 0)
// So: T_comfort = tempC + 3.0, therefore tempC = T_comfort - 3.0
function createWeatherForTComfort(tComfortC: number): WeatherData {
  const tempC = tComfortC - 3.0; // For hiking with no delta and average preference
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
  const tempC = tComfortC - 3.0; // For hiking with no delta and average preference
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
    activity: 'hiking'
  };
}

describe('Hiking Activity Suggestions', () => {
  it('should suggest adding midLayer when current T_comfort is significantly colder', () => {
    // Current: -5°C T_comfort
    // Historical: 0°C T_comfort
    // Difference: -5°C
    const currentWeather = createWeatherForTComfort(-5);
    const historicalRun = createRunRecordWithTComfort(0);
    
    const currentClothing: ClothingItems = {
      baseLayer: 'Long sleeve',
      midLayer: 'None',
      outerLayer: 'None',
      bottoms: 'Hiking pants',
      shoes: 'Hiking boots'
    };

    const result = generateClothingSuggestions(
      currentClothing,
      currentWeather,
      'hiking',
      'average',
      undefined,
      45, // Medium confidence
      2,
      [historicalRun],
      'fahrenheit'
    );

    expect(result).not.toBeNull();
    
    if (result && result.suggestions && result.suggestions.length > 0) {
      const midLayerSuggestion = result.suggestions.find(s => s.category === 'midLayer');
      const outerLayerSuggestion = result.suggestions.find(s => s.category === 'outerLayer');
      
      // Should suggest adding at least one layer
      expect(midLayerSuggestion || outerLayerSuggestion).toBeDefined();
      
      if (midLayerSuggestion) {
        expect(midLayerSuggestion.reason).toContain('colder');
        expect(midLayerSuggestion.current).toBe('None');
        expect(midLayerSuggestion.suggested).not.toBe('None');
      }
    }
  });

  it('should suggest removing midLayer when current T_comfort is significantly warmer', () => {
    // Current: 10°C T_comfort
    // Historical: 5°C T_comfort
    // Difference: +5°C
    const currentWeather = createWeatherForTComfort(10);
    const historicalRun = createRunRecordWithTComfort(5);
    
    const currentClothing: ClothingItems = {
      baseLayer: 'Long sleeve',
      midLayer: 'Fleece',
      outerLayer: 'None',
      bottoms: 'Hiking pants',
      shoes: 'Hiking boots'
    };

    const result = generateClothingSuggestions(
      currentClothing,
      currentWeather,
      'hiking',
      'average',
      undefined,
      45,
      2,
      [historicalRun],
      'fahrenheit'
    );

    expect(result).not.toBeNull();
    
    if (result && result.suggestions && result.suggestions.length > 0) {
      const midLayerSuggestion = result.suggestions.find(s => s.category === 'midLayer');
      
      // Should suggest removing midLayer
      if (midLayerSuggestion) {
        expect(midLayerSuggestion.reason).toContain('warmer');
        expect(midLayerSuggestion.current).not.toBe('None');
        expect(midLayerSuggestion.suggested).toBe('none');
      }
    }
  });

  it('should only suggest layers (midLayer/outerLayer), not other items', () => {
    const currentWeather = createWeatherForTComfort(-5);
    const historicalRun = createRunRecordWithTComfort(0);
    
    const currentClothing: ClothingItems = {
      baseLayer: 'Long sleeve',
      midLayer: 'None',
      outerLayer: 'None',
      bottoms: 'Hiking pants',
      shoes: 'Hiking boots',
      gloves: 'None',
      headCover: 'None'
    };

    const result = generateClothingSuggestions(
      currentClothing,
      currentWeather,
      'hiking',
      'average',
      undefined,
      45,
      2,
      [historicalRun],
      'fahrenheit'
    );

    expect(result).not.toBeNull();
    
    if (result && result.suggestions && result.suggestions.length > 0) {
      const layerSuggestions = result.suggestions.filter(s => 
        s.category === 'midLayer' || s.category === 'outerLayer'
      );
      const nonLayerSuggestions = result.suggestions.filter(s => 
        s.category !== 'midLayer' && s.category !== 'outerLayer'
      );
      
      expect(layerSuggestions.length).toBeGreaterThan(0);
      expect(nonLayerSuggestions.length).toBe(0); // No suggestions for other categories
    }
  });
});

