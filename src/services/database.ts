import Dexie, { type EntityTable } from 'dexie';
import type { RunRecord, AppSettings, RunFeedback, CustomClothingOptions, ActivityType } from '../types';

// Define the database
const db = new Dexie('RunnersWardrobeDB') as Dexie & {
  runs: EntityTable<RunRecord, 'id'>;
  settings: EntityTable<AppSettings, 'id'>;
  feedback: EntityTable<RunFeedback, 'id'>;
  customClothing: EntityTable<CustomClothingOptions, 'id'>;
};

// Define schema
db.version(1).stores({
  runs: '++id, date, time, location, temperature',
  settings: '++id'
});

db.version(2).stores({
  runs: '++id, date, time, location, temperature',
  settings: '++id',
  feedback: '++id, date, temperature, comfort'
});

// Version 3 adds custom clothing options
db.version(3).stores({
  runs: '++id, date, time, location, temperature',
  settings: '++id',
  feedback: '++id, date, temperature, comfort',
  customClothing: '++id, category'
});

// Version 4 adds activity type to runs, feedback, and customClothing
db.version(4).stores({
  runs: '++id, date, time, location, temperature, activity',
  settings: '++id',
  feedback: '++id, date, temperature, comfort, activity',
  customClothing: '++id, category, activity'
});

// Run records operations
export async function addRuns(runs: RunRecord[]): Promise<void> {
  await db.runs.bulkAdd(runs);
}

export async function getAllRuns(activity?: ActivityType): Promise<RunRecord[]> {
  if (activity) {
    return await db.runs.where('activity').equals(activity).toArray();
  }
  return await db.runs.toArray();
}

export async function clearAllRuns(): Promise<void> {
  await db.runs.clear();
}

export async function getRunCount(): Promise<number> {
  return await db.runs.count();
}

export async function getRunsByTemperatureRange(
  minTemp: number,
  maxTemp: number
): Promise<RunRecord[]> {
  return await db.runs
    .where('temperature')
    .between(minTemp, maxTemp)
    .toArray();
}

export async function deleteRun(id: number): Promise<void> {
  await db.runs.delete(id);
}

// Settings operations
export async function getSettings(): Promise<AppSettings | undefined> {
  const settings = await db.settings.toArray();
  return settings[0];
}

export async function saveSettings(settings: Omit<AppSettings, 'id'>): Promise<void> {
  const existing = await db.settings.toArray();
  if (existing.length > 0) {
    await db.settings.update(existing[0].id!, settings);
  } else {
    await db.settings.add(settings as AppSettings);
  }
}

export async function clearSettings(): Promise<void> {
  await db.settings.clear();
}

// Onboarding helpers
export async function isOnboardingComplete(): Promise<boolean> {
  const settings = await getSettings();
  return settings?.onboardingComplete === true;
}

export async function setOnboardingComplete(): Promise<void> {
  const settings = await getSettings();
  if (settings) {
    await saveSettings({ ...settings, onboardingComplete: true });
  } else {
    await saveSettings({
      weatherApiKey: '',
      temperatureUnit: 'celsius',
      onboardingComplete: true
    });
  }
}

// Feedback operations
export async function addFeedback(feedback: Omit<RunFeedback, 'id'>): Promise<void> {
  await db.feedback.add(feedback as RunFeedback);
}

export async function getAllFeedback(activity?: ActivityType): Promise<RunFeedback[]> {
  if (activity) {
    return await db.feedback.where('activity').equals(activity).toArray();
  }
  return await db.feedback.toArray();
}

export async function getFeedbackByTemperatureRange(
  minTemp: number,
  maxTemp: number
): Promise<RunFeedback[]> {
  return await db.feedback
    .where('temperature')
    .between(minTemp, maxTemp)
    .toArray();
}

export async function clearAllFeedback(): Promise<void> {
  await db.feedback.clear();
}

export async function getFeedbackCount(): Promise<number> {
  return await db.feedback.count();
}

export async function deleteFeedback(id: number): Promise<void> {
  await db.feedback.delete(id);
}

// Custom clothing options operations
export async function getCustomClothingOptions(category: string, activity?: ActivityType): Promise<string[]> {
  // Build compound key for activity-specific options
  const key = activity ? `${activity}:${category}` : category;
  const record = await db.customClothing.where('category').equals(key).first();
  return record?.options || [];
}

export async function addCustomClothingOption(category: string, option: string, activity?: ActivityType): Promise<void> {
  const key = activity ? `${activity}:${category}` : category;
  const existing = await db.customClothing.where('category').equals(key).first();
  if (existing) {
    const options = existing.options || [];
    if (!options.includes(option)) {
      options.push(option);
      await db.customClothing.update(existing.id!, { options });
    }
  } else {
    await db.customClothing.add({ category: key, options: [option], activity });
  }
}

export async function deleteCustomClothingOption(category: string, option: string, activity?: ActivityType): Promise<void> {
  const key = activity ? `${activity}:${category}` : category;
  const existing = await db.customClothing.where('category').equals(key).first();
  if (existing) {
    const options = existing.options.filter(opt => opt !== option);
    if (options.length > 0) {
      await db.customClothing.update(existing.id!, { options });
    } else {
      // No options left, delete the record
      await db.customClothing.delete(existing.id!);
    }
  }
}

export async function getAllCustomClothingOptions(): Promise<Record<string, string[]>> {
  const all = await db.customClothing.toArray();
  const result: Record<string, string[]> = {};
  for (const record of all) {
    result[record.category] = record.options;
  }
  return result;
}

// Export history as CSV
export async function exportHistoryAsCSV(activity?: ActivityType): Promise<string> {
  const [runs, feedbackData] = await Promise.all([
    getAllRuns(activity),
    getAllFeedback(activity)
  ]);

  // Combine all records
  interface ExportRecord {
    date: string;
    time: string;
    source: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    cloudCover: number;
    comfort?: string;
    comments?: string;
    clothing: Record<string, string>;
  }

  const allRecords: ExportRecord[] = [];

  // Add CSV runs
  for (const run of runs) {
    allRecords.push({
      date: run.date,
      time: run.time || '',
      source: 'imported',
      temperature: run.temperature,
      feelsLike: run.feelsLike,
      humidity: run.humidity,
      windSpeed: run.windSpeed,
      precipitation: run.precipitation,
      cloudCover: run.cloudCover,
      clothing: run.clothing
    });
  }

  // Add feedback runs
  for (const fb of feedbackData) {
    allRecords.push({
      date: fb.date,
      time: new Date(fb.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      source: 'recorded',
      temperature: fb.temperature,
      feelsLike: fb.feelsLike,
      humidity: fb.humidity,
      windSpeed: fb.windSpeed,
      precipitation: fb.precipitation,
      cloudCover: fb.cloudCover,
      comfort: fb.comfort,
      comments: fb.comments,
      clothing: fb.clothing
    });
  }

  // Sort by date descending
  allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allRecords.length === 0) {
    return '';
  }

  // Get all unique clothing keys
  const clothingKeys = new Set<string>();
  for (const record of allRecords) {
    Object.keys(record.clothing).forEach(key => clothingKeys.add(key));
  }
  const clothingKeysArray = Array.from(clothingKeys).sort();

  // Build CSV header
  const headers = [
    'date',
    'time',
    'source',
    'temperature',
    'feels_like',
    'humidity',
    'wind_speed',
    'precipitation',
    'cloud_cover',
    'comfort',
    'comments',
    ...clothingKeysArray.map(k => k.replace(/([A-Z])/g, '_$1').toLowerCase())
  ];

  // Build CSV rows
  const rows = allRecords.map(record => {
    const clothingValues = clothingKeysArray.map(key => 
      escapeCSVValue(record.clothing[key] || '')
    );
    return [
      record.date,
      record.time,
      record.source,
      record.temperature,
      record.feelsLike,
      record.humidity,
      record.windSpeed,
      record.precipitation,
      record.cloudCover,
      record.comfort || '',
      record.comments || '',
      ...clothingValues
    ].map(v => escapeCSVValue(String(v))).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Export ALL activities' history as a single CSV
export async function exportAllHistoryAsCSV(): Promise<string> {
  const activities: ActivityType[] = ['running', 'hiking', 'cycling', 'walking', 'trailRunning', 'snowshoeing', 'xcSkiing'];
  
  interface ExportRecord {
    date: string;
    time: string;
    activity: string;
    source: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    cloudCover: number;
    comfort?: string;
    comments?: string;
    clothing: Record<string, string>;
  }

  const allRecords: ExportRecord[] = [];

  // Gather data from all activities
  for (const activity of activities) {
    const [runs, feedbackData] = await Promise.all([
      getAllRuns(activity),
      getAllFeedback(activity)
    ]);

    // Add CSV runs
    for (const run of runs) {
      allRecords.push({
        date: run.date,
        time: run.time || '',
        activity,
        source: 'imported',
        temperature: run.temperature,
        feelsLike: run.feelsLike,
        humidity: run.humidity,
        windSpeed: run.windSpeed,
        precipitation: run.precipitation,
        cloudCover: run.cloudCover,
        clothing: run.clothing
      });
    }

    // Add feedback runs
    for (const fb of feedbackData) {
      allRecords.push({
        date: fb.date,
        time: new Date(fb.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        activity,
        source: 'recorded',
        temperature: fb.temperature,
        feelsLike: fb.feelsLike,
        humidity: fb.humidity,
        windSpeed: fb.windSpeed,
        precipitation: fb.precipitation,
        cloudCover: fb.cloudCover,
        comfort: fb.comfort,
        comments: fb.comments,
        clothing: fb.clothing
      });
    }
  }

  // Sort by date descending
  allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allRecords.length === 0) {
    return '';
  }

  // Get all unique clothing keys across all activities
  const clothingKeys = new Set<string>();
  for (const record of allRecords) {
    Object.keys(record.clothing).forEach(key => clothingKeys.add(key));
  }
  const clothingKeysArray = Array.from(clothingKeys).sort();

  // Build CSV header
  const headers = [
    'date',
    'time',
    'activity',
    'source',
    'temperature',
    'feels_like',
    'humidity',
    'wind_speed',
    'precipitation',
    'cloud_cover',
    'comfort',
    'comments',
    ...clothingKeysArray.map(k => k.replace(/([A-Z])/g, '_$1').toLowerCase())
  ];

  // Build CSV rows
  const rows = allRecords.map(record => {
    const clothingValues = clothingKeysArray.map(key => 
      escapeCSVValue(record.clothing[key] || '')
    );
    return [
      record.date,
      record.time,
      record.activity,
      record.source,
      record.temperature,
      record.feelsLike,
      record.humidity,
      record.windSpeed,
      record.precipitation,
      record.cloudCover,
      record.comfort || '',
      record.comments || '',
      ...clothingValues
    ].map(v => escapeCSVValue(String(v))).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Export database instance for direct access if needed
export { db };
