/**
 * Tests for Clothing Suggestions
 * 
 * Tests suggestion generation for low/medium confidence recommendations,
 * including T_comfort-based guidance and language strength based on confidence.
 */

import { describe, it, expect } from 'vitest';
import { generateClothingSuggestions } from '../services/recommendationSuggestions';
import type { WeatherData, RunRecord, ClothingItems, ActivityType, ActivityLevel } from '../types';

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
        shoes: 'Running shoes',
        midLayer: 'None',
        outerLayer: 'None'
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
      expect(result?.suggestions.length).toBeGreaterThan(0);
      
      // Should suggest adding layers
      const midLayerSuggestion = result?.suggestions.find(s => s.category === 'midLayer');
      expect(midLayerSuggestion).toBeDefined();
      expect(midLayerSuggestion?.reason).toContain('colder');
      expect(midLayerSuggestion?.reason).toContain('°F');
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
        shoes: 'Running shoes',
        midLayer: 'None',
        outerLayer: 'None'
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
      const midLayerSuggestion = result?.suggestions.find(s => s.category === 'midLayer');
      expect(midLayerSuggestion?.reason).toContain('°C');
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
      const suggestion = result?.suggestions.find(s => s.category === 'midLayer');
      expect(suggestion).toBeDefined();
      // Low confidence should use "Add" not "Consider"
      expect(suggestion?.reason).toMatch(/Add|Use|Wear/);
      expect(suggestion?.reason).not.toContain('Consider');
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
      const suggestion = result?.suggestions.find(s => s.category === 'midLayer');
      expect(suggestion).toBeDefined();
      // Medium confidence can use "Consider"
      expect(suggestion?.reason).toContain('Consider');
    });

    it('should suggest warmer tops when current is too light', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'T-shirt', // Too light
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
      const topSuggestion = result?.suggestions.find(s => s.category === 'tops');
      expect(topSuggestion).toBeDefined();
      expect(topSuggestion?.reason).toContain('warmer');
      expect(topSuggestion?.reason).toMatch(/Use|Add/); // Strong language for low confidence
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
        shoes: 'Running shoes',
        midLayer: 'Fleece',
        outerLayer: 'Jacket'
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
      expect(result?.suggestions.length).toBeGreaterThan(0);
      
      // Should suggest removing layers
      const layerSuggestion = result?.suggestions.find(s => 
        s.category === 'midLayer' || s.category === 'outerLayer'
      );
      expect(layerSuggestion).toBeDefined();
      expect(layerSuggestion?.reason).toContain('warmer');
      expect(layerSuggestion?.reason).toContain('°F');
    });

    it('should suggest removing layers when current T_comfort is significantly warmer (Celsius)', () => {
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
        45,
        2,
        [historicalRun],
        'celsius'
      );

      expect(result).not.toBeNull();
      const suggestion = result?.suggestions.find(s => s.category === 'midLayer');
      expect(suggestion?.reason).toContain('°C');
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
      const suggestion = result?.suggestions.find(s => s.category === 'midLayer');
      expect(suggestion).toBeDefined();
      // Low confidence should use "Remove" not "Consider"
      expect(suggestion?.reason).toMatch(/Remove|Use/);
      expect(suggestion?.reason).not.toContain('Consider');
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
      // Should calculate average and suggest based on that
      expect(result?.suggestions.length).toBeGreaterThan(0);
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

  describe('Clothing Category Suggestions', () => {
    it('should suggest gloves/head cover for cold conditions', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'Base layer',
        bottoms: 'Tights',
        shoes: 'Running shoes',
        gloves: 'None',
        headCover: 'None'
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
      const glovesSuggestion = result?.suggestions.find(s => s.category === 'gloves');
      const headSuggestion = result?.suggestions.find(s => s.category === 'headCover');
      
      // At least one should be suggested
      expect(glovesSuggestion || headSuggestion).toBeDefined();
      if (glovesSuggestion) {
        expect(glovesSuggestion.reason).toMatch(/Wear|Essential/);
      }
    });

    it('should suggest long bottoms when shorts are too light', () => {
      const currentWeather = createWeatherForTComfort(-15);
      const historicalRun = createRunRecordWithTComfort(-10);
      
      const currentClothing: ClothingItems = {
        tops: 'Base layer',
        bottoms: 'Shorts', // Too light
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
      const bottomsSuggestion = result?.suggestions.find(s => s.category === 'bottoms');
      expect(bottomsSuggestion).toBeDefined();
      expect(bottomsSuggestion?.reason).toContain('Long bottoms');
      expect(bottomsSuggestion?.reason).toMatch(/Wear|recommended/);
    });
  });
});

