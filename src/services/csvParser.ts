import type { RunRecord, ClothingItems, ActivityType } from '../types';

// Valid activity names for parsing
const VALID_ACTIVITIES: ActivityType[] = ['running', 'hiking', 'cycling', 'walking', 'trail_running', 'snowshoeing', 'cross_country_skiing'];

// Expected CSV headers (flexible matching)
const HEADER_MAPPINGS: Record<string, string> = {
  // Date/Time/Location/Activity
  'date': 'date',
  'time': 'time',
  'location': 'location',
  'activity': 'activity',
  'source': 'source', // We'll ignore this but recognize it
  
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
  'comfort': 'comfort',
  'comments': 'comments',
  'activity_level': 'activityLevel',  // Recognized but not used in RunRecord (expert mode feature)
  'activitylevel': 'activityLevel',
  'activity level': 'activityLevel',
  'duration': 'duration',  // Recognized but not used in RunRecord (expert mode feature)
  
  // Clothing - Common
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
  'accessories': 'accessories',
  
  // Clothing - Layering system (hiking, snowshoeing, xc skiing)
  'base_layer': 'baseLayer',
  'baselayer': 'baseLayer',
  'base layer': 'baseLayer',
  'mid_layer': 'midLayer',
  'midlayer': 'midLayer',
  'mid layer': 'midLayer',
  'outer_layer': 'outerLayer',
  'outerlayer': 'outerLayer',
  'outer layer': 'outerLayer',
  'jacket': 'outerLayer',
  
  // Clothing - Cycling
  'helmet': 'helmet',
  'jersey': 'tops',        // Cycling uses 'tops' key for jerseys
  'bibs': 'bottoms',       // Cycling uses 'bottoms' key for bibs
  'bib': 'bottoms',
  'bib_shorts': 'bottoms',
  'arm_warmers': 'armWarmers',
  'armwarmers': 'armWarmers',
  'arm warmers': 'armWarmers',
  'leg_warmers': 'armWarmers', // Cycling combines arm/leg warmers under armWarmers key
  'legwarmers': 'armWarmers',
  'leg warmers': 'armWarmers',
  'eyewear': 'eyewear',
  
  // Clothing - Winter/hiking specific
  'boots': 'boots',
  'gaiters': 'gaiters',
  'poles': 'poles',
  'pack': 'pack',
  
  // Clothing - Trail running
  'hydration': 'hydration',
};

interface ParseResult {
  success: boolean;
  records: RunRecord[];
  // Records grouped by activity (when activity column is present)
  recordsByActivity: Record<ActivityType, RunRecord[]>;
  hasActivityColumn: boolean;
  errors: string[];
  warnings: string[];
}

export function parseCSV(csvContent: string): ParseResult {
  const result: ParseResult = {
    success: false,
    records: [],
    recordsByActivity: {
      running: [],
      hiking: [],
      cycling: [],
      walking: [],
      trail_running: [],
      snowshoeing: [],
      cross_country_skiing: []
    },
    hasActivityColumn: false,
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

  // Check if activity column is present
  result.hasActivityColumn = foundFields.has('activity');

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      const { record, activity } = createRunRecordWithActivity(values, columnMap);
      
      if (record) {
        result.records.push(record);
        
        // If activity column exists, group by activity
        if (result.hasActivityColumn && activity && VALID_ACTIVITIES.includes(activity)) {
          result.recordsByActivity[activity].push(record);
        }
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

// Parse activity string to ActivityType (handles various formats)
function parseActivity(activityStr: string): ActivityType | null {
  const normalized = activityStr.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Map common variations to valid ActivityType
  const activityMap: Record<string, ActivityType> = {
    'running': 'running',
    'run': 'running',
    'trail_running': 'trail_running',
    'trailrunning': 'trail_running',
    'trail running': 'trail_running',
    'hiking': 'hiking',
    'hike': 'hiking',
    'walking': 'walking',
    'walk': 'walking',
    'cycling': 'cycling',
    'cycle': 'cycling',
    'bike': 'cycling',
    'biking': 'cycling',
    'snowshoeing': 'snowshoeing',
    'snowshoe': 'snowshoeing',
    'cross_country_skiing': 'cross_country_skiing',
    'crosscountryskiing': 'cross_country_skiing',
    'xc_skiing': 'cross_country_skiing',
    'xcskiing': 'cross_country_skiing',
    'xc skiing': 'cross_country_skiing',
    'nordic_skiing': 'cross_country_skiing',
  };
  
  return activityMap[normalized] || null;
}

function createRunRecordWithActivity(
  values: string[],
  columnMap: Record<number, string>
): { record: RunRecord | null; activity: ActivityType | null } {
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

  // Parse activity if present
  const activity = data.activity ? parseActivity(data.activity) : null;

  // Parse numeric fields with defaults
  const parseNum = (val: string | undefined, defaultVal: number = 0): number => {
    if (!val || val === '') return defaultVal;
    const num = parseFloat(val);
    return isNaN(num) ? defaultVal : num;
  };

  // Create clothing object with all possible fields
  // Only include fields that have values
  const clothing: ClothingItems = {};
  
  // Common fields
  if (data.headCover) clothing.headCover = data.headCover;
  if (data.tops) clothing.tops = data.tops;
  if (data.bottoms) clothing.bottoms = data.bottoms;
  if (data.shoes) clothing.shoes = data.shoes;
  if (data.socks) clothing.socks = data.socks;
  if (data.gloves) clothing.gloves = data.gloves;
  if (data.rainGear) clothing.rainGear = data.rainGear;
  if (data.accessories) clothing.accessories = data.accessories;
  
  // Layering system (hiking, snowshoeing, xc skiing)
  if (data.baseLayer) clothing.baseLayer = data.baseLayer;
  if (data.midLayer) clothing.midLayer = data.midLayer;
  if (data.outerLayer) clothing.outerLayer = data.outerLayer;
  
  // Cycling
  if (data.helmet) clothing.helmet = data.helmet;
  if (data.armWarmers) clothing.armWarmers = data.armWarmers;
  if (data.eyewear) clothing.eyewear = data.eyewear;
  
  // Winter/hiking specific
  if (data.boots) clothing.boots = data.boots;
  if (data.gaiters) clothing.gaiters = data.gaiters;
  if (data.poles) clothing.poles = data.poles;
  if (data.pack) clothing.pack = data.pack;
  
  // Trail running
  if (data.hydration) clothing.hydration = data.hydration;

  const record: RunRecord = {
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
    clothing,
    // Include comfort and comments if present
    ...(data.comfort && { comfort: data.comfort }),
    ...(data.comments && { comments: data.comments })
  };

  return { record, activity };
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

