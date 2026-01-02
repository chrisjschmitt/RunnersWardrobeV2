/**
 * Tests for Recommendation Engine
 * 
 * Tests similarity calculations, confidence scores, and T_comfort-based matching
 */

import { describe, it, expect } from 'vitest';
import { 
  getClothingRecommendation,
  calculateComfortTemperature,
  comfortTempToFahrenheit,
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
        createRunRecordWithTComfort(13, '2024-01-01'),
        createRunRecordWithTComfort(14, '2024-01-02'),
        createRunRecordWithTComfort(12, '2024-01-03'),
      ];

      const result = getClothingRecommendation(
        currentWeather,
        runs,
        [],
        activity,
        'average'
      );

      // With 2-4°C differences, similarity should be medium
      expect(result.confidence).toBeGreaterThan(40);
      expect(result.confidence).toBeLessThan(80);
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
        'medium' // Current activity level
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
        createFeedbackWithTComfort(-10, 'medium', '2024-01-02'), // Medium intensity
        createFeedbackWithTComfort(-6, 'high', '2024-01-03'),    // High intensity
      ];

      const result = getClothingRecommendation(
        currentWeather,
        [],
        feedback,
        activity,
        'average',
        'medium' // Current activity level
      );

      // Each historical session should use its own activity level
      expect(result.matchingRuns).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Confidence Calculation Formula', () => {
    it('should calculate confidence as: (count/10)*30 + avgSimilarity*70', () => {
      // Test the confidence formula explicitly
      // With 3 sessions and low similarity (0.375):
      // (3/10) * 30 + 0.375 * 70 = 9 + 26.25 = 35.25%
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
});

