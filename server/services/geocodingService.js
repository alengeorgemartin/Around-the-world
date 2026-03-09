import axios from "axios";

// ✅ BUG 2 FIX: Known placeholder value — treat as missing key
const FALLBACK_PLACEHOLDER = "your_key_here";

/**
 * Fallback to Nominatim (OpenStreetMap) geocoding.
 */
async function getCoordinatesNominatim(placeName, city) {
    try {
        const query = `${placeName}, ${city}`;
        const url = `https://nominatim.openstreetmap.org/search`;

        const response = await axios.get(url, {
            params: { q: query, format: "json", limit: 1 },
            headers: {
                "User-Agent": "AITravelPlanner/1.0"
            },
            timeout: 5000,
        });

        if (!response.data || response.data.length === 0) {
            console.log(`[geocodingService-Nominatim] No results for: ${query}`);
            return null;
        }

        const location = response.data[0];
        console.log(`[geocodingService-Nominatim] ✅ ${placeName} → lat:${location.lat}, lng:${location.lon}`);

        // Nominatim returns lat/lon as strings, we need numbers
        return { lat: parseFloat(location.lat), lng: parseFloat(location.lon) };
    } catch (error) {
        console.error(`[geocodingService-Nominatim] ❌ Error fetching coordinates for "${placeName}":`, error.message);
        return null;
    }
}

/**
 * Convert place name and city into geographical coordinates using Google Maps Geocoding API.
 * @param {string} placeName - For example "Eiffel Tower"
 * @param {string} city - The broader city context like "Paris"
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function getCoordinates(placeName, city) {
    // ✅ BUG 2 FIX: Guard — bail out early if key is missing or still placeholder
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === FALLBACK_PLACEHOLDER) {
        console.warn(`[geocodingService] ⚠️ GOOGLE_MAPS_API_KEY is not set or is placeholder. Falling back to Nominatim for: "${placeName}"`);
        return await getCoordinatesNominatim(placeName, city);
    }

    try {
        const query = `${placeName}, ${city}`;
        const url = `https://maps.googleapis.com/maps/api/geocode/json`;

        const response = await axios.get(url, {
            params: { address: query, key: apiKey },
            timeout: 5000, // 5s timeout to avoid hanging the background task
        });

        // Check for API-level errors (e.g. invalid key, quota exceeded)
        if (response.data.status !== "OK") {
            console.warn(`[geocodingService] ⚠️ API returned status "${response.data.status}" for: ${query}`);
            if (response.data.status === "REQUEST_DENIED") {
                console.error(`[geocodingService] ❌ REQUEST_DENIED — check that Geocoding API is enabled in Google Cloud Console and billing is active. Falling back to Nominatim.`);
            }
            return await getCoordinatesNominatim(placeName, city);
        }

        if (!response.data.results || response.data.results.length === 0) {
            console.log(`[geocodingService] No results for: ${query}. Falling back to Nominatim.`);
            return await getCoordinatesNominatim(placeName, city);
        }

        const location = response.data.results[0].geometry.location;
        console.log(`[geocodingService] ✅ ${placeName} → lat:${location.lat}, lng:${location.lng}`);

        return { lat: location.lat, lng: location.lng };
    } catch (error) {
        console.error(`[geocodingService] ❌ Error fetching coordinates for "${placeName}":`, error.message);
        console.log(`[geocodingService] Falling back to Nominatim.`);
        return await getCoordinatesNominatim(placeName, city);
    }
}
