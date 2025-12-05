import { useState } from 'react';
import { ACTIVITY_CONFIGS } from '../types';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to Outdoor Wardrobe!",
    icon: "🎒",
    content: "Your personal clothing advisor for outdoor activities. Get smart recommendations based on weather and your preferences.",
    highlight: null
  },
  {
    title: "Multiple Activities",
    icon: "🏃🥾🚴⛷️",
    content: "Switch between Running, Trail Running, Hiking, Cycling, Snowshoeing, and XC Skiing. Each has tailored clothing categories.",
    highlight: "activity"
  },
  {
    title: "Smart Recommendations",
    icon: "🌤️",
    content: "We check the weather and suggest what to wear. Tap any item to customize your outfit before heading out.",
    highlight: "weather"
  },
  {
    title: "Learn Your Preferences",
    icon: "📊",
    content: "After each activity, tell us if you were too hot, too cold, or just right. We'll learn and improve recommendations over time!",
    highlight: "feedback"
  },
  {
    title: "You're All Set!",
    icon: "✨",
    content: "Start by selecting your activity and allowing location access. Upload past data via CSV for instant personalization!",
    highlight: null
  }
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-bg)] flex flex-col">
      {/* Progress dots */}
      <div className="safe-top pt-6 px-6 flex justify-between items-center">
        <div className="flex gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-6 bg-[var(--color-accent)]' 
                  : index < currentStep 
                    ? 'bg-[var(--color-accent)]' 
                    : 'bg-[rgba(255,255,255,0.2)]'
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleSkip}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          Skip
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Icon */}
        <div className="text-7xl mb-6 animate-bounce-slow">
          {step.icon}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] bg-clip-text text-transparent">
          {step.title}
        </h1>

        {/* Content */}
        <p className="text-lg text-[var(--color-text-muted)] max-w-sm leading-relaxed mb-8">
          {step.content}
        </p>

        {/* Activity showcase on step 2 */}
        {step.highlight === 'activity' && (
          <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in">
            {Object.values(ACTIVITY_CONFIGS).map((config) => (
              <div
                key={config.id}
                className="px-4 py-2 bg-[rgba(255,255,255,0.1)] rounded-full flex items-center gap-2"
              >
                <span>{config.icon}</span>
                <span className="text-sm">{config.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Weather preview on step 3 */}
        {step.highlight === 'weather' && (
          <div className="glass-card p-4 mb-8 animate-fade-in w-full max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">☀️</span>
              <div className="text-right">
                <div className="text-2xl font-bold">18°C</div>
                <div className="text-xs text-[var(--color-text-muted)]">Feels like 16°C</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">👕 Top</span>
                <span>Long sleeve</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">🩳 Bottom</span>
                <span>Tights</span>
              </div>
            </div>
          </div>
        )}

        {/* Feedback preview on step 4 */}
        {step.highlight === 'feedback' && (
          <div className="flex gap-4 mb-8 animate-fade-in">
            <div className="px-6 py-3 bg-blue-500/20 border border-blue-500/50 rounded-xl text-center">
              <div className="text-2xl mb-1">🥶</div>
              <div className="text-xs">Too Cold</div>
            </div>
            <div className="px-6 py-3 bg-green-500/20 border border-green-500/50 rounded-xl text-center scale-110">
              <div className="text-2xl mb-1">👍</div>
              <div className="text-xs">Just Right</div>
            </div>
            <div className="px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-xl text-center">
              <div className="text-2xl mb-1">🥵</div>
              <div className="text-xs">Too Hot</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="safe-bottom px-6 pb-6 flex gap-3">
        {!isFirstStep && (
          <button
            onClick={handleBack}
            className="flex-1 py-4 rounded-xl bg-[rgba(255,255,255,0.1)] font-semibold hover:bg-[rgba(255,255,255,0.15)] transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
            isFirstStep ? 'w-full' : ''
          } bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] hover:opacity-90`}
        >
          {isLastStep ? "Let's Go!" : "Next"}
        </button>
      </div>
    </div>
  );
}

