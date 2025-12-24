export type TemperatureUnit = 'fahrenheit' | 'celsius';

export function convertTemperature(tempF: number, unit: TemperatureUnit): number {
  if (unit === 'celsius') {
    return Math.round((tempF - 32) * 5 / 9);
  }
  return tempF;
}

export function formatTemperature(tempF: number, unit: TemperatureUnit): string {
  const temp = convertTemperature(tempF, unit);
  const symbol = unit === 'celsius' ? '°C' : '°F';
  return `${temp}${symbol}`;
}

export function getUnitSymbol(unit: TemperatureUnit): string {
  return unit === 'celsius' ? '°C' : '°F';
}

// Format a temperature difference/delta (not an absolute temperature)
// Used for things like "+3°F offset" which should become "+1.7°C offset"
// NOTE: Input is expected to be in °F
export function formatTemperatureDelta(deltaF: number, unit: TemperatureUnit): string {
  const symbol = unit === 'celsius' ? '°C' : '°F';
  if (unit === 'celsius') {
    // Convert delta: 1°F change = 5/9°C change
    const deltaC = Math.round(deltaF * 5 / 9 * 10) / 10;
    const sign = deltaC > 0 ? '+' : '';
    return `${sign}${deltaC}${symbol}`;
  }
  const sign = deltaF > 0 ? '+' : '';
  return `${sign}${deltaF.toFixed(1)}${symbol}`;
}

// Format a temperature difference/delta that's already in °C
// Used for thermal preference offsets which are stored in °C
export function formatTemperatureDeltaC(deltaC: number, unit: TemperatureUnit): string {
  const symbol = unit === 'celsius' ? '°C' : '°F';
  if (unit === 'fahrenheit') {
    // Convert delta: 1°C change = 9/5°F change
    const deltaF = Math.round(deltaC * 9 / 5 * 10) / 10;
    const sign = deltaF > 0 ? '+' : '';
    return `${sign}${deltaF}${symbol}`;
  }
  const sign = deltaC > 0 ? '+' : '';
  return `${sign}${deltaC.toFixed(1)}${symbol}`;
}

// Wind speed conversion (stored in mph, display in km/h for metric)
export function convertWindSpeed(mph: number, unit: TemperatureUnit): number {
  if (unit === 'celsius') {
    return Math.round(mph * 1.60934);
  }
  return mph;
}

export function formatWindSpeed(mph: number, unit: TemperatureUnit): string {
  if (unit === 'celsius') {
    const kph = Math.round(mph * 1.60934);
    return `${kph} km/h`;
  }
  return `${mph} mph`;
}

// Precipitation conversion (stored in inches, display in mm for metric)
// 1 inch = 25.4 mm
export function convertPrecipitation(inches: number, unit: TemperatureUnit): number {
  if (unit === 'celsius') {
    return Math.round(inches * 25.4 * 10) / 10; // Round to 1 decimal
  }
  return inches;
}

export function formatPrecipitation(inches: number, unit: TemperatureUnit): string {
  if (inches === 0) {
    return 'None';
  }
  if (unit === 'celsius') {
    const mm = Math.round(inches * 25.4 * 10) / 10;
    return `${mm} mm`;
  }
  return `${inches}"`;
}

// Helper to check if using metric system
export function isMetric(unit: TemperatureUnit): boolean {
  return unit === 'celsius';
}

