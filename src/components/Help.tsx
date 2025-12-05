import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does the app recommend what to wear?",
    answer: `The app uses a smart recommendation engine that learns from your running history:

1. **Recent Feedback Priority**: If you've run in similar weather in the last 7 days, it uses your clothing choice directly (95% confidence).

2. **Historical Analysis**: It compares current weather to your CSV history and past feedback, weighing factors like temperature (most important), feels-like temp, precipitation, wind, humidity, cloud cover, and UV index.

3. **Voting System**: Similar runs "vote" for clothing items. Your personal feedback counts 2x more than CSV data.

4. **Comfort Learning**: If you often report "too cold" or "too hot", the app adjusts recommendations accordingly.

5. **Fallback**: With no history, it uses general running guidelines based on temperature ranges.`
  },
  {
    question: "How do I get started?",
    answer: `1. **Set up API Key**: Go to Settings and enter your free OpenWeatherMap API key (get one at openweathermap.org/api).

2. **Upload History** (optional): Upload a CSV file with your past running data to get personalized recommendations immediately.

3. **Allow Location**: The app needs your location to fetch current weather.

4. **Start Running**: View recommendations, edit if needed, tap "Start Your Run!"

5. **Give Feedback**: After your run, tell us if you were too cold, just right, or too hot. This helps improve future recommendations!`
  },
  {
    question: "Why does the app have a Start/End button?",
    answer: `The Start/End flow serves several important purposes:

**1. Captures What You Actually Wore**
Before clicking "Start", you can edit the recommendations to match what you're actually wearing. Your actual choice becomes training data for future recommendations.

**2. Enables Post-Activity Feedback**
When you click "End", the app prompts you to rate your comfort (Too Cold / Just Right / Too Hot). This feedback, combined with the weather and what you wore, teaches the algorithm your preferences.

**3. Creates a Complete Data Record**
Each session saves: date/time, weather conditions, actual clothing worn, your comfort feedback, and activity type.

**4. The Learning Loop**
Weather → Recommendation → Your Edits → Start → Activity → End → Feedback → Saved for future recommendations

Without this flow, the app would only learn from CSV imports. The Start/End cycle lets it learn from your real experiences over time.

**Note:** You can skip this flow and just use the app for one-time recommendations, but then it won't learn your personal temperature preferences.`
  },
  {
    question: "What should my CSV file look like?",
    answer: `Your CSV should have a header row with these columns (only date and temperature are required):

**Required:**
- date (e.g., 2024-01-15)
- temperature (in °F)

**Optional weather:**
- time, location, feels_like, humidity, pressure, precipitation, uv, wind_speed, cloud_cover

**Optional clothing:**
- head_cover, tops, bottoms, shoes, socks, gloves, rain_gear

Example:
date,temperature,feels_like,tops,bottoms,gloves
2024-01-15,45,42,long sleeve,tights,light
2024-01-20,28,22,base layer + jacket,tights,heavy`
  },
  {
    question: "Can I add my own clothing options?",
    answer: `Yes! When selecting clothing:

1. Tap any clothing item
2. Scroll to the bottom of the picker
3. Tap "Add custom option..."
4. Type your custom item and tap "Add"

Your custom options are saved and will appear in future selections with a "(custom)" label.`
  },
  {
    question: "Why should I give feedback after runs?",
    answer: `Feedback is how the app learns YOUR preferences:

- **"Too Cold"**: Next time, it'll recommend warmer clothing for similar weather
- **"Just Right"**: Your clothing choice gets saved and prioritized
- **"Too Hot"**: Next time, it'll recommend lighter clothing

The more feedback you provide, the more personalized recommendations become. Recent feedback (last 7 days) takes highest priority!`
  },
  {
    question: "How do I install this on my iPhone?",
    answer: `This is a Progressive Web App (PWA) that works like a native app:

1. Open the app URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Give it a name and tap **"Add"**

The app will appear on your home screen and work offline!`
  },
  {
    question: "What weather factors affect recommendations?",
    answer: `The app considers these factors (in order of importance):

| Factor | Weight | Why it matters |
|--------|--------|----------------|
| Temperature | Highest | Primary factor for clothing |
| Feels Like | High | Accounts for wind chill/heat index |
| Precipitation | High | Rain gear decisions |
| Wind Speed | Medium | Affects perceived temperature |
| Humidity | Medium | Comfort and sweat management |
| Cloud Cover | Low | Sun exposure |
| UV Index | Low | Hat/cap decisions |

Temperature and feels-like combined account for ~50% of the similarity score.`
  },
  {
    question: "Why isn't my clothing selection being saved?",
    answer: `Make sure you complete the full flow:

1. Edit your clothing selections ✓
2. Tap "Start Your Run!" ✓
3. Tap "End Run" when finished ✓
4. **Submit feedback** (Too Cold/Just Right/Too Hot) ← Required!

Your clothing is only saved when you submit feedback. This ensures we know whether that choice worked for you.`
  },
  {
    question: "Can I use Celsius instead of Fahrenheit?",
    answer: `Yes! Go to **Settings** and tap the **°C** button to switch to Celsius. Your preference is saved automatically.

Note: The CSV data and internal calculations still use Fahrenheit, but all displays will show Celsius.`
  },
  {
    question: "What if I don't have any running history?",
    answer: `No problem! The app provides sensible defaults based on general running guidelines:

- **Below 40°F**: Beanie, jacket + base layer, tights, heavy gloves
- **40-55°F**: Long sleeve, tights, light gloves
- **55-65°F**: T-shirt, shorts or capris
- **65-75°F**: T-shirt, shorts
- **Above 75°F**: Singlet, short shorts, cap for sun

As you run and provide feedback, recommendations become personalized to YOU.`
  }
];

export function Help() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="animate-fade-in">
      {/* Getting Started */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Start Guide
        </h2>

        <div className="space-y-4">
          <Step number={1} title="Set Up API Key">
            Go to Settings and enter your OpenWeatherMap API key. Get a free key at{' '}
            <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] underline">
              openweathermap.org/api
            </a>
          </Step>

          <Step number={2} title="Upload Running History (Optional)">
            Upload a CSV file with your past runs to get personalized recommendations right away.
          </Step>

          <Step number={3} title="Get Recommendations">
            Allow location access to see current weather and clothing suggestions.
          </Step>

          <Step number={4} title="Customize & Run">
            Tap any clothing item to change it. Click "Start Your Run!" when ready.
          </Step>

          <Step number={5} title="Give Feedback">
            After your run, tell us how you felt. This teaches the app your preferences!
          </Step>
        </div>
      </div>

      {/* How It Works */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          How Recommendations Work
        </h2>

        <div className="space-y-4 text-sm">
          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <h3 className="font-semibold text-[var(--color-accent)] mb-2">1. Recent Feedback First</h3>
            <p className="text-[var(--color-text-muted)]">
              If you ran in similar weather in the last 7 days, your clothing choice is used directly.
            </p>
          </div>

          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <h3 className="font-semibold text-[var(--color-accent)] mb-2">2. Historical Analysis</h3>
            <p className="text-[var(--color-text-muted)]">
              Compares current weather to your history. Temperature is weighted most heavily, followed by feels-like, precipitation, and wind.
            </p>
          </div>

          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <h3 className="font-semibold text-[var(--color-accent)] mb-2">3. Smart Voting</h3>
            <p className="text-[var(--color-text-muted)]">
              Similar runs "vote" for clothing items. Your feedback counts 2x more than imported CSV data.
            </p>
          </div>

          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <h3 className="font-semibold text-[var(--color-accent)] mb-2">4. Comfort Learning</h3>
            <p className="text-[var(--color-text-muted)]">
              If you consistently report "too cold", recommendations shift warmer. "Too hot" shifts lighter.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Frequently Asked Questions
        </h2>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <FAQAccordion
              key={index}
              question={faq.question}
              answer={faq.answer}
              isExpanded={expandedIndex === index}
              onToggle={() => toggleFAQ(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-sm">
        {number}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-[var(--color-text-muted)]">{children}</p>
      </div>
    </div>
  );
}

interface FAQAccordionProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQAccordion({ question, answer, isExpanded, onToggle }: FAQAccordionProps) {
  return (
    <div className="border border-[rgba(255,255,255,0.1)] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-[rgba(255,255,255,0.05)] transition-colors"
      >
        <span className="font-medium pr-4">{question}</span>
        <svg
          className={`w-5 h-5 text-[var(--color-accent)] flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="text-sm text-[var(--color-text-muted)] whitespace-pre-line">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}

