import Dexie, { type EntityTable } from 'dexie';
import type { RunRecord, AppSettings, RunFeedback, CustomClothingOptions } from '../types';

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

// Run records operations
export async function addRuns(runs: RunRecord[]): Promise<void> {
  await db.runs.bulkAdd(runs);
}

export async function getAllRuns(): Promise<RunRecord[]> {
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

// Feedback operations
export async function addFeedback(feedback: Omit<RunFeedback, 'id'>): Promise<void> {
  await db.feedback.add(feedback as RunFeedback);
}

export async function getAllFeedback(): Promise<RunFeedback[]> {
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
export async function getCustomClothingOptions(category: string): Promise<string[]> {
  const record = await db.customClothing.where('category').equals(category).first();
  return record?.options || [];
}

export async function addCustomClothingOption(category: string, option: string): Promise<void> {
  const existing = await db.customClothing.where('category').equals(category).first();
  if (existing) {
    const options = existing.options || [];
    if (!options.includes(option)) {
      options.push(option);
      await db.customClothing.update(existing.id!, { options });
    }
  } else {
    await db.customClothing.add({ category, options: [option] });
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

// Export database instance for direct access if needed
export { db };
