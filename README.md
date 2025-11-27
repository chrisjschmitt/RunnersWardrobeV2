# Runner's Wardrobe

A Progressive Web App (PWA) that recommends what to wear for your runs based on current weather conditions and your personal running history.

## Features

- **Weather Integration**: Fetches real-time weather data from OpenWeatherMap
- **CSV Import**: Upload your running history with weather and clothing data
- **Smart Recommendations**: Uses your history to suggest clothing for similar conditions
- **Offline Support**: Works offline with cached data
- **iPhone Ready**: Install directly to your home screen - no App Store needed

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Get an OpenWeatherMap API Key

1. Visit [openweathermap.org/api](https://openweathermap.org/api)
2. Create a free account
3. Go to "API Keys" in your account dashboard
4. Copy your API key

### 3. Generate PWA Icons (Optional)

The app includes placeholder icons. To generate proper icons:

1. Open `public/generate-icons.html` in a browser
2. Right-click each canvas and "Save Image As"
3. Save to the `public/` folder with the correct names:
   - `pwa-192x192.png`
   - `pwa-512x512.png`
   - `apple-touch-icon.png`

### 4. Run Development Server

```bash
npm run dev
```

Open the URL shown in your terminal (usually `http://localhost:5173`).

### 5. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

## Installing on iPhone

1. Deploy the app to a hosting service (Vercel, Netlify, or any HTTPS host)
2. Open the URL in Safari on your iPhone
3. Tap the Share button (square with arrow)
4. Scroll down and tap "Add to Home Screen"
5. Give it a name and tap "Add"

The app will now appear on your home screen and run in standalone mode!

## CSV Format

Your running history CSV should include these columns (all except `date` and `temperature` are optional):

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

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling
- **Dexie.js** for IndexedDB storage
- **vite-plugin-pwa** for PWA capabilities
- **OpenWeatherMap API** for weather data

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy!

### Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Add a new site from Git
4. Deploy!

### Manual Deployment

1. Run `npm run build`
2. Upload the `dist/` folder to any static hosting service
3. Ensure HTTPS is enabled (required for PWA features)

## Project Structure

```
src/
├── components/
│   ├── FileUpload.tsx          # CSV upload handling
│   ├── WeatherDisplay.tsx      # Weather information display
│   ├── ClothingRecommendation.tsx  # Clothing suggestions
│   ├── RunHistory.tsx          # View/manage run data
│   ├── StartRun.tsx            # Main run screen
│   └── Settings.tsx            # API key configuration
├── services/
│   ├── database.ts             # IndexedDB operations
│   ├── csvParser.ts            # CSV parsing
│   ├── weatherApi.ts           # OpenWeatherMap integration
│   └── recommendationEngine.ts # Clothing recommendation logic
├── types/
│   └── index.ts                # TypeScript interfaces
├── App.tsx                     # Main app component
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

## How Recommendations Work

The app analyzes your running history to find runs with similar weather conditions:

1. **Temperature** (most important): ±5°F
2. **Feels Like**: ±7°F
3. **Precipitation**: Whether it's raining or not
4. **Wind Speed**: ±5 mph
5. **Humidity**: ±15%
6. **Cloud Cover**: ±20%

For each clothing category, it recommends the most frequently worn item from similar conditions. A confidence score shows how reliable the recommendation is based on the number of matching historical runs.

If you have no history, the app provides sensible defaults based on general running guidelines.

## License

MIT
