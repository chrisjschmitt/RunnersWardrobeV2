/**
 * Tests for T_comfort calculation
 * 
 * T_comfort = T_actual + B(activity) + wΔ(activity) × Δ + thermal_offset
 * Where: Δ = clamp(FeelsLike − Actual, −15°C, +8°C)
 */

import { describe, it, expect } from 'vitest';
import { calculateComfortTemperature, comfortTempToFahrenheit } from '../services/recommendationEngine';
import { ACTIVITY_THERMAL_PARAMS, THERMAL_OFFSETS } from '../types';
import type { WeatherData } from '../types';

// Helper to create mock weather data
function createWeatherData(tempF: number, feelsLikeF: number): WeatherData {
  return {
    temperature: tempF,
    feelsLike: feelsLikeF,
    humidity: 50,
    pressure: 30,
    precipitation: 0,
    uvIndex: 5,
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

describe('T_comfort Calculation', () => {
  
  describe('Activity Thermal Parameters', () => {
    it('should have correct B values for each activity', () => {
      expect(ACTIVITY_THERMAL_PARAMS.walking.B).toBe(0.5);
      expect(ACTIVITY_THERMAL_PARAMS.hiking.B).toBe(2.0);
      expect(ACTIVITY_THERMAL_PARAMS.snowshoeing.B).toBe(3.0);
      expect(ACTIVITY_THERMAL_PARAMS.cycling.B).toBe(4.0);
      expect(ACTIVITY_THERMAL_PARAMS.cross_country_skiing.B).toBe(4.5);
      expect(ACTIVITY_THERMAL_PARAMS.trail_running.B).toBe(5.5);
      expect(ACTIVITY_THERMAL_PARAMS.running.B).toBe(6.0);
    });

    it('should have correct wDelta values for each activity', () => {
      expect(ACTIVITY_THERMAL_PARAMS.walking.wDelta).toBe(0.80);
      expect(ACTIVITY_THERMAL_PARAMS.hiking.wDelta).toBe(0.65);
      expect(ACTIVITY_THERMAL_PARAMS.snowshoeing.wDelta).toBe(0.60);
      expect(ACTIVITY_THERMAL_PARAMS.cycling.wDelta).toBe(0.50);
      expect(ACTIVITY_THERMAL_PARAMS.cross_country_skiing.wDelta).toBe(0.50);
      expect(ACTIVITY_THERMAL_PARAMS.trail_running.wDelta).toBe(0.40);
      expect(ACTIVITY_THERMAL_PARAMS.running.wDelta).toBe(0.35);
    });
  });

  describe('Thermal Preference Offsets', () => {
    it('should have correct offset values', () => {
      // "runs cold" = needs warmer clothes = lower T_comfort = negative offset
      expect(THERMAL_OFFSETS.cold).toBe(-4.4);
      expect(THERMAL_OFFSETS.average).toBe(0);
      // "runs warm" = needs lighter clothes = higher T_comfort = positive offset
      expect(THERMAL_OFFSETS.warm).toBe(4.4);
    });
  });

  describe('calculateComfortTemperature', () => {
    it('should correctly calculate T_comfort for running with no feels-like difference', () => {
      // 41°F = 5°C, same for feels-like
      const weather = createWeatherData(41, 41);
      const result = calculateComfortTemperature(weather, 'running', 'average');
      
      // T_comfort = 5 + 6.0 + (0.35 × 0) + 0 = 11°C
      expect(result.actualTempC).toBeCloseTo(5, 1);
      expect(result.delta).toBe(0);
      expect(result.B).toBe(6.0);
      expect(result.wDelta).toBe(0.35);
      expect(result.thermalOffset).toBe(0);
      expect(result.comfortTempC).toBeCloseTo(11, 1);
    });

    it('should correctly calculate T_comfort with wind chill (feels colder)', () => {
      // 41°F (5°C) actual, 32°F (0°C) feels-like → Δ = -5°C
      const weather = createWeatherData(41, 32);
      const result = calculateComfortTemperature(weather, 'running', 'average');
      
      // T_comfort = 5 + 6.0 + (0.35 × -5) + 0 = 5 + 6 - 1.75 = 9.25°C
      expect(result.delta).toBeCloseTo(-5, 1);
      expect(result.comfortTempC).toBeCloseTo(9.25, 1);
    });

    it('should correctly calculate T_comfort with heat index (feels warmer)', () => {
      // 77°F (25°C) actual, 86°F (30°C) feels-like → Δ = +5°C
      const weather = createWeatherData(77, 86);
      const result = calculateComfortTemperature(weather, 'running', 'average');
      
      // T_comfort = 25 + 6.0 + (0.35 × 5) + 0 = 25 + 6 + 1.75 = 32.75°C
      expect(result.delta).toBeCloseTo(5, 1);
      expect(result.comfortTempC).toBeCloseTo(32.75, 1);
    });

    it('should clamp delta to minimum of -15°C', () => {
      // Extreme wind chill: 32°F (0°C) actual, -22°F (-30°C) feels-like → Δ = -30, clamped to -15
      const weather = createWeatherData(32, -22);
      const result = calculateComfortTemperature(weather, 'running', 'average');
      
      expect(result.delta).toBe(-15); // Clamped
      // T_comfort = 0 + 6.0 + (0.35 × -15) + 0 = 6 - 5.25 = 0.75°C
      expect(result.comfortTempC).toBeCloseTo(0.75, 1);
    });

    it('should clamp delta to maximum of +8°C', () => {
      // Extreme heat index: 95°F (35°C) actual, 122°F (50°C) feels-like → Δ = +15, clamped to +8
      const weather = createWeatherData(95, 122);
      const result = calculateComfortTemperature(weather, 'running', 'average');
      
      expect(result.delta).toBe(8); // Clamped
      // T_comfort = 35 + 6.0 + (0.35 × 8) + 0 = 35 + 6 + 2.8 = 43.8°C
      expect(result.comfortTempC).toBeCloseTo(43.8, 1);
    });

    it('should apply thermal offset for "runs cold" preference', () => {
      // 41°F (5°C), running, runs cold (-4.4°C offset → lower T_comfort → warmer clothes)
      const weather = createWeatherData(41, 41);
      const result = calculateComfortTemperature(weather, 'running', 'cold');
      
      // T_comfort = 5 + 6.0 + 0 - 4.4 = 6.6°C
      expect(result.thermalOffset).toBe(-4.4);
      expect(result.comfortTempC).toBeCloseTo(6.6, 1);
    });

    it('should apply thermal offset for "runs warm" preference', () => {
      // 41°F (5°C), running, runs warm (+4.4°C offset → higher T_comfort → lighter clothes)
      const weather = createWeatherData(41, 41);
      const result = calculateComfortTemperature(weather, 'running', 'warm');
      
      // T_comfort = 5 + 6.0 + 0 + 4.4 = 15.4°C
      expect(result.thermalOffset).toBe(4.4);
      expect(result.comfortTempC).toBeCloseTo(15.4, 1);
    });

    it('should have higher T_comfort for running vs walking at same temperature', () => {
      const weather = createWeatherData(41, 41);
      const runningResult = calculateComfortTemperature(weather, 'running', 'average');
      const walkingResult = calculateComfortTemperature(weather, 'walking', 'average');
      
      // Running B=6.0, Walking B=0.5
      expect(runningResult.comfortTempC).toBeGreaterThan(walkingResult.comfortTempC);
      expect(runningResult.comfortTempC - walkingResult.comfortTempC).toBeCloseTo(5.5, 1);
    });

    it('should have different feels-like impact for running vs walking', () => {
      // Same actual temp, different feels-like
      const weather = createWeatherData(41, 32); // 5°C actual, 0°C feels-like
      const runningResult = calculateComfortTemperature(weather, 'running', 'average');
      const walkingResult = calculateComfortTemperature(weather, 'walking', 'average');
      
      // Running wDelta=0.35, Walking wDelta=0.80
      // Wind chill affects walking more than running
      expect(runningResult.wDelta).toBe(0.35);
      expect(walkingResult.wDelta).toBe(0.80);
      
      // The delta contribution should be larger for walking
      const runningDeltaContrib = runningResult.wDelta * runningResult.delta;
      const walkingDeltaContrib = walkingResult.wDelta * walkingResult.delta;
      expect(Math.abs(walkingDeltaContrib)).toBeGreaterThan(Math.abs(runningDeltaContrib));
    });
  });

  describe('comfortTempToFahrenheit', () => {
    it('should correctly convert °C to °F', () => {
      expect(comfortTempToFahrenheit(0)).toBe(32);
      expect(comfortTempToFahrenheit(100)).toBe(212);
      expect(comfortTempToFahrenheit(-40)).toBe(-40); // Same in both scales
      expect(comfortTempToFahrenheit(20)).toBeCloseTo(68, 1);
    });
  });

  describe('Example from documentation', () => {
    it('should match the documented example calculation', () => {
      // From docs: 5°C actual, 0°C feels-like, Running, User "runs cold"
      // "runs cold" = -4.4°C offset (lower T_comfort → warmer clothes)
      // T_comfort = 5 + 6.0 + (0.35 × -5) - 4.4 = 5 + 6 - 1.75 - 4.4 = 4.85°C
      
      // 5°C = 41°F, 0°C = 32°F
      const weather = createWeatherData(41, 32);
      const result = calculateComfortTemperature(weather, 'running', 'cold');
      
      expect(result.actualTempC).toBeCloseTo(5, 1);
      expect(result.feelsLikeTempC).toBeCloseTo(0, 1);
      expect(result.delta).toBeCloseTo(-5, 1);
      expect(result.B).toBe(6.0);
      expect(result.wDelta).toBe(0.35);
      expect(result.thermalOffset).toBe(-4.4);
      expect(result.comfortTempC).toBeCloseTo(4.85, 0.5);
    });
  });
});

