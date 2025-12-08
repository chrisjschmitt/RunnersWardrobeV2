import { useState } from 'react';
import type { ComfortLevel } from '../types';

interface FeedbackModalProps {
  onSubmit: (comfort: ComfortLevel, comments?: string) => void;
  onCancel: () => void;
  activityName?: string;
}

export function FeedbackModal({ onSubmit, onCancel, activityName = 'run' }: FeedbackModalProps) {
  const [selected, setSelected] = useState<ComfortLevel | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    await onSubmit(selected, comments.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-6 w-full max-w-sm animate-slide-up">
        <h2 className="text-xl font-bold text-center mb-2">How was your {activityName}?</h2>
        <p className="text-[var(--color-text-muted)] text-center text-sm mb-6">
          This helps us improve future recommendations
        </p>

        <div className="space-y-3 mb-4">
          <FeedbackOption
            icon="🥶"
            label="Too Cold"
            description="I needed warmer clothing"
            selected={selected === 'too_cold'}
            onClick={() => setSelected('too_cold')}
          />
          <FeedbackOption
            icon="👍"
            label="Just Right"
            description="My clothing was perfect"
            selected={selected === 'just_right'}
            onClick={() => setSelected('just_right')}
            highlight
          />
          <FeedbackOption
            icon="🥵"
            label="Too Hot"
            description="I needed lighter clothing"
            selected={selected === 'too_hot'}
            onClick={() => setSelected('too_hot')}
          />
        </div>

        {/* Optional comments field */}
        <div className="mb-6">
          <label className="block text-sm text-[var(--color-text-muted)] mb-2">
            Notes (optional)
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="e.g., Don't wear heavy gloves next time..."
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
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner animate-spin w-4 h-4"></div>
                Saving...
              </span>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FeedbackOptionProps {
  icon: string;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  highlight?: boolean;
}

function FeedbackOption({ icon, label, description, selected, onClick, highlight }: FeedbackOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
        selected
          ? 'bg-[var(--color-accent)] text-white'
          : highlight
            ? 'bg-[rgba(34,197,94,0.15)] border border-[var(--color-success)] hover:bg-[rgba(34,197,94,0.25)]'
            : 'bg-[rgba(255,255,255,0.05)] border border-transparent hover:bg-[rgba(255,255,255,0.1)]'
      }`}
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <div className={`font-semibold ${selected ? 'text-white' : ''}`}>{label}</div>
        <div className={`text-sm ${selected ? 'text-white/80' : 'text-[var(--color-text-muted)]'}`}>
          {description}
        </div>
      </div>
      {selected && (
        <svg className="w-6 h-6 ml-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

