import fetch from "node-fetch";

/* ======================================================
   WEATHER SERVICE - Open-Meteo API Integration
====================================================== */

/**
 * Geocode a location to get coordinates for weather API
 * Uses Nominatim API (same as existing geocoding)
 */
async function getCoordinates(location) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
                location
            )}`,
            {
                headers: {
                    "User-Agent": "AI-Trip-Planner/1.0",
                    "Accept-Language": "en",
                },
            }
        );

        const data = await res.json();
        if (data && data.length) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
            };
        }

        return null;
    } catch (err) {
        console.error("❌ Geocoding error:", err.message);
        return null;
    }
}

/**
 * Classify weather condition into activity-friendly categories
 */
function classifyWeather(weatherCode, rainProbability, tempMax, tempMin) {
    // WMO Weather interpretation codes
    // 0: Clear sky
    // 1-3: Mainly clear, partly cloudy, overcast
    // 45-48: Fog
    // 51-67: Rain (various intensities)
    // 71-77: Snow
    // 80-99: Rain showers, thunderstorms

    // Extreme temperature check
    const avgTemp = (tempMax + tempMin) / 2;
    if (avgTemp > 40 || avgTemp < 0) {
        return "restricted";
    }

    // Heavy rain or storms
    if (weatherCode >= 61 || rainProbability > 70) {
        return "indoor-preferred";
    }

    // Light rain or high rain probability
    if (weatherCode >= 51 || rainProbability > 40) {
        return "indoor-preferred";
    }

    // Snow
    if (weatherCode >= 71 && weatherCode <= 77) {
        return "indoor-preferred";
    }

    // Good weather
    return "outdoor-friendly";
}

/**
 * Get human-readable weather condition
 */
function getWeatherCondition(weatherCode) {
    if (weatherCode === 0) return "Clear Sky";
    if (weatherCode >= 1 && weatherCode <= 3) return "Partly Cloudy";
    if (weatherCode >= 45 && weatherCode <= 48) return "Foggy";
    if (weatherCode >= 51 && weatherCode <= 55) return "Light Rain";
    if (weatherCode >= 56 && weatherCode <= 57) return "Freezing Rain";
    if (weatherCode >= 61 && weatherCode <= 65) return "Rain";
    if (weatherCode >= 66 && weatherCode <= 67) return "Freezing Rain";
    if (weatherCode >= 71 && weatherCode <= 75) return "Snow";
    if (weatherCode >= 77) return "Snow Showers";
    if (weatherCode >= 80 && weatherCode <= 82) return "Rain Showers";
    if (weatherCode >= 85 && weatherCode <= 86) return "Snow Showers";
    if (weatherCode >= 95) return "Thunderstorm";
    return "Cloudy";
}

/**
 * Fetch weather forecast for a location and date range
 * @param {string} location - Destination location
 * @param {string} startDate - Trip start date (YYYY-MM-DD)
 * @param {number} days - Number of days for the trip
 * @returns {Array} Array of daily weather objects or empty array if failed
 */
export async function getWeatherForecast(location, startDate, days) {
    try {
        console.log(`🌦️  Fetching weather for ${location}, ${days} days from ${startDate}`);

        // Get coordinates for the location
        const coords = await getCoordinates(location);
        if (!coords) {
            console.warn("⚠️ Could not geocode location for weather");
            return [];
        }

        // Calculate end date
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + days - 1);

        const startDateStr = start.toISOString().split("T")[0];
        const endDateStr = end.toISOString().split("T")[0];

        // Check if start date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            console.warn("⚠️ Start date is in the past, using current date");
            const newStart = new Date(today);
            const newStartStr = newStart.toISOString().split("T")[0];
            return getWeatherForecast(location, newStartStr, days);
        }

        // Check if date is too far in future (Open-Meteo supports ~16 days)
        const maxForecastDate = new Date(today);
        maxForecastDate.setDate(maxForecastDate.getDate() + 14);

        if (start > maxForecastDate) {
            console.warn("⚠️ Trip date is beyond forecast range (14 days)");
            return []; // Return empty, will use fallback
        }

        // Fetch weather data from Open-Meteo
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${startDateStr}&end_date=${endDateStr}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.daily) {
            console.warn("⚠️ No daily weather data received");
            return [];
        }

        // Parse and structure weather data
        const weatherData = [];
        for (let i = 0; i < days && i < data.daily.time.length; i++) {
            const weatherCode = data.daily.weather_code[i];
            const tempMax = data.daily.temperature_2m_max[i];
            const tempMin = data.daily.temperature_2m_min[i];
            const rainProb = data.daily.precipitation_probability_max[i] || 0;

            const classification = classifyWeather(weatherCode, rainProb, tempMax, tempMin);
            const condition = getWeatherCondition(weatherCode);

            weatherData.push({
                day: i + 1,
                date: data.daily.time[i],
                condition: condition,
                temperature: `${Math.round(tempMin)}–${Math.round(tempMax)}°C`,
                rainProbability: rainProb,
                classification: classification,
                alerts: classification === "restricted" ? ["Extreme weather conditions"] : [],
            });
        }

        console.log(`✅ Weather data fetched: ${weatherData.length} days`);
        return weatherData;
    } catch (err) {
        console.error("❌ Weather fetch error:", err.message);
        return []; // Return empty array on error - graceful fallback
    }
}

/**
 * Build weather context string for AI prompts
 */
export function buildWeatherContext(weatherData, dayNumber) {
    if (!weatherData || weatherData.length === 0) {
        return "";
    }

    const dayWeather = weatherData.find((w) => w.day === dayNumber);
    if (!dayWeather) {
        return "";
    }

    let context = `Weather: ${dayWeather.condition}, ${dayWeather.temperature}`;

    if (dayWeather.classification === "indoor-preferred") {
        context += ". PRIORITIZE indoor activities (museums, cafes, shopping, indoor attractions)";
    } else if (dayWeather.classification === "restricted") {
        context += ". AVOID outdoor activities due to extreme conditions";
    } else if (dayWeather.classification === "outdoor-friendly") {
        context += ". EXCELLENT for outdoor activities";
    }

    if (dayWeather.rainProbability > 50) {
        context += `. Rain probability: ${dayWeather.rainProbability}%`;
    }

    return context;
}

/**
 * Determine if an activity is indoor or outdoor (simple heuristic)
 */
export function isIndoorActivity(activityName) {
    const indoor = [
        "museum",
        "mall",
        "shopping",
        "restaurant",
        "cafe",
        "gallery",
        "theater",
        "cinema",
        "temple",
        "church",
        "mosque",
        "palace",
        "fort",
        "aquarium",
        "zoo",
        "market",
        "bazaar",
    ];

    const activityLower = activityName.toLowerCase();
    return indoor.some((keyword) => activityLower.includes(keyword));
}
