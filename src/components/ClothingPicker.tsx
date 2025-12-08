import { useState, useEffect } from 'react';
import { getCustomClothingOptions, addCustomClothingOption } from '../services/database';
import type { ActivityType } from '../types';
import { getClothingCategories } from '../types';

// Icons for categories (shared with ClothingRecommendation)
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

interface ClothingPickerProps {
  category: string;
  currentValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  activity?: ActivityType;
}

export function ClothingPicker({ 
  category, 
  currentValue, 
  onSelect, 
  onClose, 
  activity = 'running' 
}: ClothingPickerProps) {
  const [customValue, setCustomValue] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Lock body scroll and fix Safari iOS viewport issues
  useEffect(() => {
    // Save current scroll position and body styles
    const scrollY = window.scrollY;
    const originalStyle = document.body.style.cssText;
    
    // Lock body scroll - this prevents Safari viewport jumping
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Restore body styles
      document.body.style.cssText = originalStyle;
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, []);
  
  // Get category info from activity config
  const categories = getClothingCategories(activity);
  const categoryConfig = categories.find(c => c.key === category);
  
  const defaultOptions = categoryConfig?.options || [];
  const label = categoryConfig?.label || category;
  const icon = CATEGORY_ICONS[category] || '👔';

  // Load custom options from database
  useEffect(() => {
    const loadCustomOptions = async () => {
      setIsLoading(true);
      try {
        const options = await getCustomClothingOptions(category, activity);
        setCustomOptions(options);
      } catch (error) {
        console.error('Failed to load custom options:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCustomOptions();
  }, [category, activity]);

  // Combine default and custom options
  const allOptions = [...defaultOptions, ...customOptions.filter(opt => !defaultOptions.includes(opt))];

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  const handleCustomSubmit = async () => {
    if (customValue.trim()) {
      const newOption = customValue.trim();
      // Save to database with activity context
      await addCustomClothingOption(category, newOption, activity);
      // Update local state
      setCustomOptions(prev => [...prev, newOption]);
      // Select the new option
      onSelect(newOption);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[var(--color-surface)] rounded-2xl animate-fade-in shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[rgba(255,255,255,0.1)] flex-shrink-0">
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

        <div className="p-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {allOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={`w-full p-3 rounded-lg text-left transition-all flex items-center justify-between ${
                      option.toLowerCase() === currentValue.toLowerCase()
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {option}
                      {customOptions.includes(option) && (
                        <span className="text-xs opacity-60">(custom)</span>
                      )}
                    </span>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
