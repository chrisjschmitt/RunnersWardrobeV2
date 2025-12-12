# TrailKit

A Progressive Web App (PWA) that recommends what to wear for outdoor activities based on current weather conditions, your personal history, and comfort feedback.

**Live App:** [gettrailkit.app](https://gettrailkit.app)

## Features

### Multi-Activity Support
Switch between 7 different outdoor activities, each with tailored clothing categories:

| Activity | Icon | Key Categories |
|----------|------|----------------|
| **Running** | 🏃 | Head, tops, bottoms, shoes, socks, gloves, rain gear, accessories |
| **Trail Running** | 🏔️ | + Hydration vest, poles, gaiters |
| **Hiking** | 🥾 | Base/mid/outer layers, pack size, trekking poles |
| **Walking** | 🚶 | Casual tops, jackets, pants, everyday shoes |
| **Cycling** | 🚴 | Helmet, jersey, bibs, arm/leg warmers, eyewear |
| **Snowshoeing** | ❄️ | Full winter layering system, gaiters, poles |
| **XC Skiing** | ⛷️ | Race suits, classic/skate boots, wax considerations |

### Core Features
- **Weather Integration**: Real-time weather data from OpenWeatherMap
- **3-Hour Forecast Alerts**: Warnings when weather is about to change
- **Smart Recommendations**: Uses your history + comfort feedback to personalize suggestions
- **CSV Import**: Upload your activity history with weather and clothing data
- **Offline Support**: Works offline with cached data
- **iPhone Ready**: Install directly to your home screen - no App Store needed

### Personalization
- **Post-Activity Feedback**: Tell the app if you were "too hot", "too cold", or "just right"
- **Learning System**: Recommendations improve based on your feedback
- **Editable Clothing**: Tap any item to change it before your activity
- **Custom Clothing Options**: Add your own items (saved per activity)
- **Unit Preferences**: Switch between Celsius/Fahrenheit and km/h/mph

### Smart Features
- **Automatic Accessories**: Recommends sunglasses when sunny, headlamp when dark
- **Rain Gear Override**: Always suggests rain protection when precipitation > 0
- **Cold Weather Override**: Recommends gloves (< 35°F) and hats (< 40°F)
- **Activity-Specific Defaults**: Sensible starting recommendations for each sport
- **Clothing Help**: Tap ⓘ on any item to see what it is, when to wear it, what to look for, and budget tips

### Developer/Testing
- **Test Mode**: Test recommendations with custom weather conditions
- **8 Weather Presets**: Freezing, Cold, Cool, Mild, Warm, Hot, Rainy, Windy
- **Custom Sliders**: Fine-tune temperature, humidity, wind, precipitation, etc.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open the URL shown in your terminal (usually `http://localhost:5173`).

### 3. Set Up Weather API

**Option A: Use Test Mode (no API key needed)**
1. Go to Settings → Test Mode → Toggle ON
2. Select a weather preset or customize conditions
3. Test recommendations without an API key

**Option B: Enter your own API key**
1. Visit [openweathermap.org/api](https://openweathermap.org/api)
2. Create a free account
3. Copy your API key
4. Go to Settings in the app and paste it

### 4. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

## Deploying to Vercel (Recommended)

Vercel deployment includes a serverless proxy that keeps your API key secure.

### Step 1: Push to GitHub

```bash
git push
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your repository
4. Vercel auto-detects Vite - click Deploy

### Step 3: Add Your API Key

1. Go to your project Settings → Environment Variables
2. Add:
   - **Name:** `OPENWEATHER_API_KEY`
   - **Value:** `your-api-key-here`
3. Redeploy (Deployments → three dots → Redeploy)

Your deployed app will automatically use the secure proxy - users won't need to enter an API key!

## Installing on iPhone

1. Deploy the app to Vercel (or any HTTPS host)
2. Open the URL in **Safari** on your iPhone
3. Tap the **Share** button (square with arrow)
4. Scroll down and tap **"Add to Home Screen"**
5. Give it a name and tap "Add"

The app will appear on your home screen and run in standalone mode!

## Using the App

### Switching Activities

1. Tap the activity dropdown in the header (shows current activity)
2. Select your activity type
3. Clothing categories automatically update
4. History is filtered to that activity

### Getting Recommendations

1. Allow location access when prompted
2. View current weather and clothing recommendations
3. Tap any clothing item to change it
4. Click "Start [Activity]!"

### After Your Activity

1. Click "End [Activity]"
2. Select how you felt: 🥶 Too Cold | 👍 Just Right | 🥵 Too Hot
3. Your feedback improves future recommendations

### Viewing History

- **My Sessions**: Activities completed through the app with feedback
- **Imported**: Activities from your CSV upload
- Tap any entry to see details
- Delete individual entries by expanding and tapping "Delete"

### Test Mode

1. Go to Settings → Test Mode → Toggle ON
2. Choose a preset (❄️ Freezing, 🌧️ Rainy, etc.) or adjust sliders
3. Go to Home to see recommendations for those conditions
4. Great for verifying the app works correctly!

## CSV Format

Your activity history CSV should include these columns (only `date` and `temperature` are required):

| Column | Description | Example |
|--------|-------------|---------|
| date | Activity date | 2024-01-15 |
| time | Activity time | 06:30 |
| location | Where you went | Central Park |
| temperature | Temperature in °F | 45 |
| feels_like | Feels like temp | 42 |
| humidity | Humidity % | 65 |
| pressure | Pressure (inHg) | 30.1 |
| precipitation | Precipitation (in) | 0 |
| uv | UV index | 2 |
| wind_speed | Wind speed (mph) | 8 |
| cloud_cover | Cloud cover % | 50 |

**Clothing columns vary by activity.** See sample CSV files in the repository for each activity type.

### Sample CSV Files

The repository includes sample data files for each activity:
- `sample-running.csv` - Running data with standard categories
- `sample-hiking.csv` - Hiking with layering system
- `sample-cycling.csv` - Cycling with bibs, jerseys, warmers
- `sample-trail-running.csv` - Trail running with hydration
- `sample-snowshoeing.csv` - Winter snowshoeing
- `sample-xc-skiing.csv` - Cross-country skiing

## How Recommendations Work

### 1. Recent Feedback Priority
If you've done the same activity in similar weather in the last 7 days, your clothing choice is used directly (95% confidence).

### 2. Historical Analysis
Compares current weather to your CSV history + older feedback, weighing factors:

| Factor | Weight |
|--------|--------|
| Temperature | Highest |
| Feels Like | High |
| Precipitation | High |
| Wind Speed | Medium |
| Humidity | Medium |
| Cloud Cover | Low |
| UV Index | Low |

### 3. Smart Voting
Similar activities "vote" for clothing items. Your feedback votes count **2x** more than CSV data.

### 4. Comfort Learning
If you consistently report "too cold", recommendations shift warmer. "Too hot" shifts lighter.

### 5. Smart Overrides
Even if voting says "None" or historical data suggests otherwise, the app will recommend:
- Rain gear when precipitation detected (rain only, not snow)
- Base layers appropriate for temperature (no T-shirts below 40°F)
- Long pants/tights when temperature < 45°F (no shorts in cold weather)
- Gloves when temperature < 35°F
- Hats when temperature < 40°F
- Sunglasses when sunny (cloud cover < 30% or UV > 3)
- Headlamp when dark (based on actual sunrise/sunset times)

### 6. Activity-Specific Defaults
With no history, sensible defaults based on temperature and activity type.

## Clothing Help System

The app includes beginner-friendly tips for 167 clothing items across all activities. Users can tap the ⓘ icon next to any recommended item to learn:

- **What it is**: Brief description of the item
- **When to wear**: Temperature ranges and conditions
- **What to look for**: Features to prioritize when buying
- **Examples**: Specific brand/product recommendations
- **Budget tip**: How to save money
- **What to avoid**: Common mistakes

### Maintaining Clothing Info

All tips are stored in `src/data/clothingInfo.ts`. See `ClothingInfoGuide.html` for:
- How recommendations were researched
- Update schedule and checklist
- Coverage report by activity
- Instructions for adding new items

**Important**: Item keys in `clothingInfo.ts` must exactly match option strings in `src/types/index.ts` (case-insensitive).

## Testing

### Automated Tests

Run the test suite before deploying:

```bash
npm run test        # Run tests once
npm run test:watch  # Watch mode for development
```

Tests are automatically run as part of `npm run build`.

### Testing First-Time User Experience

To simulate a brand new user (see onboarding, trigger first-launch tracking):

**Option 1: Browser Console**

```javascript
// Clear all first-time flags
localStorage.removeItem('trailkit_first_launch_tracked');
indexedDB.deleteDatabase('RunnersWardrobeDB');
location.reload();
```

**Option 2: DevTools UI**

1. Open DevTools → **Application** tab
2. Click **Storage** in the left sidebar
3. Click **"Clear site data"** button
4. Reload the page

**Option 3: Incognito Window**

Open the app in an Incognito/Private window for a clean slate.

After clearing, you should see:
1. Onboarding screens (swipe through all steps)
2. Tap "Get Started" to complete onboarding
3. First-launch tracking email is sent (beta only)

### Test Mode

Test recommendations without real weather data:

1. Go to Settings → Test Mode → Toggle ON
2. Choose a preset (❄️ Freezing, 🌧️ Rainy, etc.)
3. Or adjust individual sliders for custom conditions
4. Go to Home to see recommendations for those conditions

### Supported Browsers

| Browser | Status | Notes |
|---------|--------|-------|
| Safari (iOS/macOS) | ✅ Recommended | Best PWA support on Apple devices |
| Chrome (Android/Desktop) | ✅ Recommended | Best PWA support on Android |
| Edge | ✅ Supported | Works well on desktop |
| Firefox | ⚠️ Limited | Works but no PWA install on iOS |
| Brave | ⚠️ Limited | May need to disable shields |
| DuckDuckGo | ❌ Not Supported | Privacy controls block location & storage |

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling
- **Dexie.js** for IndexedDB storage
- **vite-plugin-pwa** for PWA capabilities
- **OpenWeatherMap API** for weather data
- **Vercel Serverless Functions** for secure API proxy

## Project Structure

```
├── api/
│   └── weather.ts              # Vercel serverless proxy
├── src/
│   ├── components/
│   │   ├── FileUpload.tsx      # CSV upload handling
│   │   ├── WeatherDisplay.tsx  # Weather + alerts display
│   │   ├── ClothingRecommendation.tsx
│   │   ├── ClothingPicker.tsx  # Editable clothing selector
│   │   ├── RunHistory.tsx      # View/manage activity data
│   │   ├── StartRun.tsx        # Main activity screen
│   │   ├── FeedbackModal.tsx   # Post-activity comfort feedback
│   │   ├── Settings.tsx        # Configuration + Test Mode
│   │   └── Help.tsx            # FAQ and instructions
│   ├── data/
│   │   └── clothingInfo.ts     # Beginner tips for 167 clothing items
│   ├── services/
│   │   ├── database.ts         # IndexedDB operations
│   │   ├── csvParser.ts        # CSV parsing
│   │   ├── weatherApi.ts       # Weather API + proxy
│   │   ├── recommendationEngine.ts
│   │   └── temperatureUtils.ts # °C/°F conversion
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces + activity configs
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── sample-*.csv                # Sample data for each activity
├── ClothingInfoGuide.html      # Documentation for clothing tips system
├── vercel.json                 # Vercel configuration
└── package.json
```

## Version History

- **v4.5.4**: Hidden developer debug mode (tap version 5x in Settings)
- **v4.5.3**: Fix session count display in History (use state for reactivity)
- **v4.5.2**: Fix backup reminder trigger timing, show session count in History screen
- **v4.5.1**: Change backup reminder from banner to modal popup for better visibility
- **v4.5.0**: Periodic backup reminder after 5 sessions to protect against data loss
- **v4.4.6**: Export button always visible (not hidden when current activity has no data)
- **v4.4.5**: Add FAQ warning about iOS deleting data when app removed from home screen
- **v4.4.4**: Simplify to single Export button (exports all activities)
- **v4.4.3**: Show all clothing in similar sessions (not truncated), fix comments import from CSV
- **v4.4.2**: Import summary shown as info (not warning), better success screen UX
- **v4.4.1**: Import warnings stay visible until user taps Continue
- **v4.4.0**: Export All feature (single CSV with all activities), multi-activity import (auto-sorts by activity column)
- **v4.3.0**: Export All button in history, unified CSV format with activity column
- **v4.2.1**: Dynamic clothing display in history (shows all categories for each activity)
- **v4.2.0**: Location tracking in beta emails, comments in CSV export, iOS Safari export fix, confidence display fix
- **v4.1.0**: Beta tracking (first-launch device info), Terms & Privacy page, bot detection
- **v4.0.1**: Help moved to main navigation, Import Data in Settings, UX improvements
- **v4.0.0**: Rebranded to TrailKit, similar sessions display (tap banner to see details), notes on feedback, headlamp 60 min before sunset
- **v3.5.1**: Comprehensive test suite (110+ tests), tests run on build
- **v3.5.0**: Activity-specific temperature defaults - each activity now has tailored recommendations for 7 temperature ranges (freezing to hot)
- **v3.4.3**: Restore delete button for custom clothing items
- **v3.4.2**: Fix shorts being recommended in freezing weather (added bottoms safety override)
- **v3.4.1**: Added 9 missing clothing info entries (wool socks, sandals, XC ski tops, base layers)
- **v3.4.0**: Clothing help feature - tap ⓘ for beginner-friendly tips on 167 items
- **v3.3.7**: ClothingPicker modal positioning improvements for Safari iOS
- **v3.3.2**: Wind speed displays in km/h when Celsius is selected (metric consistency)
- **v3.2.0**: Walking activity added with casual clothing options
- **v3.1.7**: Check for app updates on Refresh button tap
- **v3.1.6**: Smart cold weather overrides (prevents T-shirt in freezing weather)
- **v3.1.5**: Fix rain gear recommendation in snowy conditions
- **v3.1.4**: Sunrise/sunset times on Home screen
- **v3.1.3**: "Check for Updates" button in Settings
- **v3.1.2**: Smarter accessory logic (uses actual sunrise/sunset times)
- **v3.1.1**: Activity-specific text fixes, generic "Ready to Go?" prompt
- **v3.1.0**: Onboarding flow for new users, CSV export feature
- **v3.0.0**: Multi-activity support (Running, Trail Running, Hiking, Cycling, Snowshoeing, XC Skiing), smart accessories (sunglasses/headlamp), activity-specific clothing categories
- **v2.0.2**: Fix date display timezone issues
- **v2.0.1**: Smart overrides for rain/cold gear
- **v2.0.0**: Test Mode for custom weather conditions
- **v1.9.0**: 3-hour forecast weather change alerts
- **v1.8.0**: Vercel serverless proxy for secure API
- **v1.7.0**: Delete individual runs
- **v1.6.0**: History shows both CSV and feedback runs
- **v1.5.0**: Help & FAQ section
- **v1.4.0**: Recent feedback priority in recommendations
- **v1.3.0**: Custom clothing options persist
- **v1.2.0**: Editable clothing recommendations
- **v1.1.0**: Post-run feedback system
- **v1.0.0**: Initial release

## License

MIT
