import { useState, useEffect } from 'react';
import type { RunRecord, RunFeedback, ActivityType } from '../types';
import { ACTIVITY_CONFIGS } from '../types';
import { getAllRuns, clearAllRuns, getAllFeedback, clearAllFeedback, deleteRun, deleteFeedback, exportAllHistoryAsCSV } from '../services/database';
import { resetSessionCount, getSessionCount } from './BackupReminder';
import { formatTemperature, formatWindSpeed, type TemperatureUnit } from '../services/temperatureUtils';

// Extended type to track source
interface DisplayRun extends RunRecord {
  source: 'csv' | 'feedback';
  comfort?: string;
  comments?: string;
}

interface RunHistoryProps {
  onDataCleared: () => void;
  temperatureUnit: TemperatureUnit;
  activity?: ActivityType;
}

export function RunHistory({ onDataCleared, temperatureUnit, activity = 'running' }: RunHistoryProps) {
  const activityConfig = ACTIVITY_CONFIGS[activity];
  const [runs, setRuns] = useState<DisplayRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [filter, setFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'csv' | 'feedback'>('all');
  const [sessionsSinceBackup, setSessionsSinceBackup] = useState(0);

  // Load session count on mount and when activity changes
  useEffect(() => {
    setSessionsSinceBackup(getSessionCount());
  }, [activity]);

  useEffect(() => {
    const loadRuns = async () => {
      setIsLoading(true);
      try {
        // Load both CSV runs and feedback runs (filtered by activity)
        const [csvData, feedbackData] = await Promise.all([
          getAllRuns(activity),
          getAllFeedback(activity)
        ]);
        
        // Convert CSV runs
        const csvRuns: DisplayRun[] = csvData.map(run => ({
          ...run,
          source: 'csv' as const
        }));
        
        // Convert feedback to DisplayRun format
        const feedbackRuns: DisplayRun[] = feedbackData.map((fb: RunFeedback) => ({
          id: fb.id,
          date: fb.date,
          time: new Date(fb.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          location: 'Current Location',
          temperature: fb.temperature,
          feelsLike: fb.feelsLike,
          humidity: fb.humidity,
          pressure: 0,
          precipitation: fb.precipitation,
          uvIndex: 0,
          windSpeed: fb.windSpeed,
          cloudCover: fb.cloudCover,
          clothing: fb.clothing,
          source: 'feedback' as const,
          comfort: fb.comfort,
          comments: fb.comments
        }));
        
        // Combine and sort by date descending
        const allRuns = [...csvRuns, ...feedbackRuns];
        // Parse dates as local time for proper sorting
        const parseLocalDate = (dateStr: string) => {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
          }
          return new Date(dateStr).getTime();
        };
        allRuns.sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));
        setRuns(allRuns);
      } catch (error) {
        console.error('Failed to load runs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRuns();
  }, [activity]);

  const handleClearAll = async () => {
    await Promise.all([clearAllRuns(), clearAllFeedback()]);
    setRuns([]);
    setShowConfirmClear(false);
    onDataCleared();
  };

  const handleDeleteRun = async (run: DisplayRun) => {
    if (!run.id) return;
    
    if (run.source === 'csv') {
      await deleteRun(run.id);
    } else {
      await deleteFeedback(run.id);
    }
    
    // Remove from local state
    setRuns(prev => prev.filter(r => !(r.id === run.id && r.source === run.source)));
  };

  const handleExportCSV = async () => {
    try {
      const csv = await exportAllHistoryAsCSV();
      if (!csv) {
        alert('No data to export');
        return;
      }
      
      const filename = `all-activities-history-${new Date().toISOString().split('T')[0]}.csv`;
      await downloadCSV(csv, filename);
      
      // Reset session count for backup reminder
      resetSessionCount();
      setSessionsSinceBackup(0);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export data');
    }
  };

  // Helper function to download CSV (handles iOS Share API and desktop download)
  const downloadCSV = async (csv: string, filename: string) => {
    // Use application/octet-stream for better iOS Files app compatibility
    const blob = new Blob([csv], { type: 'application/octet-stream' });
    
    // Try Web Share API first (works best on iOS)
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: 'application/octet-stream' });
      const shareData = { files: [file] };
      
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (shareError) {
          // User cancelled or share failed, fall through to download
          if ((shareError as Error).name === 'AbortError') {
            return; // User cancelled, don't show error
          }
        }
      }
    }
    
    // Fallback: Standard download (works on desktop)
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredRuns = runs.filter(run => {
    // First apply source filter
    if (sourceFilter !== 'all' && run.source !== sourceFilter) return false;
    
    // Then apply text filter
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    return (
      run.date.toLowerCase().includes(searchLower) ||
      run.location.toLowerCase().includes(searchLower) ||
      run.clothing.tops.toLowerCase().includes(searchLower) ||
      run.clothing.bottoms.toLowerCase().includes(searchLower)
    );
  });

  const csvCount = runs.filter(r => r.source === 'csv').length;
  const feedbackCount = runs.filter(r => r.source === 'feedback').length;

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="spinner animate-spin"></div>
          <span className="text-[var(--color-text-muted)]">Loading history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {activityConfig.name} History
          </h2>
          <span className="text-sm text-[var(--color-text-muted)]">
            {runs.length} runs
          </span>
        </div>

        {/* Export button - always visible since it exports ALL activities */}
        <div className="mb-4">
          {/* Backup status indicator */}
          <div className={`mb-2 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
            sessionsSinceBackup >= 5 
              ? 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)]' 
              : sessionsSinceBackup >= 3
                ? 'bg-[rgba(234,179,8,0.15)] text-[var(--color-warning)]'
                : 'bg-[rgba(34,197,94,0.15)] text-[var(--color-success)]'
          }`}>
            <span>{sessionsSinceBackup >= 5 ? '🔴' : sessionsSinceBackup >= 3 ? '⚠️' : '✓'}</span>
            <span>
              {sessionsSinceBackup === 0 
                ? 'Data backed up' 
                : `${sessionsSinceBackup} session${sessionsSinceBackup !== 1 ? 's' : ''} since last backup`}
              {sessionsSinceBackup >= 5 && ' — time to export!'}
            </span>
          </div>
          <button
            onClick={handleExportCSV}
            className="btn-secondary flex items-center gap-2"
            title="Export all activities to CSV (backup your data)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export All Activities
          </button>
        </div>

        {runs.length > 0 && (
          <>
            {/* Source filter tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sourceFilter === 'all' 
                    ? 'bg-[var(--color-accent)] text-white' 
                    : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
                }`}
              >
                All ({runs.length})
              </button>
              <button
                onClick={() => setSourceFilter('feedback')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sourceFilter === 'feedback' 
                    ? 'bg-[var(--color-accent)] text-white' 
                    : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
                }`}
              >
                My {activityConfig.name} ({feedbackCount})
              </button>
              <button
                onClick={() => setSourceFilter('csv')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sourceFilter === 'csv' 
                    ? 'bg-[var(--color-accent)] text-white' 
                    : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.15)]'
                }`}
              >
                Imported ({csvCount})
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by date, location, or clothing..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field mb-4"
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowConfirmClear(true)}
                className="btn-secondary text-[var(--color-error)] border-[var(--color-error)]"
              >
                Clear All
              </button>
            </div>
          </>
        )}
      </div>

      {showConfirmClear && (
        <div className="glass-card p-6 mb-4 border border-[var(--color-error)]">
          <p className="text-[var(--color-error)] font-medium mb-4">
            Are you sure you want to delete all {runs.length} runs? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={handleClearAll} className="btn-primary bg-[var(--color-error)]">
              Yes, Delete All
            </button>
            <button onClick={() => setShowConfirmClear(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {runs.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-[var(--color-text-muted)]">No {activityConfig.name.toLowerCase()} history yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Upload a CSV file or complete a session to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRuns.map((run, index) => (
            <RunCard 
              key={`${run.source}-${run.id || index}`} 
              run={run} 
              index={index} 
              temperatureUnit={temperatureUnit}
              onDelete={handleDeleteRun}
              activityName={activityConfig.name}
              clothingCategories={activityConfig.clothingCategories}
            />
          ))}
          {filteredRuns.length === 0 && (filter || sourceFilter !== 'all') && (
            <div className="glass-card p-6 text-center">
              <p className="text-[var(--color-text-muted)]">No runs match your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ClothingCategory {
  key: string;
  label: string;
  defaultValue: string;
  options: string[];
}

interface RunCardProps {
  run: DisplayRun;
  index: number;
  temperatureUnit: TemperatureUnit;
  onDelete: (run: DisplayRun) => void;
  activityName: string;
  clothingCategories: ClothingCategory[];
}

function RunCard({ run, index, temperatureUnit, onDelete, activityName, clothingCategories }: RunCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const formatDate = (dateStr: string) => {
    try {
      // Parse date string as LOCAL time, not UTC
      // "2024-12-02" should be Dec 2nd local, not UTC which shows as Dec 1st in US
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const date = new Date(
          parseInt(parts[0]),      // year
          parseInt(parts[1]) - 1,  // month (0-indexed)
          parseInt(parts[2])       // day
        );
        return date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getComfortEmoji = (comfort?: string) => {
    switch (comfort) {
      case 'too_cold': return '🥶';
      case 'just_right': return '👍';
      case 'too_hot': return '🥵';
      default: return null;
    }
  };

  const getComfortLabel = (comfort?: string) => {
    switch (comfort) {
      case 'too_cold': return 'Too Cold';
      case 'just_right': return 'Just Right';
      case 'too_hot': return 'Too Hot';
      default: return null;
    }
  };

  return (
    <div 
      className="glass-card p-4 cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.08)]"
      onClick={() => setIsExpanded(!isExpanded)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-bold text-[var(--color-accent)]">
              {formatTemperature(run.temperature, temperatureUnit)}
            </span>
            <span className="text-[var(--color-text-muted)]">
              feels like {formatTemperature(run.feelsLike, temperatureUnit)}
            </span>
            {/* Source badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              run.source === 'feedback' 
                ? 'bg-[var(--color-success)] text-white' 
                : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)]'
            }`}>
              {run.source === 'feedback' ? `My ${activityName}` : 'Imported'}
            </span>
            {/* Comfort indicator */}
            {run.comfort && (
              <span className="text-sm" title={getComfortLabel(run.comfort) || undefined}>
                {getComfortEmoji(run.comfort)}
              </span>
            )}
            {/* Notes indicator */}
            {run.comments && (
              <span className="text-sm" title="Has notes">
                📝
              </span>
            )}
          </div>
          <div className="text-sm text-[var(--color-text-muted)] mt-1">
            {formatDate(run.date)} {run.time && `at ${run.time}`}
          </div>
          {run.location && run.location !== 'Unknown' && (
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{run.location}</div>
          )}
        </div>
        <svg 
          className={`w-5 h-5 text-[var(--color-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
          {/* Comfort feedback for user runs */}
          {run.comfort && (
            <div className="mb-4 p-3 rounded-lg bg-[rgba(255,255,255,0.05)]">
              <span className="text-sm">
                <span className="text-[var(--color-text-muted)]">How you felt: </span>
                <span className="font-medium">{getComfortEmoji(run.comfort)} {getComfortLabel(run.comfort)}</span>
              </span>
            </div>
          )}

          {/* User comments/notes */}
          {run.comments && (
            <div className="mb-4 p-3 rounded-lg bg-[rgba(255,255,255,0.05)] border-l-2 border-[var(--color-accent)]">
              <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Notes</div>
              <p className="text-sm italic">"{run.comments}"</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-[var(--color-text-muted)]">Humidity:</span> {run.humidity}%
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Wind:</span> {formatWindSpeed(run.windSpeed, temperatureUnit)}
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">UV:</span> {run.uvIndex}
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Clouds:</span> {run.cloudCover}%
            </div>
          </div>

          <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Clothing</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {clothingCategories.map(cat => {
              const value = run.clothing[cat.key];
              if (!value || value === 'None' || value === '') return null;
              return (
                <div key={cat.key}>
                  <span className="text-[var(--color-text-muted)]">{cat.label}:</span> {value}
                </div>
              );
            })}
            {/* Show items that might not be in this activity's categories but exist in the data */}
            {Object.entries(run.clothing).map(([key, value]) => {
              // Skip if already shown or empty
              if (!value || value === 'None' || value === '') return null;
              if (clothingCategories.some(cat => cat.key === key)) return null;
              // Format key as label (camelCase to Title Case)
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return (
                <div key={key}>
                  <span className="text-[var(--color-text-muted)]">{label}:</span> {value}
                </div>
              );
            })}
          </div>

          {/* Delete button */}
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
            {!showDeleteConfirm ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="flex items-center gap-2 text-sm text-[var(--color-error)] hover:text-red-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--color-error)]">Delete this entry?</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(run);
                    setShowDeleteConfirm(false);
                  }}
                  className="px-3 py-1 text-sm bg-[var(--color-error)] text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-3 py-1 text-sm bg-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.15)] transition-colors"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
