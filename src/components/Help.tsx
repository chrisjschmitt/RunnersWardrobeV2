import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does the app know what to recommend?",
    answer: `The app learns from your activities over time:

**Your Recent Choices Matter Most**
If you did the same activity in similar weather recently, the app remembers what you wore and how you felt.

**It Learns Your Preferences**
Every time you give feedback ("too cold", "just right", "too hot"), the app adjusts. If you tend to run cold, it'll suggest warmer clothes. If you run hot, it'll suggest lighter options.

**Starting Fresh?**
No worries! The app has sensible defaults based on temperature. As you use it and provide feedback, it gets smarter about YOUR preferences.`
  },
  {
    question: "Why do I need to tap Start and End?",
    answer: `This is how the app learns from you:

**Before You Start**
You can change any clothing item to match what you're actually wearing. The app saves your actual choice, not just what it recommended.

**After You Finish**
The app asks how you felt - too cold, just right, or too hot. This feedback, combined with the weather and what you wore, teaches the app your preferences.

**Building Your History**
Each session creates a record that helps future recommendations. The more you use it, the smarter it gets!

**Just Need a Quick Suggestion?**
You can absolutely just check the recommendation and head out without tapping Start. But then the app won't learn from that experience.`
  },
  {
    question: "How do I add my own clothing options?",
    answer: `Easy! When you tap on any clothing item:

1. A picker appears with common options
2. Scroll to the bottom
3. Tap "Add custom option..."
4. Type your item (like "my lucky socks") and tap Add

Your custom items are saved and will show up with a "(custom)" label whenever you use the app.`
  },
  {
    question: "What does the feedback actually do?",
    answer: `Your feedback is gold! Here's what happens:

**"Too Cold" 🥶**
Next time in similar weather, the app suggests warmer layers.

**"Just Right" 👍**
Your clothing choice gets remembered and prioritized for similar conditions.

**"Too Hot" 🥵**
Next time, the app suggests lighter clothing.

The app weighs recent feedback more heavily than older feedback, so it adapts as your preferences change (or as you get fitter!).`
  },
  {
    question: "How do I install this on my phone?",
    answer: `This app works like a regular app on your phone:

**iPhone (Safari only)**
1. Open the app in Safari (not Chrome)
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

**Android (Chrome)**
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install App"

Once installed, the app appears on your home screen and opens in full screen - just like a regular app!`
  },
  {
    question: "Can I switch between Celsius and Fahrenheit?",
    answer: `Yes! Go to Settings and tap °C or °F. Your preference is saved automatically and all temperatures will display in your chosen unit.`
  },
  {
    question: "What if I haven't used the app before?",
    answer: `The app works great right from the start! Without any history, it uses common-sense defaults:

• **Below 40°F (4°C)**: Warm layers, beanie, heavy gloves
• **40-55°F (4-13°C)**: Long sleeves, tights, light gloves  
• **55-65°F (13-18°C)**: T-shirt, shorts or capris
• **Above 65°F (18°C)**: Light and breezy!

These are just starting points. As you use the app and give feedback, recommendations become tailored to YOU.`
  },
  {
    question: "How do I move my data to a new phone?",
    answer: `Your history can be exported and imported:

**To Export (from your current device)**
1. Go to the History tab
2. Tap "Export CSV" at the top
3. Save the file (email it to yourself, save to Files, etc.)

**To Import (on your new device)**
1. Go to the Upload tab
2. Select your exported file
3. Your history is restored!

This is the only way to transfer data since everything is stored on your device, not in the cloud.`
  },
  {
    question: "Does the app work offline?",
    answer: `Partially:

**Works Offline**
• Viewing your history
• Seeing past recommendations
• The app itself loads

**Needs Internet**
• Getting current weather (the app needs to check what the weather is right now)
• Getting sunrise/sunset times

If you're offline, you'll see a message that weather can't be loaded. Once you're back online, just tap Refresh.`
  },
  {
    question: "What activities does the app support?",
    answer: `Currently seven outdoor activities:

🏃 **Running** - Standard running gear
🏔️ **Trail Running** - Plus hydration vests and poles
🥾 **Hiking** - Layering system with packs
🚶 **Walking** - Casual everyday options
🚴 **Cycling** - Jerseys, bibs, helmets
❄️ **Snowshoeing** - Full winter gear
⛷️ **XC Skiing** - Nordic-specific clothing

Each activity has its own clothing categories and your history is tracked separately. Switch activities using the dropdown at the top of the screen.`
  }
];

export function Help() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="animate-fade-in">
      {/* Beta Notice */}
      <div className="glass-card p-6 mb-6 border-2 border-yellow-500/50 bg-[rgba(251,191,36,0.1)]">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-yellow-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Beta Version
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Thanks for trying Outdoor Wardrobe! This is a beta version, which means we're still improving it. Here's what you should know:
        </p>
        <div className="space-y-3 text-sm">
          <LimitationItem 
            icon="📱" 
            title="Data stays on your device"
            description="Your history and preferences are stored locally on this device only. If you use a different phone or tablet, you'll need to export and import your data."
          />
          <LimitationItem 
            icon="🌐" 
            title="Weather needs internet"
            description="The app needs an internet connection to check current weather conditions. Offline, you can view your history but won't get new recommendations."
          />
          <LimitationItem 
            icon="📍" 
            title="Location permission required"
            description="The app needs to know where you are to get local weather. Without location access, it can't make recommendations."
          />
          <LimitationItem 
            icon="🔄" 
            title="No automatic sync"
            description="There's no cloud backup or sync between devices. Use Export/Import in the History tab to move your data."
          />
          <LimitationItem 
            icon="🌡️" 
            title="Weather accuracy varies"
            description="Weather data comes from OpenWeatherMap. Conditions at your exact location may differ from what the app shows."
          />
        </div>
      </div>

      {/* Getting Started */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Start
        </h2>

        <div className="space-y-4">
          <Step number={1} title="Choose Your Activity">
            Tap the activity dropdown at the top (Running, Hiking, Cycling, etc.)
          </Step>

          <Step number={2} title="Allow Location">
            The app needs your location to get local weather. Tap "Allow" when asked.
          </Step>

          <Step number={3} title="Check Recommendations">
            See what the app suggests based on current weather. Tap any item to change it.
          </Step>

          <Step number={4} title="Start Your Activity">
            Tap the Start button when you head out. This saves what you're actually wearing.
          </Step>

          <Step number={5} title="Give Feedback">
            When you're done, tap End and tell the app how you felt. This helps it learn!
          </Step>
        </div>
      </div>

      {/* How It Works */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          How It Works
        </h2>

        <div className="space-y-4 text-sm">
          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <h3 className="font-semibold text-[var(--color-accent)] mb-2">🎯 Personalized to You</h3>
            <p className="text-[var(--color-text-muted)]">
              The app learns from YOUR experiences. What you wore, how you felt, in what weather. Everyone's different - some run hot, some run cold - and the app adapts to you.
            </p>
          </div>

          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <h3 className="font-semibold text-[var(--color-accent)] mb-2">📊 Weather Matching</h3>
            <p className="text-[var(--color-text-muted)]">
              When you head out, the app looks at today's weather and finds similar days from your history. Temperature matters most, but it also considers wind, rain, humidity, and more.
            </p>
          </div>

          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <h3 className="font-semibold text-[var(--color-accent)] mb-2">🧠 Always Learning</h3>
            <p className="text-[var(--color-text-muted)]">
              Every time you give feedback, the app gets smarter. Recent feedback counts more than old feedback, so the app stays current with your preferences.
            </p>
          </div>

          <div className="p-4 bg-[rgba(255,255,255,0.05)] rounded-lg">
            <h3 className="font-semibold text-[var(--color-accent)] mb-2">🛡️ Safety Nets</h3>
            <p className="text-[var(--color-text-muted)]">
              Even if your history says otherwise, the app won't let you go out underdressed. It automatically suggests rain gear when it's raining, warm layers when it's freezing, and sunglasses when it's sunny.
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
          Questions & Answers
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

      {/* Feedback */}
      <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        <p>Have questions or suggestions?</p>
        <p className="mt-1">This app is in active development and your feedback helps make it better!</p>
      </div>
    </div>
  );
}

interface LimitationItemProps {
  icon: string;
  title: string;
  description: string;
}

function LimitationItem({ icon, title, description }: LimitationItemProps) {
  return (
    <div className="flex gap-3">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div>
        <span className="font-medium text-yellow-200">{title}</span>
        <p className="text-[var(--color-text-muted)] mt-0.5">{description}</p>
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
