import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { parseCSV, validateCSVFile, readFileAsText } from '../services/csvParser';
import { addRuns, clearAllRuns, getRunCount, clearAllFeedback } from '../services/database';
import type { ActivityType } from '../types';
import { ACTIVITY_CONFIGS } from '../types';

const ALL_ACTIVITIES: ActivityType[] = ['running', 'hiking', 'cycling', 'walking', 'trail_running', 'snowshoeing', 'cross_country_skiing'];

interface FileUploadProps {
  onUploadComplete: (count: number) => void;
  existingCount: number;
  activity?: ActivityType;
}

export function FileUpload({ onUploadComplete, existingCount, activity = 'running' }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [replaceMode, setReplaceMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setWarnings([]);
    setIsProcessing(true);

    try {
      // Validate file
      const validation = validateCSVFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setIsProcessing(false);
        return;
      }

      // Read file content
      const content = await readFileAsText(file);

      // Parse CSV
      const result = parseCSV(content);

      if (!result.success) {
        setError(result.errors.join('. '));
        setIsProcessing(false);
        return;
      }

      if (result.warnings.length > 0) {
        setWarnings(result.warnings);
      }

      // Clear existing data if replace mode
      if (replaceMode) {
        await clearAllRuns();
        await clearAllFeedback();
      }

      // Check if CSV has activity column (multi-activity import)
      if (result.hasActivityColumn) {
        // Import records grouped by activity
        let totalImported = 0;
        for (const act of ALL_ACTIVITIES) {
          const activityRecords = result.recordsByActivity[act];
          if (activityRecords.length > 0) {
            const recordsWithActivity = activityRecords.map(record => ({
              ...record,
              activity: act
            }));
            await addRuns(recordsWithActivity);
            totalImported += activityRecords.length;
          }
        }
        
        // Show how many were imported to which activities
        const summary = ALL_ACTIVITIES
          .filter(act => result.recordsByActivity[act].length > 0)
          .map(act => `${ACTIVITY_CONFIGS[act].name}: ${result.recordsByActivity[act].length}`)
          .join(', ');
        if (summary) {
          result.warnings.push(`Imported by activity: ${summary}`);
          setWarnings([...result.warnings]);
        }
      } else {
        // Single activity import (original behavior)
        const recordsWithActivity = result.records.map(record => ({
          ...record,
          activity
        }));
        await addRuns(recordsWithActivity);
      }

      // Get new total count
      const newCount = await getRunCount();
      onUploadComplete(newCount);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const activityConfig = ACTIVITY_CONFIGS[activity];

  return (
    <div className="animate-fade-in">
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload {activityConfig.name} History
        </h2>
        
        <div className="mb-4 p-2 bg-[rgba(249,115,22,0.1)] rounded-lg flex items-center gap-2 text-sm">
          <span className="text-xl">{activityConfig.icon}</span>
          <span className="text-[var(--color-accent)]">
            Uploading data for: <strong>{activityConfig.name}</strong>
          </span>
        </div>

        {existingCount > 0 && (
          <div className="mb-4 p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <p className="text-sm text-[var(--color-text-muted)] mb-2">
              You have <span className="font-semibold text-[var(--color-text)]">{existingCount}</span> runs stored
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceMode}
                onChange={(e) => setReplaceMode(e.target.checked)}
                className="w-4 h-4 accent-[var(--color-accent)]"
              />
              <span className="text-sm">Replace existing data</span>
            </label>
          </div>
        )}

        <div
          className={`drop-zone ${isDragging ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
          
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="spinner animate-spin"></div>
              <span className="text-[var(--color-text-muted)]">Processing...</span>
            </div>
          ) : (
            <>
              <svg className="w-12 h-12 mx-auto mb-3 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium mb-1">
                {isDragging ? 'Drop your CSV file' : 'Tap to select CSV file'}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                or drag and drop here
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-[rgba(239,68,68,0.2)] border border-[var(--color-error)] rounded-lg">
            <p className="text-[var(--color-error)] text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-4 p-3 bg-[rgba(234,179,8,0.2)] border border-[var(--color-warning)] rounded-lg">
            <p className="text-[var(--color-warning)] text-sm font-medium mb-1">Warnings:</p>
            <ul className="text-[var(--color-warning)] text-sm opacity-80 list-disc list-inside">
              {warnings.slice(0, 3).map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
              {warnings.length > 3 && (
                <li>...and {warnings.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-3 text-[var(--color-text-muted)]">Expected CSV Format</h3>
        <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4 overflow-x-auto">
          <code className="text-xs font-mono text-[var(--color-accent-light)] whitespace-pre">
{`date,time,activity,temperature,feels_like,humidity,...
2025-12-11,06:30,running,45,42,65,...
2025-12-11,07:00,cycling,50,48,55,...`}
          </code>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          Required: date, temperature. Optional: activity (for multi-activity import), time, location, clothing columns.
        </p>
        <p className="text-xs text-[var(--color-accent)] mt-2">
          💡 Tip: Use "Export All" to get a CSV with all your activities, then import it on another device!
        </p>
      </div>
    </div>
  );
}

