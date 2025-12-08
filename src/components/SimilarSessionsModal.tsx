import type { RunRecord, ClothingItems } from '../types';
import { formatTemperature, formatWindSpeed } from '../services/temperatureUtils';
import type { TemperatureUnit } from '../services/temperatureUtils';

interface SimilarSessionsModalProps {
  sessions: RunRecord[];
  currentTemp: number;
  temperatureUnit: TemperatureUnit;
  activityName: string;
  onClose: () => void;
}

export function SimilarSessionsModal({ 
  sessions, 
  currentTemp,
  temperatureUnit, 
  activityName,
  onClose 
}: SimilarSessionsModalProps) {
  
  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const date = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        );
        return date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getClothingSummary = (clothing: ClothingItems): string => {
    const items: string[] = [];
    if (clothing.tops && clothing.tops !== 'None') items.push(clothing.tops);
    if (clothing.bottoms && clothing.bottoms !== 'None') items.push(clothing.bottoms);
    if (clothing.outerLayer && clothing.outerLayer !== 'None') items.push(clothing.outerLayer);
    return items.slice(0, 3).join(', ') || 'No data';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[var(--color-surface)] rounded-2xl animate-slide-up shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold">Similar Sessions</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Past {activityName.toLowerCase()}s in similar weather
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current weather reference */}
        <div className="px-4 py-3 bg-[rgba(59,130,246,0.1)] border-b border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-text-muted)]">Current:</span>
            <span className="font-semibold text-[var(--color-accent)]">
              {formatTemperature(currentTemp, temperatureUnit)}
            </span>
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-muted)]">
                No similar sessions found yet.
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">
                Complete more {activityName.toLowerCase()}s to see comparisons!
              </p>
            </div>
          ) : (
            sessions.map((session, index) => (
              <SessionCard 
                key={index}
                session={session}
                temperatureUnit={temperatureUnit}
                formatDate={formatDate}
                getClothingSummary={getClothingSummary}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.1)] flex-shrink-0">
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            Recommendations are based on what worked in similar conditions
          </p>
        </div>
      </div>
    </div>
  );
}

interface SessionCardProps {
  session: RunRecord;
  temperatureUnit: TemperatureUnit;
  formatDate: (date: string) => string;
  getClothingSummary: (clothing: ClothingItems) => string;
}

function SessionCard({ session, temperatureUnit, formatDate, getClothingSummary }: SessionCardProps) {
  const getComfortEmoji = (comfort?: string) => {
    switch (comfort) {
      case 'too_cold': return '🥶';
      case 'just_right': return '👍';
      case 'too_hot': return '🥵';
      default: return null;
    }
  };

  // Check if this is feedback data (has comfort field)
  const comfort = (session as { comfort?: string }).comfort;

  return (
    <div className="p-3 bg-[rgba(255,255,255,0.05)] rounded-xl border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[var(--color-accent)]">
              {formatTemperature(session.temperature, temperatureUnit)}
            </span>
            {comfort && (
              <span className="text-lg" title={comfort}>
                {getComfortEmoji(comfort)}
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            feels like {formatTemperature(session.feelsLike, temperatureUnit)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-[var(--color-text-muted)]">
            {formatDate(session.date)}
          </div>
          {session.location && session.location !== 'Unknown' && session.location !== 'From feedback' && (
            <div className="text-xs text-[var(--color-text-muted)]">
              {session.location.split(',')[0]}
            </div>
          )}
        </div>
      </div>

      {/* Weather conditions */}
      <div className="flex gap-3 text-xs text-[var(--color-text-muted)] mb-2">
        <span>💨 {formatWindSpeed(session.windSpeed, temperatureUnit)}</span>
        <span>💧 {session.humidity}%</span>
        {session.precipitation > 0 && <span>🌧️ {session.precipitation}mm</span>}
      </div>

      {/* Clothing summary */}
      <div className="text-sm">
        <span className="text-[var(--color-text-muted)]">Wore: </span>
        <span>{getClothingSummary(session.clothing)}</span>
      </div>
    </div>
  );
}

