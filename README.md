# Runner's Wardrobe

A Progressive Web App (PWA) that recommends what to wear for your runs based on current weather conditions, your personal running history, and comfort feedback.

## Features

### Core Features
- **Weather Integration**: Real-time weather data from OpenWeatherMap
- **3-Hour Forecast Alerts**: Warnings when weather is about to change (temperature drops, rain coming, etc.)
- **Smart Recommendations**: Uses your history + comfort feedback to personalize suggestions
- **CSV Import**: Upload your running history with weather and clothing data
- **Offline Support**: Works offline with cached data
- **iPhone Ready**: Install directly to your home screen - no App Store needed

### Personalization
- **Post-Run Feedback**: Tell the app if you were "too hot", "too cold", or "just right"
- **Learning System**: Recommendations improve based on your feedback
- **Editable Clothing**: Tap any item to change it before your run
- **Custom Clothing Options**: Add your own clothing items (saved for future use)
- **Temperature Unit Toggle**: Switch between Celsius and Fahrenheit

### Smart Overrides
Even if your history doesn't have data for certain conditions, the app will recommend:
- **Rain gear** when precipitation > 0 or rain in forecast
- **Gloves** when temperature < 35°F
- **Beanie/headband** when temperature < 40°F

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

### Getting Recommendations

1. Allow location access when prompted
2. View current weather and clothing recommendations
3. Tap any clothing item to change it
4. Click "Start Your Run!"

### After Your Run

1. Click "End Run"
2. Select how you felt: 🥶 Too Cold | 👍 Just Right | 🥵 Too Hot
3. Your feedback improves future recommendations

### Viewing History

- **My Runs**: Runs completed through the app with feedback
- **Imported**: Runs from your CSV upload
- Tap any run to see details
- Delete individual runs by expanding and tapping "Delete"

### Test Mode

1. Go to Settings → Test Mode → Toggle ON
2. Choose a preset (❄️ Freezing, 🌧️ Rainy, etc.) or adjust sliders
3. Go to Home to see recommendations for those conditions
4. Great for verifying the app works correctly!

## CSV Format

Your running history CSV should include these columns (only `date` and `temperature` are required):

| Column | Description | Example |
|--------|-------------|---------|
| date | Run date | 2024-01-15 |
| time | Run time | 06:30 |
| location | Where you ran | Central Park |
| temperature | Temperature in °F | 45 |
| feels_like | Feels like temp | 42 |
| humidity | Humidity % | 65 |
| pressure | Pressure (inHg) | 30.1 |
| precipitation | Precipitation (in) | 0 |
| uv | UV index | 2 |
| wind_speed | Wind speed (mph) | 8 |
| cloud_cover | Cloud cover % | 50 |
| head_cover | Head covering | beanie, cap, none |
| tops | Upper body clothing | t-shirt, long sleeve |
| bottoms | Lower body clothing | shorts, tights |
| shoes | Running shoes | Brooks Ghost |
| socks | Sock type | wool, regular |
| gloves | Glove type | none, light, heavy |
| rain_gear | Rain protection | none, jacket |

### Example CSV

```csv
date,time,location,temperature,feels_like,humidity,wind_speed,cloud_cover,head_cover,tops,bottoms,shoes,socks,gloves,rain_gear
2024-01-15,06:30,Central Park,45,42,65,8,50,none,long sleeve,tights,Brooks Ghost,wool,light,none
2024-01-20,07:00,Central Park,28,22,55,12,20,beanie,base layer + jacket,tights,Brooks Ghost,wool,heavy,none
2024-02-05,06:00,Riverside,52,50,70,5,80,none,t-shirt,shorts,Nike Pegasus,regular,none,none
```

## How Recommendations Work

### 1. Recent Feedback Priority
If you've run in similar weather in the last 7 days, your clothing choice is used directly (95% confidence).

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
Similar runs "vote" for clothing items. Your feedback votes count **2x** more than CSV data.

### 4. Comfort Learning
If you consistently report "too cold", recommendations shift warmer. "Too hot" shifts lighter.

### 5. Smart Overrides
Even if voting says "None", the app will recommend rain gear, gloves, or hats when conditions warrant.

### 6. Fallback Defaults
With no history, sensible defaults based on temperature ranges:
- **< 40°F**: Beanie, jacket, tights, heavy gloves
- **40-55°F**: Long sleeve, tights, light gloves
- **55-65°F**: T-shirt, shorts or capris
- **65-75°F**: T-shirt, shorts
- **> 75°F**: Singlet, short shorts, cap

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
│   │   ├── RunHistory.tsx      # View/manage run data
│   │   ├── StartRun.tsx        # Main run screen
│   │   ├── FeedbackModal.tsx   # Post-run comfort feedback
│   │   ├── Settings.tsx        # Configuration + Test Mode
│   │   └── Help.tsx            # FAQ and instructions
│   ├── services/
│   │   ├── database.ts         # IndexedDB operations
│   │   ├── csvParser.ts        # CSV parsing
│   │   ├── weatherApi.ts       # Weather API + proxy
│   │   ├── recommendationEngine.ts
│   │   └── temperatureUtils.ts # °C/°F conversion
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vercel.json                 # Vercel configuration
└── package.json
```

## Version History

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
