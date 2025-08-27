# Weather API Setup for BiteTracker

## Overview

The BiteTracker application now includes a weather feature that shows historical weather conditions for each catch. This feature displays:

- **Air Temperature** (°F)
- **Air Pressure** (hPa)
- **Cloud Cover** (%)
- **Weather Conditions** (description)
- **Moon Phase** (calculated)
- **Wind Speed** (mph)

## Current Implementation

The weather feature is currently implemented using the **OpenWeatherMap API** for current weather data. For historical weather data, you would need a paid subscription to OpenWeatherMap's historical data API.

### Demo Mode

In the current implementation:
- The app shows current weather conditions for the catch location
- Moon phase is calculated based on the catch date
- A note explains that historical data requires a paid API subscription

## Setting Up Weather API

### 1. Get OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/)
2. Sign up for a free account
3. Navigate to "API keys" section
4. Generate a new API key
5. Wait for the key to activate (may take a few hours)

### 2. Add API Key to Environment

Add your API key to your `.env.local` file in the frontend directory:

```env
REACT_APP_OPENWEATHER_API_KEY=your_api_key_here
```

### 3. For Historical Weather Data

To get true historical weather data for the exact catch date and time:

1. **Upgrade to OpenWeatherMap Pro Plan** ($40/month)
2. Use the historical data endpoint: `https://api.openweathermap.org/data/2.5/onecall/timemachine`
3. Update the `fetchWeatherData` function in `ViewCatches.js`

## Alternative Weather APIs

### Visual Crossing Weather API
- Offers 1000 free requests per day
- Historical data available
- Good documentation

### WeatherAPI.com
- Free tier includes historical data
- 1 million requests per month
- Simple integration

### Weatherbit
- Free tier with historical data
- 500 requests per day
- Good for small applications

## Implementation Notes

### Coordinate Parsing
The app parses GPS coordinates from various formats:
- `24°50'42"S 29°26'16"E`
- `24.845 -29.437`
- `24.845, -29.437`

### Moon Phase Calculation
Moon phase is calculated using a simple algorithm based on:
- Known new moon date (January 6, 2000)
- Lunar cycle length (29.53058867 days)
- Catch date calculation

### Error Handling
The weather modal handles various error scenarios:
- Invalid coordinates
- API rate limits
- Network errors
- Missing API key

## Usage

1. **View Catches** page shows a cloud icon (☁️) next to each location
2. Click the cloud icon to view weather conditions
3. Modal displays comprehensive weather information
4. Includes fishing tips based on weather conditions

## Future Enhancements

- **Weather Alerts**: Show weather warnings for fishing locations
- **Fishing Forecast**: Predict optimal fishing conditions
- **Weather Trends**: Show weather patterns over time
- **Multiple API Support**: Fallback to different weather services
- **Offline Caching**: Store weather data locally

## Troubleshooting

### Common Issues

1. **"Failed to fetch weather data"**
   - Check API key is valid and active
   - Verify API key is in environment variables
   - Check network connectivity

2. **"Could not parse location coordinates"**
   - Ensure GPS coordinates are in supported format
   - Check for typos in location data

3. **Rate limiting errors**
   - Upgrade to paid plan for higher limits
   - Implement request caching
   - Add delay between requests

### Debug Mode

To debug weather API calls, check the browser console for:
- API request URLs
- Response data
- Error messages

## Security Notes

- Never commit API keys to version control
- Use environment variables for all API keys
- Consider implementing API key rotation
- Monitor API usage to prevent abuse
