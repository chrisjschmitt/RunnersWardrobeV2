import type { ClothingInfo } from '../data/clothingInfo';

interface ClothingInfoModalProps {
  info: ClothingInfo;
  onClose: () => void;
}

export function ClothingInfoModal({ info, onClose }: ClothingInfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[var(--color-surface)] rounded-2xl animate-fade-in shadow-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between">
          <h3 className="text-lg font-semibold">{info.name}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-60px)] space-y-4">
          {/* Description */}
          <div>
            <p className="text-[var(--color-text-muted)]">{info.description}</p>
          </div>

          {/* Why wear this */}
          {info.whyWear && (
            <div className="p-3 bg-[rgba(59,130,246,0.15)] border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">💡</span>
                <div>
                  <span className="text-sm font-medium text-blue-300">When to wear</span>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">{info.whyWear}</p>
                </div>
              </div>
            </div>
          )}

          {/* What to look for */}
          {info.lookFor && info.lookFor.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <span>✓</span> What to look for
              </h4>
              <ul className="space-y-1">
                {info.lookFor.map((item, i) => (
                  <li key={i} className="text-sm text-[var(--color-text-muted)] flex items-start gap-2">
                    <span className="text-[var(--color-accent)]">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Examples */}
          {info.examples && info.examples.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <span>🏷️</span> Examples
              </h4>
              <p className="text-sm text-[var(--color-text-muted)]">
                {info.examples.join(', ')}
              </p>
            </div>
          )}

          {/* Budget tip */}
          {info.budgetTip && (
            <div className="p-3 bg-[rgba(34,197,94,0.15)] border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">💰</span>
                <div>
                  <span className="text-sm font-medium text-green-300">Budget tip</span>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">{info.budgetTip}</p>
                </div>
              </div>
            </div>
          )}

          {/* What to avoid */}
          {info.avoid && (
            <div className="p-3 bg-[rgba(239,68,68,0.15)] border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">⚠️</span>
                <div>
                  <span className="text-sm font-medium text-red-300">Avoid</span>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">{info.avoid}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

