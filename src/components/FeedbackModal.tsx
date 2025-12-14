import { useState } from 'react';
import type { ComfortLevel, ClothingItems, ActivityType } from '../types';
import { getClothingCategories } from '../types';
import { ClothingPicker } from './ClothingPicker';

interface FeedbackModalProps {
  onSubmit: (comfort: ComfortLevel, clothing: ClothingItems, comments?: string) => void;
  onCancel: () => void;
  activityName?: string;
  clothing: ClothingItems;
  activity: ActivityType;
}

export function FeedbackModal({ 
  onSubmit, 
  onCancel, 
  activityName = 'activity',
  clothing: initialClothing,
  activity
}: FeedbackModalProps) {
  const [satisfied, setSatisfied] = useState<boolean | null>(null);
  const [clothing, setClothing] = useState<ClothingItems>(initialClothing);
  const [showClothingEdit, setShowClothingEdit] = useState(false);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const categories = getClothingCategories(activity);
  const hasChanges = JSON.stringify(clothing) !== JSON.stringify(initialClothing);

  const handleSubmit = async () => {
    if (satisfied === null) return;
    setIsSubmitting(true);
    // If they made changes, record as 'adjusted', otherwise 'satisfied'
    const comfort: ComfortLevel = hasChanges ? 'adjusted' : 'satisfied';
    await onSubmit(comfort, clothing, comments.trim() || undefined);
  };

  const handleClothingChange = (category: string, value: string) => {
    setClothing(prev => ({ ...prev, [category]: value }));
    setEditingCategory(null);
  };

  // Step 1: Ask satisfaction question
  if (satisfied === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="glass-card p-6 w-full max-w-sm animate-slide-up">
          <h2 className="text-xl font-bold text-center mb-2">How was your {activityName}?</h2>
          <p className="text-[var(--color-text-muted)] text-center text-sm mb-6">
            Were you happy with what you wore?
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => setSatisfied(true)}
              className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 bg-[rgba(34,197,94,0.15)] border border-[var(--color-success)] hover:bg-[rgba(34,197,94,0.25)]"
            >
              <span className="text-3xl">👍</span>
              <div>
                <div className="font-semibold">Yes, it was perfect!</div>
                <div className="text-sm text-[var(--color-text-muted)]">Save and continue</div>
              </div>
            </button>
            <button
              onClick={() => {
                setSatisfied(false);
                setShowClothingEdit(true);
              }}
              className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 bg-[rgba(255,255,255,0.05)] border border-transparent hover:bg-[rgba(255,255,255,0.1)]"
            >
              <span className="text-3xl">✏️</span>
              <div>
                <div className="font-semibold">I'd make some changes</div>
                <div className="text-sm text-[var(--color-text-muted)]">Adjust outfit before saving</div>
              </div>
            </button>
          </div>

          <button
            onClick={onCancel}
            className="btn-secondary w-full"
          >
            Skip Feedback
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Show clothing adjustment (if not satisfied) or notes
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-6 w-full max-w-sm animate-slide-up max-h-[85vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-center mb-2">
          {showClothingEdit ? 'Adjust Your Outfit' : 'Save Activity'}
        </h2>
        
        {showClothingEdit && (
          <>
            <p className="text-[var(--color-text-muted)] text-center text-sm mb-4">
              Tap any item to change it
            </p>
            
            <div className="space-y-2 mb-4">
              {categories.map(cat => (
                <div key={cat.key}>
                  {editingCategory === cat.key ? (
                    <ClothingPicker
                      category={cat.key}
                      currentValue={clothing[cat.key] || cat.defaultValue}
                      onSelect={(value) => handleClothingChange(cat.key, value)}
                      onClose={() => setEditingCategory(null)}
                      activity={activity}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingCategory(cat.key)}
                      className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-all ${
                        clothing[cat.key] !== initialClothing[cat.key]
                          ? 'bg-[rgba(34,197,94,0.15)] border border-[var(--color-success)]'
                          : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                      }`}
                    >
                      <div>
                        <div className="text-xs text-[var(--color-text-muted)]">{cat.label}</div>
                        <div className="font-medium">{clothing[cat.key] || cat.defaultValue}</div>
                      </div>
                      {clothing[cat.key] !== initialClothing[cat.key] && (
                        <span className="text-xs text-[var(--color-success)]">Changed</span>
                      )}
                      <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {hasChanges && (
              <div className="p-3 mb-4 bg-[rgba(34,197,94,0.1)] border border-[var(--color-success)] rounded-lg">
                <p className="text-sm text-[var(--color-success)] text-center">
                  ✓ Changes will be saved to your history
                </p>
              </div>
            )}
          </>
        )}

        {/* Notes field */}
        <div className="mb-4">
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">
            Notes (optional)
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="e.g., Perfect for a morning run..."
            className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
            rows={2}
            maxLength={200}
          />
          <div className="text-xs text-[var(--color-text-muted)] text-right mt-1">
            {comments.length}/200
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (showClothingEdit) {
                setSatisfied(null);
                setShowClothingEdit(false);
                setClothing(initialClothing);
              } else {
                onCancel();
              }
            }}
            className="btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner animate-spin w-4 h-4"></div>
                Saving...
              </span>
            ) : (
              'Save Activity'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
