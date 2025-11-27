import type { RunRecord, ClothingItems } from '../types';

// Expected CSV headers (flexible matching)
const HEADER_MAPPINGS: Record<string, string> = {
  // Date/Time/Location
  'date': 'date',
  'time': 'time',
  'location': 'location',
  
  // Weather
  'temperature': 'temperature',
  'temp': 'temperature',
  'feels_like': 'feelsLike',
  'feelslike': 'feelsLike',
  'feels like': 'feelsLike',
  'humidity': 'humidity',
  'pressure': 'pressure',
  'precipitation': 'precipitation',
  'precip': 'precipitation',
  'uv': 'uvIndex',
  'uv_index': 'uvIndex',
  'uvindex': 'uvIndex',
  'wind_speed': 'windSpeed',
  'windspeed': 'windSpeed',
  'wind speed': 'windSpeed',
  'wind': 'windSpeed',
  'cloud_cover': 'cloudCover',
  'cloudcover': 'cloudCover',
  'cloud cover': 'cloudCover',
  'clouds': 'cloudCover',
  
  // Clothing
  'head_cover': 'headCover',
  'headcover': 'headCover',
  'head cover': 'headCover',
  'hat': 'headCover',
  'tops': 'tops',
  'top': 'tops',
  'shirt': 'tops',
  'bottoms': 'bottoms',
  'bottom': 'bottoms',
  'pants': 'bottoms',
  'shoes': 'shoes',
  'shoe': 'shoes',
  'footwear': 'shoes',
  'socks': 'socks',
  'sock': 'socks',
  'gloves': 'gloves',
  'glove': 'gloves',
  'rain_gear': 'rainGear',
  'raingear': 'rainGear',
  'rain gear': 'rainGear',
  'rain': 'rainGear',
};

interface ParseResult {
  success: boolean;
  records: RunRecord[];
  errors: string[];
  warnings: string[];
}

export function parseCSV(csvContent: string): ParseResult {
  const result: ParseResult = {
    success: false,
    records: [],
    errors: [],
    warnings: []
  };

  const lines = csvContent.trim().split(/\r?\n/);
  
  if (lines.length < 2) {
    result.errors.push('CSV file must have a header row and at least one data row');
    return result;
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  // Map headers to our field names
  const columnMap: Record<number, string> = {};
  const foundFields = new Set<string>();
  
  headers.forEach((header, index) => {
    const mappedField = HEADER_MAPPINGS[header];
    if (mappedField) {
      columnMap[index] = mappedField;
      foundFields.add(mappedField);
    } else {
      result.warnings.push(`Unknown column "${header}" will be ignored`);
    }
  });

  // Check for required fields
  const requiredFields = ['date', 'temperature'];
  for (const field of requiredFields) {
    if (!foundFields.has(field)) {
      result.errors.push(`Missing required column: ${field}`);
    }
  }

  if (result.errors.length > 0) {
    return result;
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      const record = createRunRecord(values, columnMap, i + 1);
      
      if (record) {
        result.records.push(record);
      }
    } catch (error) {
      result.warnings.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }

  if (result.records.length === 0) {
    result.errors.push('No valid records found in CSV');
    return result;
  }

  result.success = true;
  return result;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  values.push(current.trim());
  return values;
}

function createRunRecord(
  values: string[],
  columnMap: Record<number, string>,
  _rowNum: number
): RunRecord | null {
  const data: Record<string, string> = {};
  
  // Map values to field names
  values.forEach((value, index) => {
    const fieldName = columnMap[index];
    if (fieldName) {
      data[fieldName] = value;
    }
  });

  // Validate required fields
  if (!data.date || !data.temperature) {
    throw new Error('Missing required fields (date or temperature)');
  }

  // Parse numeric fields with defaults
  const parseNum = (val: string | undefined, defaultVal: number = 0): number => {
    if (!val || val === '') return defaultVal;
    const num = parseFloat(val);
    return isNaN(num) ? defaultVal : num;
  };

  // Create clothing object
  const clothing: ClothingItems = {
    headCover: data.headCover || 'none',
    tops: data.tops || 'unknown',
    bottoms: data.bottoms || 'unknown',
    shoes: data.shoes || 'unknown',
    socks: data.socks || 'unknown',
    gloves: data.gloves || 'none',
    rainGear: data.rainGear || 'none'
  };

  return {
    date: data.date,
    time: data.time || '00:00',
    location: data.location || 'Unknown',
    temperature: parseNum(data.temperature),
    feelsLike: parseNum(data.feelsLike, parseNum(data.temperature)),
    humidity: parseNum(data.humidity),
    pressure: parseNum(data.pressure),
    precipitation: parseNum(data.precipitation),
    uvIndex: parseNum(data.uvIndex),
    windSpeed: parseNum(data.windSpeed),
    cloudCover: parseNum(data.cloudCover),
    clothing
  };
}

export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV file' };
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

