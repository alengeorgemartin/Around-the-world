const AVG_SPEED_KMH = 30; // average inner-city travel speed

/**
 * Distance calculation using Haversine formula
 * @param {Object} a - {lat, lng}
 * @param {Object} b - {lat, lng}
 * @returns {number} Distance in km
 */
function distance(a, b) {
    if (!a || !b || typeof a.lat !== 'number' || typeof b.lat !== 'number') return Infinity;

    const R = 6371; // Earth Radius in km
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;

    const x =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(a.lat * Math.PI / 180) *
        Math.cos(b.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return R * c;
}

/**
 * Converts "HH:MM" (24h) string into minutes past midnight
 * @param {string} timeStr - Time string
 * @returns {number} Minutes past midnight
 */
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const hours = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    return hours * 60 + mins;
};

/**
 * Optimizes a daily itinerary by traveling to the nearest unvisited neighbor,
 * while honoring Time Window (VRPTW) constraints.
 * @param {Array} activities - Array of places with `.geo` properties and `.timeWindow`
 * @returns {Array} Optimized itinerary route
 */
export function optimizeDailyRoute(activities) {
    if (!activities || !activities.length) return activities;

    // Separate geocoded places from unknown places
    const geocoded = activities.filter(a => a.geo && a.geo.lat);
    const unknown = activities.filter(a => !a.geo || !a.geo.lat);

    if (geocoded.length <= 1) return activities;

    const visited = [];
    let current = geocoded[0];
    visited.push(current);

    const remaining = geocoded.slice(1);

    // Initialize time tracking (start at 9:00 AM)
    let currentTime = 540;
    
    // Add time for the very first activity
    const firstDuration = current.durationMinutes || 120;
    const firstOpen = timeToMinutes(current.timeWindow?.open || "00:00");
    currentTime = Math.max(currentTime, firstOpen) + firstDuration;

    while (remaining.length) {
        let nearestIndex = 0;
        let bestScore = Infinity; // distance + waiting penalties
        let chosenNextTime = currentTime;

        remaining.forEach((place, index) => {
            const dist = distance(current.geo, place.geo);
            const travelTimeMinutes = (dist / AVG_SPEED_KMH) * 60;
            const expectedArrival = currentTime + travelTimeMinutes;

            const openTime = timeToMinutes(place.timeWindow?.open || "00:00");
            let closeTime = timeToMinutes(place.timeWindow?.close || "23:59");
            if (closeTime < openTime) closeTime += 24 * 60; // Adjust overnight wrap-around
            const duration = place.durationMinutes || 120; // Default 2 hours

            let score = dist;
            let actualArrival = expectedArrival;

            // Arriving too early -> wait penalty
            if (expectedArrival < openTime) {
                const waitTime = openTime - expectedArrival;
                // Add distance penalty based on wait time to discourage picking places not open yet
                score += (waitTime * 0.5); 
                actualArrival = openTime;
            }

            // Arriving too late or finishing too late -> reject
            if (actualArrival + duration > closeTime) {
                score = Infinity;
            }

            if (score < bestScore) {
                bestScore = score;
                nearestIndex = index;
                chosenNextTime = actualArrival + duration;
            }
        });

        // Fallback: If ALL remaining are rejected due to time windows, pick the physically closest one
        if (bestScore === Infinity) {
            let closestDist = Infinity;
            remaining.forEach((place, index) => {
                const dist = distance(current.geo, place.geo);
                if (dist < closestDist) {
                    closestDist = dist;
                    nearestIndex = index;
                }
            });
            const selectedPlace = remaining[nearestIndex];
            const dist = closestDist;
            const travelTimeMinutes = (dist / AVG_SPEED_KMH) * 60;
            chosenNextTime = currentTime + travelTimeMinutes + (selectedPlace.durationMinutes || 120);
        }

        current = remaining.splice(nearestIndex, 1)[0];
        visited.push(current);
        currentTime = chosenNextTime;
    }

    // Push un-geocoded places back to the end of the day to make sure we don't drop user data
    return [...visited, ...unknown];
}
