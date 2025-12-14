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

