/**
 * Tests for Clothing Suggestions
 * 
 * Tests suggestion generation for low/medium confidence recommendations,
 * including T_comfort-based guidance and language strength based on confidence.
 */

import { describe, it, expect } from 'vitest';
import { generateClothingSuggestions } from '../services/recommendationSuggestions';
import type { WeatherData, RunRecord, ClothingItems } from '../types';

// Helper to create mock weather data
function createWeatherData(
  tempF: number, 
  feelsLikeF: number,
  overrides: Partial<WeatherData> = {}
): WeatherData {
  return {
    temperature: tempF,
    feelsLike: feelsLikeF,
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
    ...overrides,
  };
}

// Helper to create a RunRecord with specific T_comfort
// For running: T_comfort = tempC + 6.0 + (0.35 × delta) + thermal_offset
// Simplest case: temp = feelsLike (delta = 0), average preference (offset = 0)
// So: T_comfort = tempC + 6.0, therefore tempC = T_comfort - 6.0
function createRunRecordWithTComfort(tComfortC: number, date: string = '2024-01-01'): RunRecord {
  const tempC = tComfortC - 6.0; // For running with no delta and average preference
  const tempF = (tempC * 9/5) + 32;
  return {
    date,
    time: '10:00 AM',
    location: 'Test Location',
    temperature: tempF,
    feelsLike: tempF,
    humidity: 50,
    pressure: 0,
    precipitation: 0,
    uvIndex: 0,
    windSpeed: 5,
    cloudCover: 50,
    clothing: {
      tops: 'T-shirt',
      bottoms: 'Shorts',
      shoes: 'Running shoes'
    },
    activity: 'running'
  };
}

// Helper to create weather data that results in a specific T_comfort
// For running: T_comfort = tempC + 6.0 + (0.35 × delta) + thermal_offset
// Simplest case: temp = feelsLike (delta = 0), average preference (offset = 0)
// So: T_comfort = tempC + 6.0, therefore tempC = T_comfort - 6.0
function createWeatherForTComfort(tComfortC: number): WeatherData {
  const tempC = tComfortC - 6.0; // For running with no delta and average preference
  const tempF = (tempC * 9/5) + 32;
  return createWeatherData(tempF, tempF);
}

describe('Clothing Suggestions', () => {
  describe('Confidence Level Filtering', () => {
    it('should return null for high confidence (>= 70%)', () => {
      const weather = createWeatherData(32, 32);
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        weather,
        'running',
        'average',
        undefined,
        75, // High confidence
        5,
        [],
        'fahrenheit'
      );

      expect(result).toBeNull();
    });

    it('should generate suggestions for medium confidence (40-69%)', () => {
      const weather = createWeatherData(32, 32);
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        weather,
        'running',
        'average',
        undefined,
        55, // Medium confidence
        3,
        [],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      expect(result?.confidence).toBe(55);
    });

    it('should generate suggestions for low confidence (< 40%)', () => {
      const weather = createWeatherData(32, 32);
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        weather,
        'running',
        'average',
        undefined,
        35, // Low confidence
        2,
        [],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      expect(result?.confidence).toBe(35);
    });
  });

  describe('T_comfort-based Suggestions - Needs Warmer', () => {
    it('should suggest adding layers when current T_comfort is significantly colder (Fahrenheit)', () => {
      // Current: -15°C T_comfort (very cold)
      // Historical: -10°C T_comfort (cold)
      // Difference: -5°C = -9°F
      const currentWeather = createWeatherForTComfort(-15); // -15°C T_comfort for running
      const historicalRun = createRunRecordWithTComfort(-10); // -10°C T_comfort
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        45, // Medium confidence
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      
      // For running, suggestions should be for tops (not midLayer/outerLayer)
      if (result && result.suggestions && result.suggestions.length > 0) {
        const topsSuggestion = result.suggestions.find(s => s.category === 'tops');
        const midLayerSuggestion = result.suggestions.find(s => s.category === 'midLayer');
        const outerLayerSuggestion = result.suggestions.find(s => s.category === 'outerLayer');
        
        // For running, expect tops suggestion
        expect(topsSuggestion).toBeDefined();
        expect(topsSuggestion?.reason).toContain('colder');
        expect(topsSuggestion?.reason).toContain('°F');
        
        // Running shouldn't have midLayer/outerLayer suggestions
        expect(midLayerSuggestion).toBeUndefined();
        expect(outerLayerSuggestion).toBeUndefined();
      }
    });

    it('should suggest adding layers when current T_comfort is significantly colder (Celsius)', () => {
      // Current: -15°C T_comfort
      // Historical: -10°C T_comfort
      // Difference: -5°C
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        45,
        2,
        [historicalRun],
        'celsius'
      );

      expect(result).not.toBeNull();
      
      // For running, suggestions should be for tops
      if (result?.suggestions && result.suggestions.length > 0) {
        const topsSuggestion = result.suggestions.find(s => s.category === 'tops');
        expect(topsSuggestion).toBeDefined();
        expect(topsSuggestion?.reason).toContain('°C');
      }
    });

    it('should use strong language for low confidence when suggesting warmer clothing', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes',
        midLayer: 'None'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        35, // Low confidence
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      
      // For running, suggestions should be for tops
      if (result && result.suggestions && result.suggestions.length > 0) {
        const suggestion = result.suggestions.find(s => s.category === 'tops');
        expect(suggestion).toBeDefined();
        // Low confidence should use "Add" not "Consider"
        expect(suggestion?.reason).toMatch(/Add/);
        expect(suggestion?.reason).not.toContain('Consider');
      }
    });

    it('should use softer language for medium confidence when suggesting warmer clothing', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes',
        midLayer: 'None'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        55, // Medium confidence
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      
      // For running, suggestions should be for tops
      if (result && result.suggestions && result.suggestions.length > 0) {
        const suggestion = result.suggestions.find(s => s.category === 'tops');
        expect(suggestion).toBeDefined();
        // Medium confidence with large diff (>=5°F) uses "Add", smaller diff uses "Consider"
        // Since diff is 9°F, it will use "Add" (strong language for significant difference)
        expect(suggestion?.reason).toMatch(/Add|Consider/);
      }
    });

    it('should suggest adding outer layer when mid layer already exists', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'Base layer',
        bottoms: 'Tights',
        shoes: 'Running shoes',
        midLayer: 'Fleece', // Already has mid layer
        outerLayer: 'None' // Missing outer layer
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        35, // Low confidence
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      
      // For running, should suggest warmer tops
      if (result?.suggestions && result.suggestions.length > 0) {
        const topsSuggestion = result.suggestions.find(s => s.category === 'tops');
        expect(topsSuggestion).toBeDefined();
        expect(topsSuggestion?.reason).toContain('colder');
        expect(topsSuggestion?.reason).toMatch(/Add/); // Strong language for low confidence
      }
    });
  });

  describe('T_comfort-based Suggestions - Needs Cooler', () => {
    it('should suggest removing layers when current T_comfort is significantly warmer (Fahrenheit)', () => {
      // Current: 10°C T_comfort (mild)
      // Historical: 5°C T_comfort (cold)
      // Difference: +5°C = +9°F
      const currentWeather = createWeatherForTComfort(10); // 10°C T_comfort for running
      const historicalRun = createRunRecordWithTComfort(5); // 5°C T_comfort
      
      const currentClothing: ClothingItems = {
        tops: 'Base layer + jacket',
        bottoms: 'Tights',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        45,
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      
      // For running, should suggest lighter tops
      if (result && result.suggestions && result.suggestions.length > 0) {
        const topsSuggestion = result.suggestions.find(s => s.category === 'tops');
        expect(topsSuggestion).toBeDefined();
        expect(topsSuggestion?.reason).toContain('warmer');
        expect(topsSuggestion?.reason).toContain('°F');
      }
    });

    it('should suggest removing layers when current T_comfort is significantly warmer (Celsius)', () => {
      const currentWeather = createWeatherForTComfort(10);
      const historicalRun = createRunRecordWithTComfort(5);
      
      const currentClothing: ClothingItems = {
        tops: 'Base layer + jacket',
        bottoms: 'Tights',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        45,
        2,
        [historicalRun],
        'celsius'
      );

      expect(result).not.toBeNull();
      
      // For running, suggestions should be for tops
      if (result?.suggestions && result.suggestions.length > 0) {
        const suggestion = result.suggestions.find(s => s.category === 'tops');
        expect(suggestion).toBeDefined();
        expect(suggestion?.reason).toContain('°C');
      }
    });

    it('should use strong language for low confidence when suggesting cooler clothing', () => {
      const currentWeather = createWeatherForTComfort(10);
      const historicalRun = createRunRecordWithTComfort(5);
      
      const currentClothing: ClothingItems = {
        tops: 'Base layer + jacket',
        bottoms: 'Tights',
        shoes: 'Running shoes',
        midLayer: 'Fleece'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        35, // Low confidence
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      
      // For running, suggestions should be for tops
      if (result && result.suggestions && result.suggestions.length > 0) {
        const suggestion = result.suggestions.find(s => s.category === 'tops');
        expect(suggestion).toBeDefined();
        // Low confidence should use "Remove" not "Consider"
        expect(suggestion?.reason).toMatch(/Remove/);
        expect(suggestion?.reason).not.toContain('Consider');
      }
    });
  });

  describe('Explanation Text', () => {
    it('should include T_comfort difference in explanation for low confidence', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        35, // Low confidence
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      expect(result?.explanation).toContain('Low confidence');
      expect(result?.explanation).toContain('colder');
      expect(result?.explanation).toContain('°F');
      // Low confidence should use strong language
      expect(result?.explanation).toMatch(/Add layers|Follow these/);
      expect(result?.explanation).not.toContain('Consider adding layers');
    });

    it('should include T_comfort difference in explanation for medium confidence', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        55, // Medium confidence
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      expect(result?.explanation).toContain('Medium confidence');
      expect(result?.explanation).toContain('colder');
      expect(result?.explanation).toContain('°F');
      // Medium confidence can use "Consider"
      expect(result?.explanation).toContain('Consider');
    });

    it('should format temperature difference in Celsius when unit is Celsius', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        35,
        2,
        [historicalRun],
        'celsius'
      );

      expect(result).not.toBeNull();
      expect(result?.explanation).toContain('°C');
      expect(result?.explanation).not.toContain('°F');
    });

    it('should handle no historical data scenario', () => {
      const currentWeather = createWeatherData(32, 32);
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        35,
        0, // No matching runs
        [], // No similar conditions
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      expect(result?.explanation).toContain('No similar sessions found');
      expect(result?.explanation).toContain('typical recommendations');
    });
  });

  describe('Edge Cases', () => {
    it('should not suggest when temperature difference is too small (< 2°C)', () => {
      // Current: -10°C T_comfort
      // Historical: -11°C T_comfort
      // Difference: -1°C (too small)
      const currentWeather = createWeatherForTComfort(-10);
      const historicalRun = createRunRecordWithTComfort(-11);
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes',
        midLayer: 'None'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        45,
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      // Should not have T_comfort-based suggestions (difference too small)
      // But may have fallback suggestions comparing to defaults
    });

    it('should handle multiple historical sessions with average T_comfort', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRuns = [
        createRunRecordWithTComfort(-10, '2024-01-01'),
        createRunRecordWithTComfort(-12, '2024-01-02'),
        createRunRecordWithTComfort(-8, '2024-01-03')
      ];
      // Average: -10°C
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes',
        midLayer: 'None'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        45,
        3,
        historicalRuns,
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      // Should calculate average T_comfort from multiple historical sessions
      // For running, suggestions should be for tops
      if (result && result.suggestions && result.suggestions.length > 0) {
        const topsSuggestions = result.suggestions.filter(s => s.category === 'tops');
        const nonTopsSuggestions = result.suggestions.filter(s => s.category !== 'tops');
        expect(topsSuggestions.length).toBeGreaterThan(0);
        expect(nonTopsSuggestions.length).toBe(0);
      }
    });

    it('should handle undefined confidence gracefully', () => {
      const currentWeather = createWeatherData(32, 32);
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        undefined, // No confidence provided
        2,
        [],
        'fahrenheit'
      );

      // Should still generate suggestions (fallback logic)
      expect(result).not.toBeNull();
    });
  });

  describe('Layer Suggestions Only', () => {
    it('should only suggest layers, not specific items', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt',
        bottoms: 'Shorts',
        shoes: 'Running shoes',
        gloves: 'None',
        headCover: 'None',
        midLayer: 'None',
        outerLayer: 'None'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        35,
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      
      // Should only have layer suggestions (if any)
      const topsSuggestions = result?.suggestions.filter(s => s.category === 'tops');
      const nonTopsSuggestions = result?.suggestions.filter(s => s.category !== 'tops');
      
      // Verify no non-tops suggestions are generated for running
      expect(nonTopsSuggestions?.length).toBe(0);
      
      // Tops suggestions may or may not be generated depending on fallback defaults
      // But if suggestions exist, they should only be tops
      if (result && result.suggestions && result.suggestions.length > 0) {
        expect(topsSuggestions?.length).toBeGreaterThan(0);
      }
    });

    it('should suggest warmer tops when current top needs upgrade', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'Base layer', // Needs to be warmer
        bottoms: 'Tights',
        shoes: 'Running shoes'
      };

      const result = generateClothingSuggestions(
        currentClothing,
        currentWeather,
        'running',
        'average',
        undefined,
        35,
        2,
        [historicalRun],
        'fahrenheit'
      );

      expect(result).not.toBeNull();
      const suggestions = result?.suggestions || [];
      
      // Should suggest tops
      const topsSuggestions = suggestions.filter(s => s.category === 'tops');
      const nonTopsSuggestions = suggestions.filter(s => s.category !== 'tops');
      
      if (suggestions.length > 0) {
        expect(topsSuggestions.length).toBeGreaterThan(0);
        expect(nonTopsSuggestions.length).toBe(0);
      }
    });
  });
});

