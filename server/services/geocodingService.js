import axios from "axios";

/**
 * Convert place name and city into geographical coordinates using Google Maps Data.
 * @param {string} placeName - For example "Eiffel Tower"
 * @param {string} city - The broader city context like "Paris"
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function getCoordinates(placeName, city) {
    try {
        const query = `${placeName} ${city}`;
        const url = `https://maps.googleapis.com/maps/api/geocode/json`;

        const response = await axios.get(url, {
            params: {
                address: query,
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        });

        if (!response.data || !response.data.results || response.data.results.length === 0) {
            console.log(`[geocodingService] Could not find coordinates for: ${query}`);
            return null;
        }

        const location = response.data.results[0].geometry.location;

        return {
            lat: location.lat,
            lng: location.lng
        };
    } catch (error) {
        console.error(`[geocodingService] Error fetching coordinates for ${placeName}:`, error.message);
        return null;
    }
}
