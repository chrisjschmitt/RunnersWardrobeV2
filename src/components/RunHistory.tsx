import { useState, useEffect } from 'react';
import type { RunRecord } from '../types';
import { getAllRuns, clearAllRuns } from '../services/database';
import { formatTemperature, type TemperatureUnit } from '../services/temperatureUtils';

interface RunHistoryProps {
  onDataCleared: () => void;
  temperatureUnit: TemperatureUnit;
}

export function RunHistory({ onDataCleared, temperatureUnit }: RunHistoryProps) {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setIsLoading(true);
    try {
      const data = await getAllRuns();
      // Sort by date descending
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRuns(data);
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    await clearAllRuns();
    setRuns([]);
    setShowConfirmClear(false);
    onDataCleared();
  };

  const filteredRuns = runs.filter(run => {
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    return (
      run.date.toLowerCase().includes(searchLower) ||
      run.location.toLowerCase().includes(searchLower) ||
      run.clothing.tops.toLowerCase().includes(searchLower) ||
      run.clothing.bottoms.toLowerCase().includes(searchLower)
    );
  });

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
            Run History
          </h2>
          <span className="text-sm text-[var(--color-text-muted)]">
            {runs.length} runs
          </span>
        </div>

        {runs.length > 0 && (
          <>
            <input
              type="text"
              placeholder="Search by date, location, or clothing..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmClear(true)}
                className="btn-secondary text-[var(--color-error)] border-[var(--color-error)]"
              >
                Clear All Data
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
          <p className="text-[var(--color-text-muted)]">No running history yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Upload a CSV file to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRuns.map((run, index) => (
            <RunCard key={run.id || index} run={run} index={index} temperatureUnit={temperatureUnit} />
          ))}
          {filteredRuns.length === 0 && filter && (
            <div className="glass-card p-6 text-center">
              <p className="text-[var(--color-text-muted)]">No runs match your search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RunCardProps {
  run: RunRecord;
  index: number;
  temperatureUnit: TemperatureUnit;
}

function RunCard({ run, index, temperatureUnit }: RunCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
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
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[var(--color-accent)]">
              {formatTemperature(run.temperature, temperatureUnit)}
            </span>
            <span className="text-[var(--color-text-muted)]">
              feels like {formatTemperature(run.feelsLike, temperatureUnit)}
            </span>
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
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-[var(--color-text-muted)]">Humidity:</span> {run.humidity}%
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Wind:</span> {run.windSpeed} mph
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
            <div><span className="text-[var(--color-text-muted)]">Head:</span> {run.clothing.headCover}</div>
            <div><span className="text-[var(--color-text-muted)]">Top:</span> {run.clothing.tops}</div>
            <div><span className="text-[var(--color-text-muted)]">Bottom:</span> {run.clothing.bottoms}</div>
            <div><span className="text-[var(--color-text-muted)]">Shoes:</span> {run.clothing.shoes}</div>
            <div><span className="text-[var(--color-text-muted)]">Socks:</span> {run.clothing.socks}</div>
            <div><span className="text-[var(--color-text-muted)]">Gloves:</span> {run.clothing.gloves}</div>
            <div className="col-span-2"><span className="text-[var(--color-text-muted)]">Rain:</span> {run.clothing.rainGear}</div>
          </div>
        </div>
      )}
    </div>
  );
}
