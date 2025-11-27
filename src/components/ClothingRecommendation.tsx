import { useState } from 'react';
import type { ClothingRecommendation as ClothingRec, ClothingItems } from '../types';
import { ClothingPicker } from './ClothingPicker';

interface ClothingRecommendationProps {
  recommendation: ClothingRec | null;
  fallback: ClothingItems | null;
  currentClothing?: ClothingItems | null; // The actual clothing (including user edits)
  isLoading: boolean;
  editable?: boolean;
  onClothingChange?: (clothing: ClothingItems) => void;
}

export function ClothingRecommendation({ 
  recommendation, 
  fallback,
  currentClothing,
  isLoading,
  editable = false,
  onClothingChange
}: ClothingRecommendationProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  
  // Base clothing from recommendation or fallback
  const baseClothing = recommendation?.clothing || fallback;
  
  // Use currentClothing if provided (preserves user edits), otherwise use base
  const clothing = currentClothing || baseClothing;
  const hasHistory = recommendation !== null;

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

  const isEdited = (category: keyof ClothingItems) => {
    if (!currentClothing || !baseClothing) return false;
    return currentClothing[category].toLowerCase() !== baseClothing[category].toLowerCase();
  };

  return (
    <div className="animate-slide-up delay-200">
      {/* Clothing Picker Modal */}
      {editingCategory && (
        <ClothingPicker
          category={editingCategory}
          currentValue={clothing[editingCategory as keyof ClothingItems]}
          onSelect={(value) => handleItemChange(editingCategory, value)}
          onClose={() => setEditingCategory(null)}
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
              <strong>No history data.</strong> These are general recommendations. Upload your running history for personalized suggestions!
            </p>
          </div>
        )}

        {hasHistory && recommendation && (
          <div className="mb-4 p-3 bg-[rgba(34,197,94,0.15)] border border-[var(--color-success)] rounded-lg">
            <p className="text-sm text-[var(--color-success)]">
              Based on <strong>{recommendation.matchingRuns}</strong> similar runs from your history
            </p>
          </div>
        )}

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
          <ClothingItem 
            icon="🧢" 
            label="Head" 
            value={clothing.headCover}
            editable={editable}
            edited={isEdited('headCover')}
            onClick={() => handleItemClick('headCover')}
          />
          <ClothingItem 
            icon="👕" 
            label="Top" 
            value={clothing.tops} 
            highlight
            editable={editable}
            edited={isEdited('tops')}
            onClick={() => handleItemClick('tops')}
          />
          <ClothingItem 
            icon="🩳" 
            label="Bottom" 
            value={clothing.bottoms} 
            highlight
            editable={editable}
            edited={isEdited('bottoms')}
            onClick={() => handleItemClick('bottoms')}
          />
          <ClothingItem 
            icon="👟" 
            label="Shoes" 
            value={clothing.shoes}
            editable={editable}
            edited={isEdited('shoes')}
            onClick={() => handleItemClick('shoes')}
          />
          <ClothingItem 
            icon="🧦" 
            label="Socks" 
            value={clothing.socks}
            editable={editable}
            edited={isEdited('socks')}
            onClick={() => handleItemClick('socks')}
          />
          <ClothingItem 
            icon="🧤" 
            label="Gloves" 
            value={clothing.gloves}
            editable={editable}
            edited={isEdited('gloves')}
            onClick={() => handleItemClick('gloves')}
          />
          <ClothingItem 
            icon="🌧️" 
            label="Rain Gear" 
            value={clothing.rainGear}
            editable={editable}
            edited={isEdited('rainGear')}
            onClick={() => handleItemClick('rainGear')}
          />
        </div>
      </div>
    </div>
  );
}

interface ClothingItemProps {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
  editable?: boolean;
  edited?: boolean;
  onClick?: () => void;
}

function ClothingItem({ icon, label, value, highlight, editable, edited, onClick }: ClothingItemProps) {
  const isNone = value.toLowerCase() === 'none';
  
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
        <div className={`font-medium ${isNone ? 'text-[var(--color-text-muted)]' : ''}`}>
          {value}
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
