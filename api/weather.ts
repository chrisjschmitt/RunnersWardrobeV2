import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon } = req.query;

  // Validate parameters
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat or lon parameter' });
  }

  // Get API key from environment variable (set in Vercel dashboard)
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Fetch both current weather and forecast in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial&cnt=3`
      )
    ]);

    if (!currentResponse.ok) {
      const errorText = await currentResponse.text();
      return res.status(currentResponse.status).json({ 
        error: 'Weather API error', 
        details: errorText 
      });
    }

    const currentData = await currentResponse.json();
    
    // Add forecast data if available
    let forecastData = null;
    if (forecastResponse.ok) {
      forecastData = await forecastResponse.json();
    }
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300'); // Cache for 5 minutes
    
    return res.status(200).json({
      current: currentData,
      forecast: forecastData
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
}
