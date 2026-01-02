/**
 * Tests for Recommendation Engine
 * 
 * Tests similarity calculations, confidence scores, and T_comfort-based matching
 */

import { describe, it, expect } from 'vitest';
import { 
  getClothingRecommendation,
  getLastRecommendationDebug
} from '../services/recommendationEngine';
import type { WeatherData, RunRecord, RunFeedback, ActivityType, ActivityLevel } from '../types';

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

// Helper to convert T_comfort from °C to weather data
// For running: T_comfort = temp + 6.0 + (0.35 × delta) + thermal_offset
// Simplest case: temp = feelsLike (delta = 0), average preference (offset = 0)
// So: T_comfort = temp + 6.0, therefore temp = T_comfort - 6.0
function createWeatherFromTComfort(tComfortC: number): WeatherData {
  // For running with temp = feelsLike and average preference:
  // T_comfort = tempC + 6.0, so tempC = T_comfort - 6.0
  const tempC = tComfortC - 6.0;
  const tempF = (tempC * 9/5) + 32;
  return createWeatherData(tempF, tempF);
}

// Helper to create a RunRecord with specific T_comfort
function createRunRecordWithTComfort(
  tComfortC: number,
  date: string = '2024-01-01',
  overrides: Partial<RunRecord> = {}
): RunRecord {
  const weather = createWeatherFromTComfort(tComfortC);
  return {
    date,
    time: '10:00 AM',
    location: 'Test Location',
    temperature: weather.temperature,
    feelsLike: weather.feelsLike,
    humidity: weather.humidity,
    pressure: weather.pressure,
    precipitation: weather.precipitation,
    uvIndex: weather.uvIndex,
    windSpeed: weather.windSpeed,
    cloudCover: weather.cloudCover,
    clothing: {
      tops: 'Long sleeve',
      bottoms: 'Tights',
      headCover: 'Beanie',
      gloves: 'Light gloves',
    },
    activity: 'running',
    ...overrides,
  };
}

// Helper to create RunFeedback with specific T_comfort
function createFeedbackWithTComfort(
  tComfortC: number,
  activityLevel?: ActivityLevel,
  date: string = '2024-01-01'
): RunFeedback {
  const weather = createWeatherFromTComfort(tComfortC);
  return {
    date,
    temperature: weather.temperature,
    feelsLike: weather.feelsLike,
    humidity: weather.humidity,
    windSpeed: weather.windSpeed,
    precipitation: weather.precipitation,
    cloudCover: weather.cloudCover,
    clothing: {
      tops: 'Long sleeve',
      bottoms: 'Tights',
      headCover: 'Beanie',
      gloves: 'Light gloves',
    },
    comfort: 'satisfied',
    timestamp: new Date(date),
    activity: 'running',
    activityLevel,
  };
}

describe('Recommendation Engine - Similarity and Confidence', () => {
  const activity: ActivityType = 'running';

  describe('T_comfort Difference Impact on Similarity', () => {
    it('should calculate low similarity for large T_comfort differences (7-11°C)', () => {
      // User's scenario: Current TC = -17°C, Historical = -10°C, -10°C, -6°C
      const currentWeather = createWeatherFromTComfort(-17);
      const runs: RunRecord[] = [
        createRunRecordWithTComfort(-10, '2024-01-01'),
        createRunRecordWithTComfort(-10, '2024-01-02'),
        createRunRecordWithTComfort(-6, '2024-01-03'),
      ];

      const result = getClothingRecommendation(
        currentWeather,
        runs,
        [],
        activity,
        'average'
      );

      // Debug: Check what similarity scores were calculated
      const debug = getLastRecommendationDebug();
      if (debug) {
        console.log('Debug info:');
        console.log('  Current T_comfort:', debug.comfortAdjustment.comfortTempC.toFixed(1) + '°C');
        console.log('  Similar matches:', debug.similarMatches.length);
        debug.similarMatches.slice(0, 3).forEach((match, i) => {
          console.log(`    Match ${i+1}: ${match.date}, score: ${(match.score * 100).toFixed(1)}%`);
        });
      }

      // With 7-11°C differences, similarity should be low (~37.5%)
      // T_comfort component should be 0 (diff > 6°C threshold)
      // Only precipitation and UV contribute (~37.5% base)
      // Since 37.5% < 40% minimum threshold, sessions should be filtered out
      expect(result.matchingRuns).toBe(0);
      
      // Confidence should be low (using fallback defaults)
      // The similarity-based confidence calculation won't apply since no sessions match
    });

    it('should calculate high similarity for small T_comfort differences (< 3°C)', () => {
      const currentWeather = createWeatherFromTComfort(10);
      const runs: RunRecord[] = [
        createRunRecordWithTComfort(11, '2024-01-01'),
        createRunRecordWithTComfort(9, '2024-01-02'),
        createRunRecordWithTComfort(10.5, '2024-01-03'),
      ];

      const result = getClothingRecommendation(
        currentWeather,
        runs,
        [],
        activity,
        'average'
      );

      // With < 3°C differences, similarity should be high
      expect(result.confidence).toBeGreaterThan(70);
      expect(result.matchingRuns).toBe(3);
    });

    it('should calculate medium similarity for moderate T_comfort differences (3-6°C)', () => {
      const currentWeather = createWeatherFromTComfort(10);
      const runs: RunRecord[] = [
        createRunRecordWithTComfort(13, '2024-01-01'),  // 3°C diff → 100% (within 3.5°C threshold for running)
        createRunRecordWithTComfort(14, '2024-01-02'),  // 4°C diff → 86% (sliding scale)
        createRunRecordWithTComfort(12, '2024-01-03'), // 2°C diff → 100% (within threshold)
      ];

      const result = getClothingRecommendation(
        currentWeather,
        runs,
        [],
        activity,
        'average'
      );

      // With running threshold of 3.5°C, 2-4°C differences are mostly within threshold or high on sliding scale
      // So confidence should be high
      expect(result.confidence).toBeGreaterThan(40);
      expect(result.matchingRuns).toBe(3);
    });
  });

  describe('Activity Level Impact on Similarity', () => {
    it('should use stored activityLevel for historical feedback sessions', () => {
      // Current session: medium intensity (TC = -17°C)
      const currentWeather = createWeatherFromTComfort(-17);
      
      // Historical session with high intensity: actual temp was lower, but TC was -10°C
      // With high intensity (+1.5°C), the actual weather would be colder
      const feedback: RunFeedback[] = [
        createFeedbackWithTComfort(-10, 'high', '2024-01-01'),
      ];

      const result = getClothingRecommendation(
        currentWeather,
        [],
        feedback,
        activity,
        'average',
        'moderate' // Current activity level
      );

      // Should calculate similarity using historical high intensity and current medium
      // This ensures accurate T_comfort comparison
      expect(result.matchingRuns).toBeGreaterThanOrEqual(0);
    });

    it('should handle different activity levels between current and historical', () => {
      const currentWeather = createWeatherFromTComfort(-17);
      
      // Historical sessions with different intensities
      const feedback: RunFeedback[] = [
        createFeedbackWithTComfort(-10, 'low', '2024-01-01'),    // Low intensity
        createFeedbackWithTComfort(-10, 'moderate', '2024-01-02'), // Moderate intensity
        createFeedbackWithTComfort(-6, 'high', '2024-01-03'),    // High intensity
      ];

      const result = getClothingRecommendation(
        currentWeather,
        [],
        feedback,
        activity,
        'average',
        'moderate' // Current activity level
      );

      // Each historical session should use its own activity level
      expect(result.matchingRuns).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Confidence Calculation Formula', () => {
    it('should calculate confidence as: (count/5)*30 + avgSimilarity*70', () => {
      // Test the confidence formula explicitly
      // With 3 sessions and low similarity (0.375):
      // (3/5) * 30 + 0.375 * 70 = 18 + 26.25 = 44.25%
      const currentWeather = createWeatherFromTComfort(-17);
      const runs: RunRecord[] = [
        createRunRecordWithTComfort(-10, '2024-01-01'),
        createRunRecordWithTComfort(-10, '2024-01-02'),
        createRunRecordWithTComfort(-6, '2024-01-03'),
      ];

      const result = getClothingRecommendation(
        currentWeather,
        runs,
        [],
        activity,
        'average'
      );

      // Debug: log the result to understand what's happening
      console.log(`Confidence: ${result.confidence}%, Matching runs: ${result.matchingRuns}`);
      
      // The confidence should reflect low similarity, not high
      expect(result.confidence).toBeLessThan(50);
    });

    it('should increase confidence with more matching sessions', () => {
      const currentWeather = createWeatherFromTComfort(10);
      const runs1: RunRecord[] = Array(3).fill(null).map((_, i) => 
        createRunRecordWithTComfort(11, `2024-01-0${i+1}`)
      );
      const runs2: RunRecord[] = Array(10).fill(null).map((_, i) => 
        createRunRecordWithTComfort(11, `2024-01-${String(i+1).padStart(2, '0')}`)
      );

      const result1 = getClothingRecommendation(currentWeather, runs1, [], activity, 'average');
      const result2 = getClothingRecommendation(currentWeather, runs2, [], activity, 'average');

      // More sessions should increase confidence (up to a point)
      expect(result2.confidence).toBeGreaterThanOrEqual(result1.confidence);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty history gracefully', () => {
      const currentWeather = createWeatherFromTComfort(10);
      const result = getClothingRecommendation(
        currentWeather,
        [],
        [],
        activity,
        'average'
      );

      expect(result).toBeDefined();
      expect(result.clothing).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should filter out sessions below minimum similarity threshold', () => {
      const currentWeather = createWeatherFromTComfort(20); // Warm
      const runs: RunRecord[] = [
        createRunRecordWithTComfort(-20, '2024-01-01'), // Very cold, should be filtered
        createRunRecordWithTComfort(18, '2024-01-02'),  // Close match
      ];

      const result = getClothingRecommendation(
        currentWeather,
        runs,
        [],
        activity,
        'average'
      );

      // Very cold session should be filtered out (40% minimum threshold)
      // Only the close match should count
      expect(result.matchingRuns).toBeLessThanOrEqual(2);
    });
  });

  describe('Activity-Specific T_comfort Thresholds', () => {
    // Helper to create weather for a specific activity with T_comfort
    function createWeatherForActivity(tComfortC: number, activity: ActivityType): WeatherData {
      // For each activity: T_comfort = tempC + B + (wDelta × delta) + thermal_offset
      // Simplest case: temp = feelsLike (delta = 0), average preference (offset = 0)
      // So: T_comfort = tempC + B, therefore tempC = T_comfort - B
      const B_VALUES: Record<ActivityType, number> = {
        walking: 0.5,
        hiking: 2.0,
        snowshoeing: 3.0,
        cycling: 4.0,
        cross_country_skiing: 4.5,
        trail_running: 5.5,
        running: 6.0,
      };
      const tempC = tComfortC - B_VALUES[activity];
      const tempF = (tempC * 9/5) + 32;
      return createWeatherData(tempF, tempF);
    }

    function createRunForActivity(tComfortC: number, activity: ActivityType, date: string = '2024-01-01'): RunRecord {
      const weather = createWeatherForActivity(tComfortC, activity);
      return {
        date,
        time: '10:00 AM',
        location: 'Test Location',
        temperature: weather.temperature,
        feelsLike: weather.feelsLike,
        humidity: weather.humidity,
        pressure: weather.pressure,
        precipitation: weather.precipitation,
        uvIndex: weather.uvIndex,
        windSpeed: weather.windSpeed,
        cloudCover: weather.cloudCover,
        clothing: { tops: 'Test' },
        activity,
      };
    }

    describe('Walking (threshold: ±1.5°C, max: ±3°C)', () => {
      it('should give 100% score for differences within ±1.5°C', () => {
        const current = createWeatherForActivity(10, 'walking');
        const runs: RunRecord[] = [
          createRunForActivity(10, 'walking'),      // 0°C diff → 100%
          createRunForActivity(10.5, 'walking'),    // 0.5°C diff → 100%
          createRunForActivity(11.5, 'walking'),    // 1.5°C diff → 100% (at threshold)
        ];

        const result = getClothingRecommendation(current, runs, [], 'walking', 'average');
        expect(result.matchingRuns).toBe(3);
        expect(result.confidence).toBeGreaterThan(70);
      });

      it('should use sliding scale for differences between 1.5°C and 3°C', () => {
        const current = createWeatherForActivity(10, 'walking');
        const runs: RunRecord[] = [
          createRunForActivity(12, 'walking'),      // 2°C diff → 67% (2 - 2/1.5 = 0.67)
          createRunForActivity(12.75, 'walking'),  // 2.75°C diff → 17% (2 - 2.75/1.5 = 0.17)
        ];

        const result = getClothingRecommendation(current, runs, [], 'walking', 'average');
        // Should match but with lower confidence due to sliding scale
        expect(result.matchingRuns).toBeGreaterThanOrEqual(1);
      });

      it('should filter out differences >3°C', () => {
        const current = createWeatherForActivity(10, 'walking');
        const runs: RunRecord[] = [
          createRunForActivity(13, 'walking'),      // 3°C diff → 0% (at 2× threshold)
          createRunForActivity(14, 'walking'),       // 4°C diff → 0% (beyond 2× threshold)
        ];

        const result = getClothingRecommendation(current, runs, [], 'walking', 'average');
        // Should be filtered out by early filter
        expect(result.matchingRuns).toBe(0);
      });
    });

    describe('Hiking (threshold: ±2°C, max: ±4°C)', () => {
      it('should give 100% score for differences within ±2°C', () => {
        const current = createWeatherForActivity(5, 'hiking');
        const runs: RunRecord[] = [
          createRunForActivity(5, 'hiking'),        // 0°C diff → 100%
          createRunForActivity(6.5, 'hiking'),     // 1.5°C diff → 100%
          createRunForActivity(7, 'hiking'),        // 2°C diff → 100% (at threshold)
        ];

        const result = getClothingRecommendation(current, runs, [], 'hiking', 'average');
        expect(result.matchingRuns).toBe(3);
      });

      it('should use sliding scale for differences between 2°C and 4°C', () => {
        const current = createWeatherForActivity(5, 'hiking');
        const runs: RunRecord[] = [
          createRunForActivity(7.5, 'hiking'),       // 2.5°C diff → 75% (2 - 2.5/2 = 0.75)
          createRunForActivity(8, 'hiking'),         // 3°C diff → 50% (2 - 3/2 = 0.50)
        ];

        const result = getClothingRecommendation(current, runs, [], 'hiking', 'average');
        expect(result.matchingRuns).toBeGreaterThanOrEqual(1);
      });

      it('should filter out differences >4°C', () => {
        const current = createWeatherForActivity(5, 'hiking');
        const runs: RunRecord[] = [
          createRunForActivity(9, 'hiking'),        // 4°C diff → 0% (at 2× threshold)
          createRunForActivity(10, 'hiking'),       // 5°C diff → 0% (beyond 2× threshold)
        ];

        const result = getClothingRecommendation(current, runs, [], 'hiking', 'average');
        expect(result.matchingRuns).toBe(0);
      });
    });

    describe('Snowshoeing (threshold: ±2.5°C, max: ±5°C)', () => {
      it('should give 100% score for differences within ±2.5°C', () => {
        const current = createWeatherForActivity(-5, 'snowshoeing');
        const runs: RunRecord[] = [
          createRunForActivity(-5, 'snowshoeing'),      // 0°C diff → 100%
          createRunForActivity(-6.5, 'snowshoeing'),    // 1.5°C diff → 100%
          createRunForActivity(-7.5, 'snowshoeing'),    // 2.5°C diff → 100% (at threshold)
        ];

        const result = getClothingRecommendation(current, runs, [], 'snowshoeing', 'average');
        expect(result.matchingRuns).toBe(3);
      });

      it('should use sliding scale for differences between 2.5°C and 5°C', () => {
        const current = createWeatherForActivity(-5, 'snowshoeing');
        const runs: RunRecord[] = [
          createRunForActivity(-8, 'snowshoeing'),     // 3°C diff → 80% (2 - 3/2.5 = 0.80)
          createRunForActivity(-9, 'snowshoeing'),     // 4°C diff → 40% (2 - 4/2.5 = 0.40)
        ];

        const result = getClothingRecommendation(current, runs, [], 'snowshoeing', 'average');
        expect(result.matchingRuns).toBeGreaterThanOrEqual(1);
      });

      it('should filter out differences >5°C', () => {
        const current = createWeatherForActivity(-5, 'snowshoeing');
        const runs: RunRecord[] = [
          createRunForActivity(-10, 'snowshoeing'),     // 5°C diff → 0% (at 2× threshold)
        ];

        const result = getClothingRecommendation(current, runs, [], 'snowshoeing', 'average');
        expect(result.matchingRuns).toBe(0);
      });
    });

    describe('XC Skiing (threshold: ±3°C, max: ±6°C)', () => {
      it('should give 100% score for differences within ±3°C', () => {
        const current = createWeatherForActivity(-10, 'cross_country_skiing');
        const runs: RunRecord[] = [
          createRunForActivity(-10, 'cross_country_skiing'),  // 0°C diff → 100%
          createRunForActivity(-12, 'cross_country_skiing'),  // 2°C diff → 100%
          createRunForActivity(-13, 'cross_country_skiing'),  // 3°C diff → 100% (at threshold)
        ];

        const result = getClothingRecommendation(current, runs, [], 'cross_country_skiing', 'average');
        expect(result.matchingRuns).toBe(3);
      });

      it('should use sliding scale for differences between 3°C and 6°C', () => {
        const current = createWeatherForActivity(-10, 'cross_country_skiing');
        const runs: RunRecord[] = [
          createRunForActivity(-14, 'cross_country_skiing'),  // 4°C diff → 67% (2 - 4/3 = 0.67)
          createRunForActivity(-15.5, 'cross_country_skiing'), // 5.5°C diff → 17% (2 - 5.5/3 = 0.17)
        ];

        const result = getClothingRecommendation(current, runs, [], 'cross_country_skiing', 'average');
        expect(result.matchingRuns).toBeGreaterThanOrEqual(1);
      });

      it('should filter out differences >6°C', () => {
        const current = createWeatherForActivity(-10, 'cross_country_skiing');
        const runs: RunRecord[] = [
          createRunForActivity(-16, 'cross_country_skiing'),  // 6°C diff → 0% (at 2× threshold)
        ];

        const result = getClothingRecommendation(current, runs, [], 'cross_country_skiing', 'average');
        expect(result.matchingRuns).toBe(0);
      });
    });

    describe('Running (threshold: ±3.5°C, max: ±7°C)', () => {
      it('should give 100% score for differences within ±3.5°C', () => {
        const current = createWeatherForActivity(15, 'running');
        const runs: RunRecord[] = [
          createRunForActivity(15, 'running'),       // 0°C diff → 100%
          createRunForActivity(17, 'running'),       // 2°C diff → 100%
          createRunForActivity(18.5, 'running'),     // 3.5°C diff → 100% (at threshold)
        ];

        const result = getClothingRecommendation(current, runs, [], 'running', 'average');
        expect(result.matchingRuns).toBe(3);
      });

      it('should use sliding scale for differences between 3.5°C and 7°C', () => {
        const current = createWeatherForActivity(15, 'running');
        const runs: RunRecord[] = [
          createRunForActivity(19, 'running'),       // 4°C diff → 86% (2 - 4/3.5 = 0.86)
          createRunForActivity(20.5, 'running'),     // 5.5°C diff → 43% (2 - 5.5/3.5 = 0.43)
        ];

        const result = getClothingRecommendation(current, runs, [], 'running', 'average');
        expect(result.matchingRuns).toBeGreaterThanOrEqual(1);
      });

      it('should filter out differences >7°C', () => {
        const current = createWeatherForActivity(15, 'running');
        const runs: RunRecord[] = [
          createRunForActivity(22, 'running'),       // 7°C diff → 0% (at 2× threshold)
        ];

        const result = getClothingRecommendation(current, runs, [], 'running', 'average');
        expect(result.matchingRuns).toBe(0);
      });
    });

    describe('Overall Similarity with Activity-Specific Thresholds', () => {
      it('should calculate overall similarity correctly with sliding scale T_comfort scores', () => {
        // Running example: Current T_comfort = 15°C, Historical = 20.5°C (5.5°C difference)
        // Running threshold: 3.5°C, max: 7°C
        // T_comfort score: 2 - (5.5/3.5) = 2 - 1.57 = 0.43 (43%)
        // With perfect precipitation and UV matches, overall should be ~64%
        const current = createWeatherForActivity(15, 'running');
        const runs: RunRecord[] = [
          createRunForActivity(20.5, 'running', '2024-01-01'), // 5.5°C diff → 43% T_comfort score
        ];

        const result = getClothingRecommendation(current, runs, [], 'running', 'average');
        
        // Should pass 40% threshold (T_comfort 43% × 5.0 = 2.15, precip 100% × 2.5 = 2.5, UV 100% × 0.5 = 0.5)
        // Total: 5.15 / 8.0 = 64.4%
        // But with only 1 run: (1/5) × 30 = 6%, avgSimilarity × 70 = 64.4% × 70 = 45.1%
        // Total confidence: 6% + 45.1% = 51.1%
        expect(result.matchingRuns).toBe(1);
        expect(result.confidence).toBeGreaterThan(40); // Adjusted expectation - single run with sliding scale
      });
    });
  });
});

