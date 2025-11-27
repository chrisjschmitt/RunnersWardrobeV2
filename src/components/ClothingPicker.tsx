import { useState } from 'react';

// Common options for each clothing category
const CLOTHING_OPTIONS: Record<string, string[]> = {
  headCover: [
    'None',
    'Running cap',
    'Visor',
    'Light beanie',
    'Beanie',
    'Headband',
    'Buff/Gaiter'
  ],
  tops: [
    'Singlet',
    'T-shirt',
    'Long sleeve',
    'Base layer',
    'Base layer + vest',
    'Base layer + jacket',
    'Base layer + heavy jacket',
    'Long sleeve + vest'
  ],
  bottoms: [
    'Short shorts',
    'Shorts',
    'Capris',
    'Tights',
    'Shorts + tights'
  ],
  shoes: [
    'Running shoes',
    'Trail shoes',
    'Racing flats',
    'Carbon plated',
    'Waterproof shoes'
  ],
  socks: [
    'No-show',
    'Light',
    'Regular',
    'Light wool',
    'Wool',
    'Compression'
  ],
  gloves: [
    'None',
    'Light',
    'Medium',
    'Heavy',
    'Mittens'
  ],
  rainGear: [
    'None',
    'Light rain jacket',
    'Waterproof jacket',
    'Poncho',
    'Full rain suit'
  ]
};

const CATEGORY_LABELS: Record<string, string> = {
  headCover: 'Head Cover',
  tops: 'Top',
  bottoms: 'Bottom',
  shoes: 'Shoes',
  socks: 'Socks',
  gloves: 'Gloves',
  rainGear: 'Rain Gear'
};

const CATEGORY_ICONS: Record<string, string> = {
  headCover: '🧢',
  tops: '👕',
  bottoms: '🩳',
  shoes: '👟',
  socks: '🧦',
  gloves: '🧤',
  rainGear: '🌧️'
};

interface ClothingPickerProps {
  category: string;
  currentValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function ClothingPicker({ category, currentValue, onSelect, onClose }: ClothingPickerProps) {
  const [customValue, setCustomValue] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  
  const options = CLOTHING_OPTIONS[category] || [];
  const label = CATEGORY_LABELS[category] || category;
  const icon = CATEGORY_ICONS[category] || '👔';

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onSelect(customValue.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[var(--color-surface)] rounded-t-2xl animate-slide-up safe-bottom">
        <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <h3 className="text-lg font-semibold">Select {label}</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full p-3 rounded-lg text-left transition-all flex items-center justify-between ${
                  option.toLowerCase() === currentValue.toLowerCase()
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                <span>{option}</span>
                {option.toLowerCase() === currentValue.toLowerCase() && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Custom option */}
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full p-3 rounded-lg text-left bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add custom option...
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="Enter custom option"
                  className="input-field flex-1"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                />
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customValue.trim()}
                  className="btn-primary px-4"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { CLOTHING_OPTIONS, CATEGORY_LABELS, CATEGORY_ICONS };

