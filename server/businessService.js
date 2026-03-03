import Business from "./models/Business.js";

/* ======================================================
   BUSINESS SERVICE - AI Integration Layer
   
   Fetches and filters businesses for trip planning:
   - Hotels near itinerary locations
   - Vehicle rentals at start location
   - Tours matching daily activities
   
   Used by AI controller for intelligent business selection
====================================================== */

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lng - point1.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(point1.lat)) *
        Math.cos(toRad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return (degrees * Math.PI) / 180;
}

/**
 * Map user budget to compatible business price ranges
 */
function getBudgetCompatibility(userBudget) {
    const budgetMap = {
        budget: ["budget"],
        moderate: ["budget", "moderate"],
        luxury: ["budget", "moderate", "luxury"],
        cheap: ["budget"],
        expensive: ["luxury"],
    };

    const normalized = userBudget?.toLowerCase() || "moderate";
    return budgetMap[normalized] || ["budget", "moderate"];
}

/**
 * Get capacity requirements based on travel group
 */
function getCapacityRequirement(travelWith) {
    const capacityMap = {
        solo: 1,
        couple: 2,
        family: 4,
        friends: 4,
        group: 6,
    };

    const normalized = travelWith?.toLowerCase() || "couple";
    return capacityMap[normalized] || 2;
}

/**
 * Get maximum price per night based on budget
 */
function getBudgetMaxPrice(budget) {
    const priceMap = {
        budget: 2000,
        moderate: 5000,
        luxury: 15000,
        cheap: 1500,
        expensive: 20000,
    };
    const normalized = budget?.toLowerCase() || "moderate";
    return priceMap[normalized] || 5000;
}

/**
 * Select best room from hotel based on budget and group size
 * @param {Object} hotel - Hotel with rooms array
 * @param {string} budget - User budget
 * @param {string} travelWith - Travel group type
 * @returns {Object} { hotel, selectedRoom, allRooms }
 */
export function selectBestRoom(hotel, budget, travelWith) {
    // If hotel doesn't have rooms array, return default structure
    if (!hotel.hotelDetails?.rooms || hotel.hotelDetails.rooms.length === 0) {
        return {
            hotel,
            selectedRoom: {
                type: "Standard Room",
                pricePerNight: hotel.pricePerNight || 0,
                amenities: [],
                capacity: 2,
            },
            allRooms: []
        };
    }

    const maxPrice = getBudgetMaxPrice(budget);
    const minCapacity = getCapacityRequirement(travelWith);

    // Filter suitable rooms (within budget, sufficient capacity, available)
    const suitableRooms = hotel.hotelDetails.rooms.filter(
        room =>
            room.available &&
            room.pricePerNight <= maxPrice &&
            room.capacity >= minCapacity
    );

    // If no suitable rooms, get cheapest available
    let selectedRoom;
    if (suitableRooms.length === 0) {
        const availableRooms = hotel.hotelDetails.rooms.filter(r => r.available);
        selectedRoom = availableRooms.sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
    } else {
        // Select best room: highest price within budget (best value)
        selectedRoom = suitableRooms.sort((a, b) => b.pricePerNight - a.pricePerNight)[0];
    }

    return {
        hotel,
        selectedRoom,
        allRooms: hotel.hotelDetails.rooms.filter(r => r.available)
    };
}

/**
 * Find hotels near trip location
 * @param {string} location - City/location name
 * @param {number} days - Trip duration
 * @param {string} budget - User budget preference
 * @param {Array} itinerary - Array of daily itinerary objects with geo locations
 * @returns {Array} Sorted hotels by relevance
 */
export async function findHotelsForTrip(location, days, budget, itinerary = []) {
    try {
        const budgetRanges = getBudgetCompatibility(budget);

        // Extract city name from location
        const city = location.split(",")[0].trim();

        // Find hotels in the city (all ratings shown, sorted by rating)
        let hotels = await Business.find({
            businessType: "hotel",
            status: "approved",
            "availability.isAvailable": true,
            "location.city": new RegExp(city, "i"),
            priceRange: { $in: budgetRanges },
        })
            .sort({ "stats.averageRating": -1 }) // Prioritize higher-rated, but show all
            .limit(10)
            .lean();

        // If we have itinerary with geo data, calculate average center point
        if (itinerary.length > 0 && hotels.length > 0) {
            const geoPoints = [];
            itinerary.forEach((day) => {
                ["morning", "afternoon", "evening"].forEach((period) => {
                    if (day[period] && day[period].length > 0) {
                        day[period].forEach((activity) => {
                            if (activity.geo?.lat && activity.geo?.lng) {
                                geoPoints.push(activity.geo);
                            }
                        });
                    }
                });
            });

            if (geoPoints.length > 0) {
                // Calculate center of all activities
                const centerLat = geoPoints.reduce((sum, p) => sum + p.lat, 0) / geoPoints.length;
                const centerLng = geoPoints.reduce((sum, p) => sum + p.lng, 0) / geoPoints.length;

                // Calculate distance for each hotel
                hotels = hotels.map((hotel) => {
                    const distance = calculateDistance(
                        { lat: centerLat, lng: centerLng },
                        {
                            lat: hotel.location.geo.coordinates[1],
                            lng: hotel.location.geo.coordinates[0],
                        }
                    );
                    return { ...hotel, distanceFromActivities: distance };
                });

                // Sort by distance
                hotels.sort((a, b) => a.distanceFromActivities - b.distanceFromActivities);
            }
        }

        console.log(`🏨 Found ${hotels.length} hotels in ${city}`);
        return hotels;
    } catch (err) {
        console.error("❌ Error finding hotels:", err.message);
        return [];
    }
}

/**
 * Find vehicle rentals at start location
 * @param {string} startLocation - Starting point of trip
 * @param {string} travelWith - Travel group type
 * @param {string} budget - User budget
 * @returns {Array} Suitable rentals
 */
export async function findVehicleRentals(startLocation, travelWith, budget) {
    try {
        const budgetRanges = getBudgetCompatibility(budget);
        const minCapacity = getCapacityRequirement(travelWith);

        const city = startLocation.split(",")[0].trim();

        const rentals = await Business.find({
            businessType: "rental",
            status: "approved",
            "availability.isAvailable": true,
            "location.city": new RegExp(city, "i"),
            priceRange: { $in: budgetRanges },
            "rentalDetails.capacity": { $gte: minCapacity },
        })
            .limit(5)
            .lean();

        console.log(`🚗 Found ${rentals.length} vehicle rentals in ${city}`);
        return rentals;
    } catch (err) {
        console.error("❌ Error finding rentals:", err.message);
        return [];
    }
}

/**
 * Find tours suitable for a specific day
 * @param {Object} dayItinerary - Itinerary for the day
 * @param {Object} dayWeather - Weather for the day
 * @param {Array} preferences - User preferences
 * @param {string} location - Trip location
 * @param {string} budget - User budget
 * @returns {Array} Matching tours
 */
export async function findToursForDay(
    dayItinerary,
    dayWeather,
    preferences,
    location,
    budget
) {
    try {
        const budgetRanges = getBudgetCompatibility(budget);
        const city = location.split(",")[0].trim();

        // Build preference-based filter
        const preferenceTypes = [];
        if (preferences.includes("Adventure")) preferenceTypes.push("Adventure");
        if (preferences.includes("Culture") || preferences.includes("History"))
            preferenceTypes.push("Cultural", "Historical");
        if (preferences.includes("Nature")) preferenceTypes.push("Nature");
        if (preferences.includes("Food") || preferences.includes("Foody"))
            preferenceTypes.push("Food");

        const query = {
            businessType: "tour",
            status: "approved",
            "availability.isAvailable": true,
            "location.city": new RegExp(city, "i"),
            priceRange: { $in: budgetRanges },
        };

        // Add preference filter if available
        if (preferenceTypes.length > 0) {
            query["tourDetails.tourType"] = { $in: preferenceTypes };
        }

        // Weather-based filtering
        if (dayWeather) {
            if (dayWeather.classification === "indoor-preferred") {
                query["tourDetails.weatherSuitability"] = { $in: ["indoor", "all-weather"] };
            } else if (dayWeather.classification === "restricted") {
                query["tourDetails.weatherSuitability"] = "indoor";
            }
        }

        const tours = await Business.find(query).limit(3).lean();

        return tours;
    } catch (err) {
        console.error("❌ Error finding tours:", err.message);
        return [];
    }
}

/**
 * Main function: Get all businesses for a trip
 * @param {Object} tripData - Trip parameters
 * @returns {Object} { hotels, rentals, tours }
 */
export async function getBusinessesForTrip(tripData) {
    const {
        location,
        startLocation,
        budget,
        days,
        travelWith,
        weatherData = [],
        itinerary = [],
        preferences = [],
    } = tripData;

    try {
        console.log("🔍 Fetching businesses for trip...");

        // Fetch hotels
        const hotels = await findHotelsForTrip(location, days, budget, itinerary);

        // Fetch rentals (only if multi-day trip)
        let rentals = [];
        if (days > 1) {
            rentals = await findVehicleRentals(startLocation || location, travelWith, budget);
        }

        // Fetch tours (general, will be filtered per day later)
        const tours = await Business.find({
            businessType: "tour",
            status: "approved",
            "availability.isAvailable": true,
            "location.city": new RegExp(location.split(",")[0], "i"),
            priceRange: { $in: getBudgetCompatibility(budget) },
        })
            .limit(10)
            .lean();

        return {
            hotels,
            rentals,
            tours,
        };
    } catch (err) {
        console.error("❌ Error fetching businesses:", err.message);
        return { hotels: [], rentals: [], tours: [] };
    }
}

/**
 * Select best hotel from available options with room selection
 * @param {Array} hotels - Available hotels
 * @param {Object} tripData - Trip information {budget, travelWith}
 * @returns {Object|null} Selected hotel with recommended room
 */
export function selectBestHotel(hotels, tripData) {
    if (hotels.length === 0) return null;

    const { budget, travelWith } = tripData;

    // Select hotel (based on distance or rating)
    let selectedHotel;
    if (hotels[0].distanceFromActivities !== undefined) {
        selectedHotel = hotels[0]; // Already sorted by distance
    } else {
        // Sort by rating
        const sorted = hotels.sort((a, b) => {
            return (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0);
        });
        selectedHotel = sorted[0];
    }

    // Select best room within the hotel
    const roomSelection = selectBestRoom(selectedHotel, budget, travelWith);

    return {
        ...selectedHotel,
        selectedRoom: roomSelection.selectedRoom,
        allAvailableRooms: roomSelection.allRooms
    };
}

/**
 * Select best rental from available options
 * @param {Array} rentals - Available rentals
 * @param {string} travelWith - Travel group
 * @param {string} budget - Budget
 * @returns {Object|null} Selected rental
 */
export function selectBestRental(rentals, travelWith, budget) {
    if (rentals.length === 0) return null;

    const budgetRanges = getBudgetCompatibility(budget);
    const capacity = getCapacityRequirement(travelWith);

    // Filter exact matches first
    let filtered = rentals.filter(
        (r) =>
            r.rentalDetails.capacity >= capacity &&
            budgetRanges.includes(r.priceRange)
    );

    if (filtered.length === 0) filtered = rentals;

    // Sort by rating
    filtered.sort(
        (a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0)
    );

    return filtered[0];
}

/**
 * Select best tour for a specific day
 * @param {Array} tours - Available tours
 * @param {Object} dayItinerary - Day's itinerary
 * @param {Object} dayWeather - Day's weather
 * @param {Array} preferences - User preferences
 * @returns {Object|null} Selected tour
 */
export function selectTourForDay(tours, dayItinerary, dayWeather, preferences) {
    if (tours.length === 0) return null;

    // Filter weather-appropriate tours
    let filtered = tours;
    if (dayWeather?.classification === "indoor-preferred") {
        filtered = tours.filter(
            (t) =>
                t.tourDetails.weatherSuitability === "indoor" ||
                t.tourDetails.weatherSuitability === "all-weather"
        );
    }

    if (filtered.length === 0) filtered = tours;

    // Match with preferences
    const preferenceTypes = preferences.map((p) => {
        if (p === "Adventure") return "Adventure";
        if (p === "Culture" || p === "History") return "Cultural";
        if (p === "Nature") return "Nature";
        if (p === "Food") return "Food";
        return null;
    }).filter(Boolean);

    if (preferenceTypes.length > 0) {
        const matched = filtered.filter((t) =>
            preferenceTypes.includes(t.tourDetails.tourType)
        );
        if (matched.length > 0) filtered = matched;
    }

    // Sort by rating
    filtered.sort(
        (a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0)
    );

    return filtered[0];
}
