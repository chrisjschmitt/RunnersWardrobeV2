import { useState, useMemo } from 'react';
import type { ClothingRecommendation as ClothingRec, ClothingItems, ActivityType, RunRecord, ThermalPreference, WeatherData, ActivityLevel } from '../types';
import { getClothingCategories } from '../types';
import { ClothingPicker } from './ClothingPicker';
import { ClothingInfoModal } from './ClothingInfoModal';
import { getClothingInfo, type ClothingInfo } from '../data/clothingInfo';
import { formatTemperature } from '../services/temperatureUtils';
import type { TemperatureUnit } from '../services/temperatureUtils';
import { calculateComfortTemperature } from '../services/recommendationEngine';
import { generateClothingSuggestions } from '../services/recommendationSuggestions';

// Icons for different clothing categories
const CATEGORY_ICONS: Record<string, string> = {
  headCover: '🧢',
  helmet: '⛑️',
  tops: '👕',
  jersey: '👕',
  baseLayer: '🎽',
  midLayer: '🧥',
  outerLayer: '🧥',
  bottoms: '🩳',
  shoes: '👟',
  boots: '🥾',
  socks: '🧦',
  gloves: '🧤',
  rainGear: '🌧️',
  armWarmers: '💪',
  eyewear: '🕶️',
  hydration: '💧',
  pack: '🎒',
  gaiters: '🦵',
  accessories: '✨',
};

interface ClothingRecommendationProps {
  recommendation: ClothingRec | null;
  fallback: ClothingItems | null;
  currentClothing?: ClothingItems | null;
  isLoading: boolean;
  editable?: boolean;
  onClothingChange?: (clothing: ClothingItems) => void;
  activity?: ActivityType;
  temperatureUnit?: TemperatureUnit;
  thermalPreference?: ThermalPreference;
  weather?: WeatherData;
  activityLevel?: ActivityLevel;
}

export function ClothingRecommendation({ 
  recommendation, 
  fallback,
  currentClothing,
  isLoading,
  editable = false,
  onClothingChange,
  activity = 'running',
  temperatureUnit = 'fahrenheit',
  thermalPreference = 'average',
  weather,
  activityLevel
}: ClothingRecommendationProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showingInfo, setShowingInfo] = useState<ClothingInfo | null>(null);
  const [showSimilarSessions, setShowSimilarSessions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Get categories for this activity
  const categories = getClothingCategories(activity);
  
  // Base clothing from recommendation or fallback
  const baseClothing = recommendation?.clothing || fallback;
  
  // Use currentClothing if provided (preserves user edits), otherwise use base
  const clothing = currentClothing || baseClothing;
  const hasHistory = recommendation !== null;

  // Generate suggestions when confidence is low/medium and weather is available
  const suggestions = useMemo(() => {
    if (!weather || !clothing || !baseClothing) return null;
    if (!hasHistory || !recommendation) return null; // Only suggest when we have a recommendation (not pure fallback)
    if (recommendation.confidence >= 70) return null; // Only suggest for low/medium confidence
    
    return generateClothingSuggestions(
      clothing,
      weather,
      activity,
      thermalPreference,
      activityLevel,
      recommendation.confidence,
      recommendation.matchingRuns
    );
  }, [weather, clothing, baseClothing, hasHistory, recommendation, activity, thermalPreference, activityLevel]);
  
  // Highlight important categories
  const highlightCategories = ['tops', 'jersey', 'bottoms', 'baseLayer', 'outerLayer'];

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="spinner animate-spin"></div>
          <span className="text-[var(--color-text-muted)]">Analyzing your history...</span>
        </div>
      </div>
    );
  }

  if (!clothing || !baseClothing) {
    return null;
  }

  const handleItemClick = (category: string) => {
    if (editable) {
      setEditingCategory(category);
    }
  };

  const handleItemChange = (category: string, value: string) => {
    const newClothing = {
      ...clothing,
      [category]: value
    };
    onClothingChange?.(newClothing);
  };

  const isEdited = (categoryKey: string) => {
    if (!currentClothing || !baseClothing) return false;
    const current = currentClothing[categoryKey]?.toLowerCase() || '';
    const base = baseClothing[categoryKey]?.toLowerCase() || '';
    return current !== base;
  };

  const handleShowInfo = (categoryKey: string, itemName: string) => {
    const info = getClothingInfo(categoryKey, itemName);
    if (info) {
      setShowingInfo(info);
    }
  };

  return (
    <div className="animate-slide-up delay-200">
      {/* Clothing Info Modal */}
      {showingInfo && (
        <ClothingInfoModal 
          info={showingInfo} 
          onClose={() => setShowingInfo(null)} 
        />
      )}

      {/* Clothing Picker Modal */}
      {editingCategory && (
        <ClothingPicker
          category={editingCategory}
          currentValue={clothing[editingCategory] || ''}
          onSelect={(value) => handleItemChange(editingCategory, value)}
          onClose={() => setEditingCategory(null)}
          activity={activity}
        />
      )}

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            What to Wear
          </h2>
          {hasHistory && recommendation && (
            <ConfidenceBadge confidence={recommendation.confidence} />
          )}
        </div>

        {!hasHistory && (
          <div className="mb-4 p-3 bg-[rgba(234,179,8,0.15)] border border-[var(--color-warning)] rounded-lg">
            <p className="text-sm text-[var(--color-warning)]">
              <strong>No history data.</strong> These are general recommendations. Upload your history for personalized suggestions!
            </p>
          </div>
        )}

        {hasHistory && recommendation && (() => {
          // Get confidence color
          let confidenceColor = 'var(--color-error)'; // Low
          let confidenceBgColor = 'rgba(239,68,68,0.15)';
          let confidenceHoverBgColor = 'rgba(239,68,68,0.25)';
          
          if (recommendation.confidence >= 70) {
            confidenceColor = 'var(--color-success)'; // High
            confidenceBgColor = 'rgba(34,197,94,0.15)';
            confidenceHoverBgColor = 'rgba(34,197,94,0.25)';
          } else if (recommendation.confidence >= 40) {
            confidenceColor = 'var(--color-warning)'; // Medium
            confidenceBgColor = 'rgba(234,179,8,0.15)';
            confidenceHoverBgColor = 'rgba(234,179,8,0.25)';
          }

          return (
            <div className="mb-4">
              <button
                onClick={() => setShowSimilarSessions(!showSimilarSessions)}
                className="w-full p-3 rounded-lg text-left transition-colors"
                style={{ 
                  backgroundColor: confidenceBgColor,
                  border: `1px solid ${confidenceColor}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = confidenceHoverBgColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = confidenceBgColor;
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: confidenceColor }}>
                    Based on <strong>{recommendation.matchingRuns}</strong> similar session{recommendation.matchingRuns !== 1 ? 's' : ''} from your history
                  </p>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showSimilarSessions ? 'rotate-180' : ''}`}
                    style={{ color: confidenceColor }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {/* Expandable similar sessions */}
              {showSimilarSessions && recommendation.similarConditions.length > 0 && (
                <div className="mt-2 space-y-2 animate-fade-in">
                  {recommendation.similarConditions.map((session, index) => (
                    <SimilarSessionCard 
                      key={index}
                      session={session}
                      temperatureUnit={temperatureUnit}
                      activity={activity}
                      thermalPreference={thermalPreference}
                    />
                  ))}
                </div>
              )}

              {/* Suggestions - collapsible, below history */}
              {suggestions && suggestions.suggestions.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="w-full p-3 rounded-lg text-left transition-colors"
                    style={{ 
                      backgroundColor: confidenceBgColor,
                      border: `1px solid ${confidenceColor}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = confidenceHoverBgColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = confidenceBgColor;
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm" style={{ color: confidenceColor }}>
                        Suggestions
                      </p>
                      <svg 
                        className={`w-4 h-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`}
                        style={{ color: confidenceColor }}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expandable suggestions content */}
                  {showSuggestions && (
                    <div className="mt-2 p-3 rounded-lg animate-fade-in" style={{ backgroundColor: confidenceBgColor, border: `1px solid ${confidenceColor}` }}>
                      <p className="text-xs mb-3" style={{ color: confidenceColor }}>{suggestions.explanation}</p>
                      <div className="space-y-2">
                        {suggestions.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{suggestion.categoryLabel}:</span>{' '}
                            <span className="text-[var(--color-text-muted)] line-through">{suggestion.current}</span>
                            {' → '}
                            <span className="font-medium" style={{ color: confidenceColor }}>{suggestion.suggested}</span>
                            <span className="text-xs text-[var(--color-text-muted)] block ml-0 mt-0.5">{suggestion.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {editable && (
          <div className="mb-4 p-3 bg-[rgba(249,115,22,0.15)] border border-[var(--color-accent)] rounded-lg">
            <p className="text-sm text-[var(--color-accent)] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Tap any item to change what you're actually wearing
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {categories.map((cat) => (
            <ClothingItem 
              key={cat.key}
              categoryKey={cat.key}
              icon={CATEGORY_ICONS[cat.key] || '👔'} 
              label={cat.label} 
              value={clothing[cat.key] || cat.defaultValue}
              highlight={highlightCategories.includes(cat.key)}
              editable={editable}
              edited={isEdited(cat.key)}
              onClick={() => handleItemClick(cat.key)}
              onInfoClick={(itemName) => handleShowInfo(cat.key, itemName)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ClothingItemProps {
  categoryKey: string;
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
  editable?: boolean;
  edited?: boolean;
  onClick?: () => void;
  onInfoClick?: (itemName: string) => void;
}

function ClothingItem({ categoryKey, icon, label, value, highlight, editable, edited, onClick, onInfoClick }: ClothingItemProps) {
  const isNone = value.toLowerCase() === 'none';
  const hasInfo = !isNone && getClothingInfo(categoryKey, value) !== null;
  
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger the main onClick
    onInfoClick?.(value);
  };
  
  return (
    <div 
      className={`clothing-card flex items-center gap-4 ${highlight ? 'border border-[rgba(249,115,22,0.3)]' : ''} ${
        editable ? 'cursor-pointer hover:bg-[rgba(255,255,255,0.1)] active:scale-[0.98]' : ''
      } ${edited ? 'ring-2 ring-[var(--color-accent)]' : ''}`}
      onClick={onClick}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide flex items-center gap-1">
          {label}
          {edited && (
            <span className="text-[var(--color-accent)] normal-case">(edited)</span>
          )}
        </div>
        <div className={`font-medium flex items-center gap-2 ${isNone ? 'text-[var(--color-text-muted)]' : ''}`}>
          {value}
          {hasInfo && (
            <button
              onClick={handleInfoClick}
              className="p-1 rounded-full hover:bg-[rgba(255,255,255,0.2)] text-[var(--color-accent)] transition-colors"
              title="Learn more about this item"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {editable ? (
        <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      ) : !isNone && (
        <svg className="w-5 h-5 text-[var(--color-success)]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
}

interface ConfidenceBadgeProps {
  confidence: number;
}

function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  let color = 'var(--color-error)';
  let label = 'Low';
  
  if (confidence >= 70) {
    color = 'var(--color-success)';
    label = 'High';
  } else if (confidence >= 40) {
    color = 'var(--color-warning)';
    label = 'Medium';
  }

  return (
    <div className="flex items-center gap-2" style={{ color }}>
      <div className="text-xs uppercase tracking-wide">{label} confidence</div>
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ 
          background: `conic-gradient(${color} ${confidence}%, rgba(255,255,255,0.1) 0)`,
        }}
      >
        <span className="bg-[var(--color-surface)] rounded-full w-7 h-7 flex items-center justify-center">
          {confidence}
        </span>
      </div>
    </div>
  );
}

// Similar session card for the expandable list
interface SimilarSessionCardProps {
  session: RunRecord;
  temperatureUnit: TemperatureUnit;
  activity: ActivityType;
  thermalPreference: ThermalPreference;
}

function SimilarSessionCard({ session, temperatureUnit, activity, thermalPreference }: SimilarSessionCardProps) {
  // Calculate T_comfort for this session
  const sessionWeather: WeatherData = {
    temperature: session.temperature,
    feelsLike: session.feelsLike,
    humidity: session.humidity,
    pressure: 0,
    windSpeed: session.windSpeed,
    precipitation: session.precipitation,
    cloudCover: session.cloudCover,
    uvIndex: session.uvIndex,
    icon: '',
    description: '',
    location: '',
    timestamp: new Date()
  };
  const comfortBreakdown = calculateComfortTemperature(sessionWeather, activity, thermalPreference);
  const thermalComfortDisplay = temperatureUnit === 'celsius' 
    ? `${Math.round(comfortBreakdown.comfortTempC)}°C`
    : `${Math.round((comfortBreakdown.comfortTempC * 9/5) + 32)}°F`;
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

  const getComfortEmoji = (comfort?: string) => {
    switch (comfort) {
      case 'too_cold': return '🥶';
      case 'just_right': return '👍';
      case 'too_hot': return '🥵';
      default: return null;
    }
  };

  const getClothingSummary = (clothing: ClothingItems): string[] => {
    const items: string[] = [];
    // Check all clothing categories in a sensible order
    const keysToCheck = [
      'headCover', 'tops', 'baseLayer', 'midLayer', 'outerLayer', 
      'bottoms', 'shoes', 'boots', 'socks', 'gloves', 
      'accessories', 'rainGear', 'helmet', 'armWarmers', 'eyewear',
      'pack', 'hydration', 'gaiters', 'poles'
    ];
    for (const key of keysToCheck) {
      if (clothing[key] && clothing[key] !== 'None') {
        items.push(clothing[key]);
      }
    }
    return items;
  };

  // Check if this is feedback data (has comfort, comments, activityLevel, and duration fields)
  const comfort = (session as { comfort?: string }).comfort;
  const comments = (session as { comments?: string }).comments;
  const activityLevel = (session as { activityLevel?: string }).activityLevel;
  const duration = (session as { duration?: string }).duration;

  return (
    <div className="p-3 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-[var(--color-accent)]">
              {formatTemperature(session.temperature, temperatureUnit)}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              feels like {formatTemperature(session.feelsLike, temperatureUnit)}
            </span>
            <span className="text-xs text-[var(--color-success)]" title="Thermal Comfort">
              TC: {thermalComfortDisplay}
            </span>
            {comfort && (
              <span className="text-sm" title={comfort}>
                {getComfortEmoji(comfort)}
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            {formatDate(session.date)}
            {session.time && (
              <span className="ml-1">at {session.time}</span>
            )}
            {session.location && session.location !== 'Unknown' && session.location !== 'From feedback' && (
              <span className="ml-1">• {session.location.split(',')[0]}</span>
            )}
          </div>
          {(activityLevel || duration) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {activityLevel && (
                <span className="text-xs px-2 py-0.5 bg-[rgba(59,130,246,0.2)] text-blue-300 rounded">
                  Level: <span className="font-medium capitalize">{activityLevel}</span>
                </span>
              )}
              {duration && (
                <span className="text-xs px-2 py-0.5 bg-[rgba(59,130,246,0.2)] text-blue-300 rounded">
                  Duration: <span className="font-medium">{duration === 'short' ? '< 1 hour' : '≥ 1 hour'}</span>
                </span>
              )}
            </div>
          )}
          <div className="text-sm mt-1 text-[var(--color-text-muted)]">
            <span className="text-[rgba(255,255,255,0.5)]">Wore:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {getClothingSummary(session.clothing).map((item, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-[rgba(255,255,255,0.1)] rounded-full">
                  {item}
                </span>
              ))}
              {getClothingSummary(session.clothing).length === 0 && (
                <span className="text-xs italic">No data</span>
              )}
            </div>
          </div>
          {comments && (
            <div className="text-xs mt-2 p-2 bg-[rgba(255,255,255,0.05)] rounded border-l-2 border-[var(--color-accent)] italic text-[var(--color-text-muted)]">
              📝 "{comments}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
