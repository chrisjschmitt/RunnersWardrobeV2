import { useState, useEffect } from 'react';
import { getCustomClothingOptions, addCustomClothingOption, deleteCustomClothingOption } from '../services/database';
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

  // Categories that are ordered from coolest to warmest
  // Only show warmth indicators for these categories
  const temperatureOrderedCategories = [
    'headCover', 'tops', 'bottoms', 'shoes', 'socks', 'gloves', 'rainGear',
    'midLayer', 'outerLayer', 'baseLayer', 'armWarmers', 'boots'
  ];
  const isTemperatureOrdered = temperatureOrderedCategories.includes(category);
  

  // Helper to determine if an option is warmer or cooler than current
  const getWarmthIndicator = (option: string): 'warmer' | 'cooler' | 'same' | null => {
    if (!isTemperatureOrdered) {
      return null;
    }
    
    if (!currentValue || currentValue.trim() === '') {
      return null;
    }
    
    // Normalize strings for comparison (trim and lowercase)
    const normalize = (str: string) => str.trim().toLowerCase();
    const normalizedCurrent = normalize(currentValue);
    const normalizedOption = normalize(option);
    
    // Find exact match first
    let currentIndex = defaultOptions.findIndex(
      opt => normalize(opt) === normalizedCurrent
    );
    
    // If no exact match, try fuzzy matching (check if current value contains a default option or vice versa)
    if (currentIndex === -1) {
      currentIndex = defaultOptions.findIndex(opt => {
        const normalizedOpt = normalize(opt);
        // Check if current value contains the default option, or default option contains current value
        // This handles cases like "Base layer + fleece + jacket" matching "Base layer + jacket"
        return normalizedCurrent.includes(normalizedOpt) || normalizedOpt.includes(normalizedCurrent);
      });
    }
    
    const optionIndex = defaultOptions.findIndex(
      opt => normalize(opt) === normalizedOption
    );
    
    // If current value is not in defaults and fuzzy match failed, can't determine warmth
    if (currentIndex === -1) {
      return null;
    }
    
    // If option is not in defaults (custom item), can't determine warmth for that option
    if (optionIndex === -1) {
      return null;
    }
    
    if (optionIndex > currentIndex) return 'warmer';
    if (optionIndex < currentIndex) return 'cooler';
    return 'same';
  };

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

  const handleDeleteCustom = async (option: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger the select
    await deleteCustomClothingOption(category, option, activity);
    setCustomOptions(prev => prev.filter(opt => opt !== option));
    // If the deleted option was selected, reset to default
    if (option.toLowerCase() === currentValue.toLowerCase()) {
      onSelect(defaultOptions[0] || 'None');
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
                {allOptions.map((option) => {
                  const isCustom = customOptions.includes(option);
                  const isSelected = option.toLowerCase() === currentValue.toLowerCase();
                  const warmthIndicator = getWarmthIndicator(option);
                  
                  return (
                    <div
                      key={option}
                      className={`w-full p-3 rounded-lg transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]'
                      }`}
                    >
                      <button
                        onClick={() => handleSelect(option)}
                        className="flex-1 text-left flex items-center gap-2"
                      >
                        {option}
                        {isCustom && (
                          <span className="text-xs opacity-60">(custom)</span>
                        )}
                        {warmthIndicator && !isSelected && (
                          <span className={`text-xs flex items-center gap-1 ${
                            warmthIndicator === 'warmer' 
                              ? 'text-orange-400' 
                              : warmthIndicator === 'cooler'
                              ? 'text-blue-400'
                              : ''
                          }`}>
                            {warmthIndicator === 'warmer' && (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                <span>Warmer</span>
                              </>
                            )}
                            {warmthIndicator === 'cooler' && (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                <span>Cooler</span>
                              </>
                            )}
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        {isCustom && (
                          <button
                            onClick={(e) => handleDeleteCustom(option, e)}
                            className={`p-1 rounded hover:bg-red-500/30 ${
                              isSelected ? 'text-white/70 hover:text-white' : 'text-red-400/70 hover:text-red-400'
                            }`}
                            title="Delete custom option"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        {isSelected && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
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
