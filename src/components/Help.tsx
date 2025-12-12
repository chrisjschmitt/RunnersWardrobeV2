import { useState } from 'react';

interface HelpProps {
  onTermsClick?: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does the app know what to recommend?",
    answer: `The app learns from your activities over time:

**Your Recent Choices Matter Most**
If you did the same activity in similar weather recently, the app remembers what you wore and how you felt. Tap the green "Based on X similar sessions" banner to see which past activities influenced the recommendation.

**It Learns Your Preferences**
Every time you give feedback ("too cold", "just right", "too hot"), the app adjusts. If you tend to run cold, it'll suggest warmer clothes. If you run hot, it'll suggest lighter options.

**Starting Fresh?**
No worries! The app has sensible defaults based on temperature for each activity. As you use it and provide feedback, it gets smarter about YOUR preferences.`
  },
  {
    question: "What is the 'Based on similar sessions' banner?",
    answer: `When the app finds past activities in similar weather conditions, it shows a green banner like "Based on 3 similar sessions".

**Tap to see details!**
The banner expands to show you which past activities influenced the recommendation - including the date, time, location, and what you wore.

**Why it's helpful**
This lets you understand why the app made its recommendation and reminds you of how you felt in similar conditions before.`
  },
  {
    question: "Why do I need to tap Start and End?",
    answer: `This is how the app learns from you:

**Before You Start**
You can change any clothing item to match what you're actually wearing. The app saves your actual choice, not just what it recommended.

**After You Finish**
The app asks how you felt - too cold, just right, or too hot. You can also add optional notes like "gloves were too heavy" or "perfect outfit!"

**Building Your History**
Each session creates a record that helps future recommendations. The more you use it, the smarter it gets!

**Just Need a Quick Suggestion?**
You can absolutely just check the recommendation and head out without tapping Start. But then the app won't learn from that experience.`
  },
  {
    question: "How do I add or delete custom clothing options?",
    answer: `**To Add:**
1. Tap on any clothing item
2. Scroll to the bottom of the picker
3. Tap "Add custom option..."
4. Type your item (like "my lucky socks") and tap Add

**To Delete:**
1. Tap on a clothing item with a custom option
2. Find the custom item (marked with "(custom)")
3. Tap the red trash icon next to it
4. Confirm deletion

Your custom items are saved and will show up with a "(custom)" label whenever you use the app.`
  },
  {
    question: "What do the ⓘ info icons do?",
    answer: `Tap the ⓘ icon next to any clothing item to learn more about it!

**What you'll see:**
• **Description** - What the item is
• **When to wear** - Ideal conditions for this item
• **What to look for** - Key features when buying
• **Examples** - Popular brands and products
• **Budget tip** - How to save money
• **What to avoid** - Common mistakes (like cotton in cold weather)

This is especially helpful if you're new to an activity and want to understand why certain items are recommended.`
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

**Notes (Optional)**
Add comments like "should have worn heavier gloves" - these are saved with your history and shown in similar sessions.

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
    question: "Which browsers are supported?",
    answer: `For the best experience, use these browsers:

**✅ Recommended**
• **Safari** - Best for iPhone and Mac (required for iOS PWA install)
• **Chrome** - Best for Android and desktop
• **Edge** - Works great on desktop

**⚠️ Limited Support**
• **Firefox** - Works but can't install as PWA on iOS
• **Brave** - May need to disable shields for location to work

**❌ Not Supported**
• **DuckDuckGo** - Privacy controls block location services and data storage
• Other privacy-focused browsers may have similar issues

**Why privacy browsers don't work**
These browsers block features the app needs: location access for weather, localStorage for saving your history, and third-party requests for weather data.`
  },
  {
    question: "Can I switch between Celsius and Fahrenheit?",
    answer: `Yes! Go to Settings and tap °C or °F. Your preference is saved automatically.

**What changes:**
• All temperatures display in your chosen unit
• Wind speed switches too: mph for Fahrenheit, km/h for Celsius
• Weather alerts show differences in the correct unit`
  },
  {
    question: "How do sunglasses and headlamp suggestions work?",
    answer: `The app automatically suggests these based on conditions:

**Sunglasses ☀️**
Suggested when it's sunny and daytime. If it's cloudy, raining, or dark outside, they won't be recommended.

**Headlamp 🔦**
Suggested when it's dark or getting dark. The app uses actual sunrise/sunset times for your location and starts recommending a headlamp about an hour before sunset.

**Smart logic**
These are mutually exclusive - you won't see both sunglasses and headlamp suggested at the same time!`
  },
  {
    question: "What if I haven't used the app before?",
    answer: `The app works great right from the start! Without any history, it uses activity-specific defaults based on temperature:

**Example (Running):**
• **Below 25°F (-4°C)**: Base layer + fleece, tights, beanie, heavy gloves
• **25-40°F (-4 to 4°C)**: Long sleeve, tights, light gloves
• **40-55°F (4-13°C)**: Long sleeve or T-shirt, shorts or tights
• **55-65°F (13-18°C)**: T-shirt, shorts
• **Above 75°F (24°C)**: Tank top, short shorts

**Every activity has its own defaults!**
Cycling suggests jerseys and bibs. Hiking suggests layers and boots. XC Skiing suggests Nordic-specific gear. The app picks appropriate items for YOUR activity.

As you use the app and give feedback, recommendations become tailored to YOU.`
  },
  {
    question: "How do I move my data to a new phone?",
    answer: `Your history can be exported and imported:

**To Export (from your current device)**
1. Go to the History tab
2. Tap "Export" at the top
3. Save the file (email it to yourself, save to Files, etc.)

**To Import (on your new device)**
1. Go to Settings → Import Data
2. Select your exported file
3. Your history is restored!

This is the only way to transfer data since everything is stored on your device, not in the cloud.`
  },
  {
    question: "⚠️ Will I lose data if I delete the app?",
    answer: `**Yes, on iPhone/iPad!**

If you remove TrailKit from your home screen, iOS deletes all app data including your activity history and preferences.

**Before deleting or reinstalling:**
1. Go to History → tap "Export"
2. Save the CSV file somewhere safe
3. After reinstalling, import it back

**This also applies when:**
• Switching to a new iPhone
• Clearing Safari data
• Resetting your device

💡 **Tip:** Export your data periodically as a backup!`
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

export function Help({ onTermsClick }: HelpProps) {
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
          Thanks for trying TrailKit! This is a beta version, which means we're still improving it. Here's what you should know:
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
          <LimitationItem 
            icon="🌐" 
            title="Use Safari or Chrome"
            description="Privacy browsers like DuckDuckGo are not supported. Their privacy controls block features the app needs to work properly."
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
              Even if your history says otherwise, the app won't let you go out underdressed. It automatically:
            </p>
            <ul className="text-[var(--color-text-muted)] mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>Suggests warm layers, no shorts, and insulated gear in freezing weather</li>
              <li>Recommends rain gear when precipitation is detected</li>
              <li>Shows sunglasses when sunny (daytime only)</li>
              <li>Suggests headlamp starting 1 hour before sunset</li>
              <li>Picks appropriate footwear for the temperature</li>
            </ul>
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

      {/* Updates & Feedback */}
      <div className="glass-card p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Staying Updated
        </h2>
        <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
          <p>
            <strong className="text-[var(--color-text-primary)]">Check for Updates:</strong> Go to Settings and tap "Check for Updates" to get the latest version.
          </p>
          <p>
            <strong className="text-[var(--color-text-primary)]">Automatic Updates:</strong> When an update is available, you'll see a banner on the Home screen. Tap "Update Now" to refresh.
          </p>
          <p>
            <strong className="text-[var(--color-text-primary)]">Your Data is Safe:</strong> Updates don't affect your history or preferences - everything stays on your device.
          </p>
        </div>
      </div>

      {/* Feedback */}
      <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
        <p>Have questions or suggestions?</p>
        <p className="mt-1">Email us at <span className="text-[var(--color-accent)]">GetTrailKit@gmail.com</span></p>
        <p className="mt-1 opacity-75">This app is in active development and your feedback helps make it better!</p>
      </div>

      {/* Terms & Privacy Link */}
      {onTermsClick && (
        <button
          onClick={onTermsClick}
          className="w-full mt-6 glass-card p-4 flex items-center justify-between hover:bg-[rgba(255,255,255,0.08)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-left">
              <div className="font-medium">Terms & Privacy</div>
              <div className="text-sm text-[var(--color-text-muted)]">Legal info and data usage</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
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
