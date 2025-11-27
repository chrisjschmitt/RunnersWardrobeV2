import Dexie, { type EntityTable } from 'dexie';
import type { RunRecord, AppSettings, RunFeedback } from '../types';

// Define the database
const db = new Dexie('RunnersWardrobeDB') as Dexie & {
  runs: EntityTable<RunRecord, 'id'>;
  settings: EntityTable<AppSettings, 'id'>;
  feedback: EntityTable<RunFeedback, 'id'>;
};

// Define schema - version 2 adds feedback table
db.version(1).stores({
  runs: '++id, date, time, location, temperature',
  settings: '++id'
});

db.version(2).stores({
  runs: '++id, date, time, location, temperature',
  settings: '++id',
  feedback: '++id, date, temperature, comfort'
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

// Export database instance for direct access if needed
export { db };
