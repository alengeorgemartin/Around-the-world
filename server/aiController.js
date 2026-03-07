import Trip from "./models/Trip.js";
import fetch from "node-fetch";
import { getWeatherForecast, buildWeatherContext } from "./weatherService.js";
import {
  getBusinessesForTrip,
  selectBestHotel,
  selectBestRental,
  selectTourForDay,
} from "./businessService.js";

import { callGemini, extractJSON } from "./services/geminiService.js";
import {
  allocateBudget,
  estimateActivityCost,
  selectActivitiesGreedy,
  selectActivitiesKnapsack,
  calculateSatisfactionScore,
  comparePlans,
  buildBudgetBreakdown,
} from "./services/budgetOptimizer.js";
import {
  buildSeasonalContext,
  getActivitySeasonWeight,
  extractMonth,
} from "./services/seasonEngine.js";

/* ======================================================
   GEOCODING (SMART + FALLBACK)
====================================================== */
export async function geocodePlace(place, location) {
  const queries = [
    `${place}, ${location}`,
    `${place}, ${location}, India`,
    `${place}, India`,
    location,
  ];

  for (const q of queries) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        q
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
        lng: parseFloat(data[0].lon),
      };
    }
  }

  return null;
}

/* ======================================================
   GEOGRAPHIC CLUSTERING / ROUTE OPTIMIZATION
====================================================== */

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2 || !coord1.lat || !coord2.lat) return Infinity;

  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates travel mode, estimated time, and human-readable distance based on distance in km
 */
function calculateTravelInfo(distanceKm) {
  if (distanceKm === 0) return null;

  // Walking: ~4.5 km/h
  if (distanceKm <= 1.5) {
    const min = Math.ceil((distanceKm / 4.5) * 60);
    return {
      mode: "Walking",
      icon: "🚶",
      time: `${min} min`,
      distance: `${distanceKm.toFixed(1)} km`
    };
  }

  // Cab/Auto: ~25 km/h city average
  if (distanceKm <= 5) {
    const min = Math.ceil((distanceKm / 25) * 60) + 2; // +2 min waiting
    return {
      mode: "Cab/Auto",
      icon: "🚕",
      time: `${min} min`,
      distance: `${distanceKm.toFixed(1)} km`
    };
  }

  // Transit/Bus/Drive: ~35 km/h average
  const min = Math.ceil((distanceKm / 35) * 60) + 5; // +5 min waiting/walking to stop
  return {
    mode: "Transit/Drive",
    icon: "🚌",
    time: `${min} min`,
    distance: `${distanceKm.toFixed(1)} km`
  };
}

/**
 * Optimize activity order to minimize travel distance (greedy nearest-neighbor)
 * and calculate estimated travel times between them
 */
function optimizeDailyRoute(activities) {
  if (!activities || activities.length <= 1) return activities;

  const withCoords = activities.filter(a => a.geo?.lat && a.geo?.lng);
  const withoutCoords = activities.filter(a => !a.geo?.lat || !a.geo?.lng);

  if (withCoords.length <= 1) return activities;

  const optimized = [];
  const remaining = [...withCoords];

  // Start with first activity
  let current = remaining.shift();
  optimized.push(current);

  // Greedy: always pick nearest unvisited activity
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistance(current.geo, remaining[i].geo);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    current = remaining.splice(nearestIndex, 1)[0];
    optimized.push(current);
  }

  // Now calculate travel times between consecutive optimized stops
  for (let i = 0; i < optimized.length - 1; i++) {
    const dist = calculateDistance(optimized[i].geo, optimized[i + 1].geo);
    if (dist > 0 && dist !== Infinity && dist < 100) { // arbitrary cap to avoid crazy times
      optimized[i].travelToNext = calculateTravelInfo(dist);
    }
  }

  // For un-geocoded activities, we append them at the end. Can't calculate travel time accurately.
  return [...optimized, ...withoutCoords];
}

/**
 * Optimize routes for all days in itinerary
 */
function optimizeItineraryRoutes(itinerary) {
  return itinerary.map(day => {
    // Collect all activities for the day
    const allActivities = [
      ...day.morning.map(a => ({ ...a, period: 'morning' })),
      ...day.afternoon.map(a => ({ ...a, period: 'afternoon' })),
      ...day.evening.map(a => ({ ...a, period: 'evening' }))
    ];

    // Optimize the route
    const optimized = optimizeDailyRoute(allActivities);

    // Redistribute to morning/afternoon/evening
    const morningCount = day.morning.length;
    const afternoonCount = day.afternoon.length;

    return {
      day: day.day,
      morning: optimized.slice(0, morningCount).map(a => {
        const { period, ...rest } = a;
        return rest;
      }),
      afternoon: optimized.slice(morningCount, morningCount + afternoonCount).map(a => {
        const { period, ...rest } = a;
        return rest;
      }),
      evening: optimized.slice(morningCount + afternoonCount).map(a => {
        const { period, ...rest } = a;
        return rest;
      })
    };
  });
}

/* ======================================================
   ACTIVITY NAME VALIDATION
====================================================== */
function isValidActivity(activityName) {
  if (!activityName || typeof activityName !== 'string') return false;

  const name = activityName.trim().toLowerCase();

  // Invalid patterns (weather data, temperatures, generic phrases)
  const invalidPatterns = [
    /^\d+[-–]\d+°?[cf]$/i,  // Temperature ranges like "22-32°C"
    /partly cloudy/i,
    /clear sky/i,
    /sunny/i,
    /rainy/i,
    /cloudy/i,
    /great for (outdoor|indoor)/i,
    /outdoor activities/i,
    /indoor activities/i,
    /loading details/i,
    /popular tourist/i,
    /^weather/i,
  ];

  // Check against invalid patterns
  for (const pattern of invalidPatterns) {
    if (pattern.test(name)) {
      console.warn(`⚠️ Invalid activity detected: "${activityName}" - matches weather/generic pattern`);
      return false;
    }
  }

  // Too short (likely not a real place)
  if (name.length < 3) {
    console.warn(`⚠️ Invalid activity detected: "${activityName}" - too short`);
    return false;
  }

  return true;
}

/* ======================================================
   PREFERENCE BIAS BUILDER
====================================================== */
function buildPreferenceBias(preferences = []) {
  const bias = [];

  // Map all 9 frontend preferences to specific AI instructions
  if (preferences.includes("Food & Cafes") || preferences.includes("Food") || preferences.includes("Foody")) {
    bias.push("Focus heavily on local cuisine, traditional restaurants, street food, cafes, and food markets");
  }

  if (preferences.includes("Hiking & Trekking") || preferences.includes("Hiking")) {
    bias.push("Prioritize hiking trails, trekking routes, mountain paths, and nature walks with scenic viewpoints");
  }

  if (preferences.includes("Adventure Sports") || preferences.includes("Adventure")) {
    bias.push("Include adventure activities like paragliding, zip-lining, rock climbing, water sports, wildlife safaris, and thrilling experiences");
  }

  if (preferences.includes("Sightseeing")) {
    bias.push("Include popular landmarks, famous monuments, iconic viewpoints, and must-see tourist attractions");
  }

  if (preferences.includes("Nature & Relaxation") || preferences.includes("Nature") || preferences.includes("Relaxation")) {
    bias.push("Prioritize natural landscapes like hills, waterfalls, lakes, gardens, parks, and peaceful scenic spots with a relaxed pacing");
  }

  if (preferences.includes("Night Life")) {
    bias.push("Include evening entertainment, night markets, rooftop bars, beach clubs, live music venues, and vibrant nighttime activities");
  }

  if (preferences.includes("Shopping")) {
    bias.push("Include local markets, shopping districts, handicraft stores, souvenir shops, and traditional bazaars");
  }

  if (preferences.includes("Cultural & Heritage") || preferences.includes("Culture") || preferences.includes("History")) {
    bias.push("Prioritize cultural sites, heritage monuments, temples, churches, museums, art galleries, and historical landmarks");
  }

  if (preferences.includes("Bike / Car Riding") || preferences.includes("Bike Riding") || preferences.includes("Car Riding")) {
    bias.push("Include scenic drives, coastal roads, mountain routes, bike-friendly paths, and road trip worthy destinations");
  }

  return bias.length
    ? bias.join(". ")
    : "Maintain a balanced sightseeing itinerary with a mix of cultural, natural, and recreational activities.";
}

/* ======================================================
   AI HELPERS
====================================================== */

/* Validate if description is actually generated vs echoing prompt */
function isValidDescription(description, activityName) {
  if (!description || typeof description !== 'string') return false;

  const descriptionLower = description.toLowerCase();

  // Check for prompt echoes
  const invalidPatterns = [
    /explore.*20-30 words/i,
    /including hours.*entry fee/i,
    /visit for morning.*afternoon.*evening/i,
    /20-30 words including/i,
    /main attractions.*entry fee/i,
    /^rules:/i,
    /^description:/i,
    /\$\{.*\}/,  // Template literals
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(descriptionLower)) {
      console.warn(`⚠️ Invalid description detected (prompt echo): "${description}"`);
      return false;
    }
  }

  // Too short
  if (description.split(' ').length < 5) {
    console.warn(`⚠️ Invalid description (too short): "${description}"`);
    return false;
  }

  return true;
}

/* Fill missing details for an activity */
async function fillActivityDetails({
  activityName,
  location,
  period,
  budget,
  travelWith,
  preferenceBias,
  weatherContext = "", // NEW: optional weather context
}) {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const prompt = `
Generate details for the tourist attraction "${activityName}" in ${location}.

Return ONLY valid JSON in this format:
{
  "activity": "${activityName}",
  "address": "full street address",
  "description": "actual description here",
  "placeUrl": "https://...",
  "startTime": "time",
  "duration": "duration",
  "estimatedCost": number
}

CRITICAL INSTRUCTIONS:
1. Write a REAL description (20-30 words) about ${activityName}
2. Include: opening hours, entry fee, and what visitors can see/do
3. DO NOT copy these instructions - write actual information
4. Address must be a real street address in ${location}
5. placeUrl: Wikipedia URL like https://en.wikipedia.org/wiki/${activityName.replace(/\s+/g, '_')} OR Google Maps
6. startTime: ${period === 'morning' ? '9:00 AM' : period === 'afternoon' ? '2:00 PM' : '6:00 PM'}
7. duration: realistic visit time (e.g., "2 hours", "1-2 hours")
8. estimatedCost: A highly accurate numeric value in ₹ for the total expected cost per person to do this activity. Include entry fees, standard tickets, and gear rentals (e.g. trekking gear, surfboards, adventure sports fees). If it is a free public area with no rentals, use 0.

Context:
- Budget: ${budget}
- Travel with: ${travelWith}
- Preferences: ${preferenceBias}${weatherContext ? `\n- Weather: ${weatherContext}` : ""}

Return ONLY the JSON. No explanations.
`;

    try {
      const aiResponse = await callGemini(prompt, undefined, {
        maxOutputTokens: 1000,
        jsonMode: true,
        operationName: 'fillActivityDetails'
      });
      const parsed = extractJSON(aiResponse);

      if (parsed && isValidDescription(parsed.description, activityName)) {
        console.log(`✅ Valid description generated for ${activityName} (attempt ${attempt})`);
        return parsed;
      } else {
        console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for ${activityName} - invalid description`);
        if (attempt < maxRetries) {
          // Wait 500ms before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (err) {
      console.error(`❌ Error on attempt ${attempt} for ${activityName}:`, err.message);
    }
  }

  // All retries failed - use fallback
  console.warn(`⚠️ All ${maxRetries} attempts failed for ${activityName}, using fallback`);
  return {
    activity: activityName,
    address: location,
    description: `Popular tourist destination in ${location}. A must-visit attraction offering unique experiences and memorable sights for travelers.`,
    placeUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activityName + ', ' + location)}`,
    startTime: period === 'morning' ? '9:00 AM' : period === 'afternoon' ? '2:00 PM' : '6:00 PM',
    duration: '1-2 hours',
  };
}


/* Replace duplicate activities */
async function replaceDuplicates({
  outline,
  location,
  budget,
  travelWith,
  preferenceBias,
}) {
  const seen = new Set();
  const duplicates = [];
  const invalid = [];

  // Find duplicates and invalid activities
  for (const day of outline.days) {
    for (const period of ['morning', 'afternoon', 'evening']) {
      const activity = day[period];

      // Skip if period is missing or undefined
      if (!activity || typeof activity !== 'string') {
        console.warn(`⚠️ Missing ${period} activity on Day ${day.day}, generating default...`);
        // Generate a default activity name
        day[period] = `${location} ${period.charAt(0).toUpperCase() + period.slice(1)} Attraction ${day.day}`;
        invalid.push({ day: day.day, period, current: day[period] });
        continue;
      }

      const key = activity.toLowerCase().trim();

      // Check if invalid (weather data, etc.)
      if (!isValidActivity(activity)) {
        invalid.push({ day: day.day, period, current: activity });
        console.log(`🚫 Invalid activity found on Day ${day.day} ${period}: "${activity}"`);
      } else if (seen.has(key)) {
        duplicates.push({ day: day.day, period, current: activity });
        console.log(`🔄 Duplicate found on Day ${day.day} ${period}: "${activity}"`);
      } else {
        seen.add(key);
      }
    }
  }

  // Replace both duplicates and invalid activities
  const toReplace = [...duplicates, ...invalid];

  for (const item of toReplace) {
    const allActivities = Array.from(seen).join(', ');
    const prompt = `
Return ONLY valid JSON.

{
  "activity": string
}

CRITICAL RULES:
- Suggest a REAL landmark or tourist attraction in ${location}
- Must be DIFFERENT from: ${allActivities}
- Suitable for ${item.period} time of day
- DO NOT suggest weather conditions, temperatures, or generic phrases
- Examples of VALID: "Idukki Dam", "Munnar Hills", "Tea Museum"
- Examples of INVALID: "Partly Cloudy", "22°C", "Outdoor activities"
- Preferences: ${preferenceBias}
`;

    const aiResponse = await callGemini(prompt, undefined, {
      maxOutputTokens: 500,
      jsonMode: true,
      operationName: 'replaceDuplicates'
    });
    const parsed = extractJSON(aiResponse);
    if (parsed?.activity && isValidActivity(parsed.activity)) {
      const dayObj = outline.days.find(d => d.day === item.day);
      dayObj[item.period] = parsed.activity;
      seen.add(parsed.activity.toLowerCase().trim());
      console.log(`✅ Replaced with: "${parsed.activity}"`);
    } else {
      // If AI fails, use a safe fallback
      const fallback = `${location} ${item.period.charAt(0).toUpperCase() + item.period.slice(1)} Spot ${item.day}`;
      const dayObj = outline.days.find(d => d.day === item.day);
      dayObj[item.period] = fallback;
      console.log(`⚠️ Using fallback: "${fallback}"`);
    }
  }

  return outline;
}

async function generateAlternativeActivity({
  location,
  currentActivity,
  period,
  preferenceBias,
}) {
  const prompt = `
Return ONLY valid JSON.

{
  "activity": string,
  "address": string,
  "description": string,
  "placeUrl": string,
  "startTime": string,
  "duration": string,
  "travelFromPrevious": string
}

Rules:
- Must be DIFFERENT from "${currentActivity}"
- Must be near "${currentActivity}" in ${location}
- Align with preferences: ${preferenceBias}
- Real place only
- Description under 25 words
- URL must start with https://
`;

  for (let i = 0; i < 2; i++) {
    const aiResponse = await callGemini(prompt, undefined, {
      maxOutputTokens: 1000,
      jsonMode: true,
      operationName: 'generateAlternativeActivity'
    });
    const parsed = extractJSON(aiResponse);
    if (parsed?.activity && parsed.activity !== currentActivity) {
      return parsed;
    }
  }

  return null;
}

async function generateActivitySuggestions({
  location,
  currentActivity,
  preferenceBias,
}) {
  const prompt = `
Return ONLY valid JSON.

{
  "suggestions": [
    { "activity": string, "reason": string }
  ]
}

Rules:
- 2–3 suggestions
- Different from "${currentActivity}"
- Nearby places in ${location}
- Align with preferences: ${preferenceBias}
- No generic names
`;

  const aiResponse = await callGemini(prompt, undefined, {
    maxOutputTokens: 1000,
    jsonMode: true,
    operationName: 'generateActivitySuggestions'
  });
  const parsed = extractJSON(aiResponse);
  return Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
}

async function generateAdditionalSuggestions({
  location,
  currentActivity,
  preferenceBias,
}) {
  const prompt = `
Return ONLY valid JSON.

{
  "suggestions": [
    { "activity": string, "type": string, "reason": string }
  ]
}

Rules:
- 2–3 suggestions only
- Near "${currentActivity}" in ${location}
- Types: Food, Cafe, Scenic, Shopping, Relaxation
- Short reasons (<12 words)
- Align with preferences: ${preferenceBias}
`;

  const aiResponse = await callGemini(prompt, undefined, {
    maxOutputTokens: 1000,
    jsonMode: true,
    operationName: 'generateAdditionalSuggestions'
  });
  const parsed = extractJSON(aiResponse);
  return Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
}

/* ======================================================
   CONTROLLERS
====================================================== */
export const generateTravelPlan = async (req, res) => {
  try {
    const {
      location,
      startLocation,
      startDate,
      days,
      budget,
      budgetAmount,     // Numeric total in ₹ (optional)
      travelMonth,      // Travel month 1-12 or name (optional, for seasonal engine)
      travelWith,
      preferences = [],
    } = req.body;

    if (!location || !startLocation || !startDate || !days || !budget || !travelWith) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const preferenceBias = buildPreferenceBias(preferences);
    const seed = Math.floor(Math.random() * 100000);

    /* ---------- SEASONAL INTELLIGENCE (runs before Gemini) ---------- */
    const effectiveTravelDate = travelMonth || startDate || new Date().getMonth() + 1;
    const seasonalContext = buildSeasonalContext(location, effectiveTravelDate);
    console.log(`🌦 [SeasonEngine] ${location} in ${seasonalContext.season}: level=${seasonalContext.warningLevel}${seasonalContext.floodRisk ? " ⚠ FLOOD RISK" : ""}`);

    /* ---------- BUDGET OPTIMIZER — PHASE 1 (runs before Gemini) ---------- */
    // Runs even without hotels loaded — hotels are fetched later for refinement
    let budgetAllocation = null;
    if (budgetAmount && budgetAmount > 0) {
      budgetAllocation = allocateBudget({
        totalBudget: Number(budgetAmount),
        days: Number(days),
        budget,
        travelWith,
        hotels: [], // refined after business fetch
      });
      console.log(`💰 [BudgetOptimizer] Activity budget ceiling: ₹${budgetAllocation?.activities}`);
    }

    /* ---------- FETCH WEATHER DATA ---------- */
    let weatherData = [];
    try {
      weatherData = await getWeatherForecast(location, startDate, days);
      if (weatherData.length > 0) {
        console.log(`🌦️  Weather data available for ${weatherData.length} days`);
      } else {
        console.log("📅 No weather data available (trip may be far in future or API issue)");
      }
    } catch (err) {
      console.warn("⚠️ Weather fetch failed, continuing without weather data:", err.message);
    }

    /* ---------- BUILD WEATHER-AWARE OUTLINE PROMPT ---------- */
    let weatherGuidance = "";
    if (weatherData.length > 0) {
      weatherGuidance = "\n\nIMPORTANT - Weather Context (for planning only, DO NOT use as activity names):\n";
      weatherData.forEach(w => {
        weatherGuidance += `Day ${w.day}: Weather is ${w.condition}, ${w.temperature}`;
        if (w.classification === "indoor-preferred") {
          weatherGuidance += " - Suggest indoor landmarks like museums, temples, shopping centers";
        } else if (w.classification === "restricted") {
          weatherGuidance += " - Suggest only covered/indoor attractions";
        } else {
          weatherGuidance += " - Good for outdoor landmarks like parks, viewpoints, waterfalls";
        }
        weatherGuidance += "\n";
      });
      weatherGuidance += "\nIMPORTANT: The weather information above is CONTEXT ONLY. Do NOT use weather conditions, temperatures, or weather descriptions as activity names.\n";
    }

    /* ---------- FETCH BUSINESSES FOR TRIP ---------- */
    let availableBusinesses = { hotels: [], rentals: [], tours: [] };
    let selectedBusinesses = {
      accommodation: null,
      rental: null,
      toursPerDay: {},
    };

    try {
      // Fetch businesses from database
      availableBusinesses = await getBusinessesForTrip({
        location,
        startLocation,
        budget,
        days,
        travelWith,
        weatherData,
        itinerary: [], // Will be populated later
        preferences,
      });

      console.log(`🏨 Found ${availableBusinesses.hotels.length} hotels`);
      console.log(`🚗 Found ${availableBusinesses.rentals.length} rentals`);
      console.log(`🎯 Found ${availableBusinesses.tours.length} tours`);
    } catch (err) {
      console.warn(
        "⚠️ Business fetch failed, continuing without:",
        err.message
      );
    }

    /* ---------- OUTLINE ---------- */
    // Inject budget ceiling into prompt when optimizer has run
    const budgetConstraintText = budgetAllocation
      ? `\nBUDGET CONSTRAINTS (for activity selection guidance):
- Total trip budget: ₹${budgetAllocation.totalBudget}
- Activity budget per day: ~₹${Math.round(budgetAllocation.activities / days)}
- Prefer a mix of free/budget landmarks and 1 paid attraction per day
- DO NOT list pricing in output — guide selection only\n`
      : "";

    /* Seasonal hint — from seasonEngine, injected into Gemini prompt */
    const seasonalHintText = seasonalContext.geminiHint
      ? `\nSEASONAL CONTEXT (${seasonalContext.season} — ${seasonalContext.warningLevel.toUpperCase()}):
${seasonalContext.geminiHint}\n`
      : "";

    const outlinePrompt = `
You are a professional travel planner.

TASK:
Generate a ${days}-day itinerary outline for ${location}.

OUTPUT FORMAT (JSON ONLY):
{
  "days": [
    { "day": 1, "morning": "PLACE NAME", "afternoon": "PLACE NAME", "evening": "PLACE NAME" }
  ]
}

STRICT RULES:
1. Each value MUST be a REAL, well-known landmark or tourist place in ${location}
2. Use ONLY place names — no descriptions, sentences, or weather details
3. Examples of VALID: "Idukki Dam", "Munnar Tea Gardens", "Periyar Wildlife Sanctuary"
4. Examples of INVALID:
   - Generic: "Morning Attraction", "Popular Tourist Spot", "Sightseeing Area"
   - Weather: "Partly Cloudy", "22-32°C", "Great for outdoor activities"
5. EXACTLY ${days} days required
6. NO duplicate places across all days
7. Places on the same day should be geographically close to each other
8. Follow user preferences: ${preferenceBias}
${budgetConstraintText}${seasonalHintText}
WEATHER CONTEXT (for planning only, DO NOT mention in output):
${weatherGuidance}

CRITICAL:
- Return ONLY valid JSON
- NO explanations
- NO markdown formatting
- NO extra text

Seed: ${seed}
`;

    let outline;
    let lastResponse = null;

    for (let i = 0; i < 5; i++) {
      const aiResponse = await callGemini(outlinePrompt, undefined, {
        maxOutputTokens: 3000,
        jsonMode: true,
        operationName: 'generateTravelPlanOutline'
      });
      lastResponse = aiResponse;
      console.log(`🔍 Outline attempt ${i + 1}:`, aiResponse?.substring(0, 200));

      outline = extractJSON(aiResponse);
      if (outline?.days && Array.isArray(outline.days)) {
        // Sanitize days: Ensure 'day' is a number corresponding to the index
        outline.days = outline.days.map((d, index) => ({
          ...d,
          day: index + 1
        }));
        console.log(`✅ Outline generated successfully with ${outline.days.length} days`);
        break;
      }
    }

    // Fallback if AI fails
    if (!outline || !Array.isArray(outline.days)) {
      console.warn("⚠️ Outline AI failed after 5 attempts, using fallback outline");
      console.warn("Last AI response:", lastResponse);

      outline = {
        days: Array.from({ length: Number(days) }, (_, i) => ({
          day: i + 1,
          morning: `${location} Morning Attraction ${i + 1}`,
          afternoon: `${location} Afternoon Sight ${i + 1}`,
          evening: `${location} Evening Spot ${i + 1}`,
        })),
      };
    }

    /* ---------- REPLACE DUPLICATES ---------- */
    outline = await replaceDuplicates({
      outline,
      location,
      budget,
      travelWith,
      preferenceBias,
    });

    /* ---------- CREATE BASIC ITINERARY (FAST) ---------- */
    const itinerary = [];

    for (const d of outline.days) {
      const dayItinerary = {
        day: d.day,
        morning: [],
        afternoon: [],
        evening: [],
      };

      // Create basic activities with just names and default geocoding
      for (const period of ['morning', 'afternoon', 'evening']) {
        const activityName = d[period];
        dayItinerary[period].push({
          activity: activityName,
          address: location,
          description: "Loading details...",
          placeUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activityName + ', ' + location)}`,
          startTime: period === 'morning' ? '9:00 AM' : period === 'afternoon' ? '2:00 PM' : '6:00 PM',
          duration: "1-2 hours",
          geo: { lat: 10.8505, lng: 76.2711 }, // Default, will be updated
        });
      }

      itinerary.push(dayItinerary);
    }

    /* ---------- SELECT BEST BUSINESSES ---------- */
    // Hotel selection (will be more accurate after itinerary geocoding)
    if (availableBusinesses.hotels.length > 0) {
      selectedBusinesses.accommodation = selectBestHotel(
        availableBusinesses.hotels,
        { budget, travelWith }
      );
      console.log(
        `✅ Selected hotel: ${selectedBusinesses.accommodation.name}`
      );
    }

    // Rental selection
    if (availableBusinesses.rentals.length > 0 && days > 1) {
      selectedBusinesses.rental = selectBestRental(
        availableBusinesses.rentals,
        travelWith,
        budget
      );
      console.log(
        `✅ Selected rental: ${selectedBusinesses.rental?.name || "None"}`
      );
    }

    // Tour selection per day (basic, will refine in background)
    for (let i = 0; i < days; i++) {
      const dayWeather = weatherData[i];
      if (availableBusinesses.tours.length > 0) {
        const tour = selectTourForDay(
          availableBusinesses.tours,
          {},
          dayWeather,
          preferences
        );
        if (tour) {
          selectedBusinesses.toursPerDay[i + 1] = tour;
        }
      }
    }

    // Prepare business details for storage
    const businessDetails = {};
    if (selectedBusinesses.accommodation) {
      const hotel = selectedBusinesses.accommodation;
      businessDetails.hotel = {
        name: hotel.name,
        address: hotel.location.address,
        starRating: hotel.hotelDetails?.starRating,

        // Selected room (AI recommended)
        selectedRoom: hotel.selectedRoom || {
          type: "Standard Room",
          pricePerNight: hotel.pricePerNight || 0,
          amenities: [],
          capacity: 2
        },

        // All available rooms for user choice
        availableRooms: hotel.allAvailableRooms || [],

        contact: {
          phone: hotel.contact.phone,
          email: hotel.contact.email,
          website: hotel.contact.website,
        },
      };
    }

    if (selectedBusinesses.rental) {
      const rental = selectedBusinesses.rental;
      businessDetails.rental = {
        name: rental.name,
        vehicleType: rental.rentalDetails.vehicleType,
        model: rental.rentalDetails.model,
        pricePerDay: rental.pricePerDay,
        contact: rental.contact.phone,
      };
    }

    if (Object.keys(selectedBusinesses.toursPerDay).length > 0) {
      businessDetails.toursPerDay = {};
      Object.keys(selectedBusinesses.toursPerDay).forEach((day) => {
        const tour = selectedBusinesses.toursPerDay[day];
        businessDetails.toursPerDay[day] = {
          name: tour.name,
          tourType: tour.tourDetails.tourType,
          duration: tour.tourDetails.duration,
          pricePerDay: tour.pricePerDay,
          contact: tour.contact.phone,
        };
      });
    }

    // Refine allocation with actual hotel price now that businesses are fetched
    if (budgetAmount && budgetAmount > 0 && availableBusinesses.hotels.length > 0) {
      budgetAllocation = allocateBudget({
        totalBudget: Number(budgetAmount),
        days: Number(days),
        budget,
        travelWith,
        hotels: availableBusinesses.hotels,
      });
    }

    // Build initial budgetBreakdown (actualSpent filled in background)
    const initialBreakdown = budgetAllocation
      ? buildBudgetBreakdown(
        budgetAllocation,
        {
          stay: selectedBusinesses.accommodation?.selectedRoom?.pricePerNight
            ? selectedBusinesses.accommodation.selectedRoom.pricePerNight * days
            : budgetAllocation.stay,
          transport: selectedBusinesses.rental?.pricePerDay
            ? selectedBusinesses.rental.pricePerDay * days
            : budgetAllocation.transport,
          food: budgetAllocation.food,
        },
        0,       // satisfactionScore filled in background
        "greedy"  // default, overwritten after comparison
      )
      : null;

    // Save trip immediately with basic info (including weather + business data)
    const trip = await Trip.create({
      userId: req.user.id,
      location,
      startLocation,
      startDate,
      days,
      travelWith,
      budget,
      budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
      travelMonth: seasonalContext.travelMonth,
      seasonalContext: {
        season: seasonalContext.season,
        warningLevel: seasonalContext.warningLevel,
        warningMessage: seasonalContext.warningMessage,
        floodRisk: seasonalContext.floodRisk,
        isPeakSeason: seasonalContext.isPeakSeason,
        alternatives: seasonalContext.alternatives,
        destinationTags: seasonalContext.destinationTags,
      },
      preferences,
      itinerary,
      accommodation: selectedBusinesses.accommodation
        ? {
          name: selectedBusinesses.accommodation.name,
          address: selectedBusinesses.accommodation.location.address,
        }
        : { name: "Comfort Stay", address: location },
      weatherData: weatherData,
      weatherAdjustments: [],
      // Business integration
      selectedBusinesses: {
        hotel: selectedBusinesses.accommodation?._id || null,
        rental: selectedBusinesses.rental?._id || null,
        tours: Object.values(selectedBusinesses.toursPerDay).map(
          (t) => t._id
        ),
      },
      businessDetails: businessDetails,
      budgetBreakdown: initialBreakdown || undefined,
    });

    // Return immediately to user (FAST RESPONSE)
    res.json({ success: true, data: trip });

    /* ---------- FILL DETAILS IN BACKGROUND ---------- */
    // This runs asynchronously after response is sent
    (async () => {
      try {
        console.log(`🔄 Starting background detail enrichment for trip ${trip._id}`);

        for (let dayIndex = 0; dayIndex < trip.itinerary.length; dayIndex++) {
          const day = trip.itinerary[dayIndex];

          for (const period of ['morning', 'afternoon', 'evening']) {
            const activity = day[period][0];
            const activityName = activity.activity;

            console.log(`🔄 Enriching Day ${dayIndex + 1} ${period}: ${activityName}`);

            // Get weather context for this day
            const dayWeather = weatherData.find(w => w.day === dayIndex + 1);
            const weatherContext = dayWeather
              ? buildWeatherContext(weatherData, dayIndex + 1)
              : "";

            // Fill detailed information
            const details = await fillActivityDetails({
              activityName,
              location,
              period,
              budget,
              travelWith,
              preferenceBias,
              weatherContext, // Pass weather context
            });

            // Add geocoding
            details.geo = (await geocodePlace(activityName, location)) || {
              lat: 10.8505,
              lng: 76.2711,
            };

            // ── BUDGET OPTIMIZER: assign cost to activity ──────────────
            const { estimatedCost, costTier } = estimateActivityCost(activityName, budget, details.estimatedCost);
            details.estimatedCost = estimatedCost;
            details.costTier = costTier;

            // Update the activity in the database
            trip.itinerary[dayIndex][period][0] = details;

            // Save immediately after enriching each activity for progressive loading
            await trip.save();
            console.log(`✅ Saved Day ${dayIndex + 1} ${period}: ${activityName} (₹${estimatedCost})`);
          }
        }

        console.log(`✅ Background enrichment completed for trip ${trip._id}`);

        // OPTIMIZE ROUTES AFTER ALL GEOCODING IS DONE
        console.log(`🗺️  Optimizing routes for geographic clustering...`);
        try {
          trip.itinerary = optimizeItineraryRoutes(trip.itinerary);
          await trip.save();
          console.log(`✅ Routes optimized - nearby places grouped together`);
        } catch (optimizeErr) {
          console.warn(`⚠️ Route optimization failed (non-critical):`, optimizeErr.message);
        }

        // ── BUDGET OPTIMIZER: finalize breakdown + research metrics ────
        if (budgetAllocation) {
          try {
            // Collect all enriched activities flat
            const allActivities = trip.itinerary.flatMap(day =>
              ['morning', 'afternoon', 'evening'].flatMap(p => day[p])
            );

            const actBudget = budgetAllocation.activities;

            // Run comparison (greedy vs knapsack) for research paper
            const { greedy, knapsack, comparison } = comparePlans(allActivities, actBudget, preferences);

            // Use knapsack as the higher-quality selection
            const finalSatisfaction = knapsack.satisfactionScore;

            // Compute actual activity spend
            const actualActivitySpend = allActivities.reduce(
              (s, a) => s + (a.estimatedCost || 0), 0
            );

            // Update trip with final breakdown
            trip.budgetBreakdown = buildBudgetBreakdown(
              budgetAllocation,
              {
                stay: initialBreakdown?.actualSpent?.stay || budgetAllocation.stay,
                food: budgetAllocation.food,
                transport: initialBreakdown?.actualSpent?.transport || budgetAllocation.transport,
                activities: actualActivitySpend,
              },
              finalSatisfaction,
              "knapsack"
            );

            // Store research metrics for paper
            trip.researchMetrics = {
              greedySatisfaction: comparison.greedy.satisfactionScore,
              knapsackSatisfaction: comparison.knapsack.satisfactionScore,
              greedyUtilization: comparison.greedy.budgetUtilization,
              knapsackUtilization: comparison.knapsack.budgetUtilization,
              processingTimeMs: comparison.greedy.processingTimeMs + comparison.knapsack.processingTimeMs,
            };

            await trip.save();
            console.log(`📊 [BudgetOptimizer] Final satisfaction: ${(finalSatisfaction * 100).toFixed(1)}% | Greedy vs Knapsack improvement: ${(comparison.improvement.satisfactionDelta * 100).toFixed(2)}%`);
          } catch (optimErr) {
            console.warn(`⚠️ Budget optimization finalization failed (non-critical):`, optimErr.message);
          }
        }

      } catch (err) {
        console.error(`❌ Background enrichment failed for trip ${trip._id}:`, err.message);
      }
    })();
  } catch (err) {
    console.error("❌ Trip generation failed:", err.message);
    res.status(500).json({ success: false, message: "Trip generation failed" });
  }
};

/* ---------- REPLACE ACTIVITY ---------- */
export const replaceActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, period, currentActivity, preferenceHint } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ success: false });

    if (trip.userId.toString() !== req.user.id)
      return res.status(403).json({ success: false });

    const preferenceBias = buildPreferenceBias(trip.preferences);
    const dayObj = trip.itinerary.find(d => d.day === day);

    const newActivity =
      (await generateAlternativeActivity({
        location: trip.location,
        currentActivity,
        period,
        preferenceBias: preferenceHint
          ? `${preferenceBias}. ${preferenceHint}`
          : preferenceBias,
      })) || {
        activity: `Alternative near ${currentActivity}`,
        address: trip.location,
        description: "Nearby alternative experience",
        placeUrl: "https://www.google.com/maps",
        startTime: "Flexible",
        duration: "1–2 hours",
        travelFromPrevious: "Short travel",
      };

    newActivity.geo =
      (await geocodePlace(newActivity.activity, trip.location)) ||
      { lat: 10.8505, lng: 76.2711 };

    dayObj[period][0] = newActivity;
    await trip.save();

    res.json({ success: true, data: trip });
  } catch (err) {
    console.error("❌ Replace error:", err.message);
    res.status(500).json({ success: false });
  }
};

/* ---------- ACTIVITY SUGGESTIONS ---------- */
export const activitySuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentActivity } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ success: false });

    if (trip.userId.toString() !== req.user.id)
      return res.status(403).json({ success: false });

    const suggestions = await generateActivitySuggestions({
      location: trip.location,
      currentActivity,
      preferenceBias: buildPreferenceBias(trip.preferences),
    });

    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

/* ---------- ADDITIONAL SUGGESTIONS ---------- */
export const additionalSuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentActivity } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ success: false });

    if (trip.userId.toString() !== req.user.id)
      return res.status(403).json({ success: false });

    const suggestions = await generateAdditionalSuggestions({
      location: trip.location,
      currentActivity,
      preferenceBias: buildPreferenceBias(trip.preferences),
    });

    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const appendActivity = async (req, res) => {
  const { id } = req.params;
  const { day, period, activity } = req.body;

  try {
    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ success: false });

    if (trip.userId.toString() !== req.user.id)
      return res.status(403).json({ success: false });

    const dayObj = trip.itinerary.find(d => d.day === day);
    if (!dayObj || !dayObj[period])
      return res.status(400).json({ success: false });

    // geocode safety
    activity.geo =
      (await geocodePlace(activity.activity, trip.location)) ||
      { lat: 10.8505, lng: 76.2711 };

    dayObj[period].push(activity);

    // history (last 5)
    trip.history = trip.history || [];
    trip.history.push({
      type: "append",
      day,
      period,
      activity,
      at: new Date(),
    });
    trip.history = trip.history.slice(-5);

    await trip.save();
    res.json({ success: true, data: trip });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const deleteActivity = async (req, res) => {
  const { id } = req.params;
  const { day, period, activityIndex } = req.body;

  try {
    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

    if (trip.userId.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    const dayObj = trip.itinerary.find(d => d.day === day);
    if (!dayObj || !dayObj[period])
      return res.status(400).json({ success: false, message: "Invalid day or period" });

    // Check if the activity exists at the given index
    if (activityIndex < 0 || activityIndex >= dayObj[period].length) {
      return res.status(400).json({ success: false, message: "Invalid activity index" });
    }

    // Store the deleted activity for history
    const deletedActivity = dayObj[period][activityIndex];

    // Remove the activity from the array
    dayObj[period].splice(activityIndex, 1);

    // Add to history (last 5)
    trip.history = trip.history || [];
    trip.history.push({
      type: "delete",
      day,
      period,
      activityIndex,
      deletedActivity,
      at: new Date(),
    });
    trip.history = trip.history.slice(-5);

    await trip.save();
    res.json({ success: true, data: trip });
  } catch (err) {
    console.error("❌ Delete activity error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete activity" });
  }
};

export const undoLastChange = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip || !trip.history?.length)
      return res.json({ success: false });

    const last = trip.history.pop();

    if (last.type === "append") {
      const dayObj = trip.itinerary.find(d => d.day === last.day);
      dayObj[last.period].pop();
    }

    await trip.save();
    res.json({ success: true, data: trip });
  } catch {
    res.status(500).json({ success: false });
  }
};
export const smartAdjustment = async (req, res) => {
  const { id } = req.params;
  const { day, period, context } = req.body;

  try {
    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ success: false });

    if (trip.userId.toString() !== req.user.id)
      return res.status(403).json({ success: false });

    const preferenceBias = buildPreferenceBias(trip.preferences);

    const prompt = `
Return ONLY valid JSON.

{
  "suggestions": [
    { "activity": string, "type": string, "reason": string }
  ]
}

Context:
- Time of day: ${period}
- Situation: ${context}
- Location: ${trip.location}
- Preferences: ${preferenceBias}

Rules:
- 2-3 BETTER ALTERNATIVES to replace current activity
- Must be more suitable for ${period} time
- Focus on improving the itinerary quality
- Must be nearby places in ${trip.location}
- Types: Food, Scenic, Adventure, Culture, Relaxation
- Short reasons (<12 words) explaining why it's better
- No generic names
`;

    const aiResponse = await callGemini(prompt, undefined, {
      maxOutputTokens: 1000,
      jsonMode: true,
      operationName: 'smartAdjustment'
    });
    const parsed = extractJSON(aiResponse);
    const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];

    res.json({
      success: true,
      suggestions,
    });
  } catch {
    res.status(500).json({ success: false });
  }
};

