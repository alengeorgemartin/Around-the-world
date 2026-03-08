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
 * Optimizes a daily itinerary by traveling to the nearest unvisited neighbor
 * @param {Array} activities - Array of places with `.geo` properties containing `lat` and `lng`
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

    while (remaining.length) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        remaining.forEach((place, index) => {
            const d = distance(current.geo, place.geo);
            if (d < nearestDistance) {
                nearestDistance = d;
                nearestIndex = index;
            }
        });

        current = remaining.splice(nearestIndex, 1)[0];
        visited.push(current);
    }

    // Push un-geocoded places back to the end of the day to make sure we don't drop user data
    return [...visited, ...unknown];
}
