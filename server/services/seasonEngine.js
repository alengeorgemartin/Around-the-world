/**
 * ============================================================
 *  SEASONAL INTELLIGENCE ENGINE
 *  Pure functions — no DB calls, no Gemini calls.
 *
 *  Provides:
 *  1. Season detection by month + India region
 *  2. Destination seasonal profiles (static config)
 *  3. Seasonal warnings (avoid / ideal / flood risk)
 *  4. Activity-level season weights for budgetOptimizer
 *  5. Season-aware utility multiplier
 * ============================================================
 */

/* ============================================================
   CONSTANTS
   ============================================================ */

/** Indian seasonal calendar */
export const SEASONS = {
    SUMMER: "Summer",
    MONSOON: "Monsoon",
    WINTER: "Winter",
    AUTUMN: "Autumn", // Oct–Nov transition
};

/** Activity tag → best / avoid seasons */
const ACTIVITY_SEASON_MAP = {
    // Tag: { ideal: [seasons], reduce: [seasons], weight: 0–1.5 }
    snow: { ideal: [SEASONS.WINTER], reduce: [SEASONS.SUMMER, SEASONS.MONSOON], boost: 1.4, penalty: 0.2 },
    skiing: { ideal: [SEASONS.WINTER], reduce: [SEASONS.SUMMER, SEASONS.MONSOON], boost: 1.4, penalty: 0.1 },
    hill: { ideal: [SEASONS.SUMMER, SEASONS.AUTUMN], reduce: [SEASONS.MONSOON], boost: 1.3, penalty: 0.5 },
    waterfall: { ideal: [SEASONS.MONSOON, SEASONS.AUTUMN], reduce: [SEASONS.SUMMER], boost: 1.4, penalty: 0.7 },
    beach: { ideal: [SEASONS.WINTER, SEASONS.AUTUMN], reduce: [SEASONS.MONSOON], boost: 1.3, penalty: 0.3 },
    trekking: { ideal: [SEASONS.WINTER, SEASONS.AUTUMN], reduce: [SEASONS.MONSOON], boost: 1.3, penalty: 0.4 },
    "water sports": { ideal: [SEASONS.WINTER], reduce: [SEASONS.MONSOON, SEASONS.SUMMER], boost: 1.3, penalty: 0.2 },
    camping: { ideal: [SEASONS.WINTER, SEASONS.AUTUMN], reduce: [SEASONS.MONSOON], boost: 1.2, penalty: 0.4 },
    wildlife: { ideal: [SEASONS.WINTER, SEASONS.AUTUMN], reduce: [SEASONS.MONSOON], boost: 1.3, penalty: 0.5 },
    heritage: { ideal: null, reduce: [SEASONS.SUMMER], boost: 1.0, penalty: 0.7 },  // year-round mostly
    temple: { ideal: null, reduce: [], boost: 1.0, penalty: 1.0 },                 // all year
    museum: { ideal: null, reduce: [], boost: 1.0, penalty: 1.0 },                 // all year
    shopping: { ideal: null, reduce: [], boost: 1.0, penalty: 1.0 },                 // all year
    food: { ideal: null, reduce: [], boost: 1.0, penalty: 1.0 },                 // all year
    garden: { ideal: [SEASONS.AUTUMN, SEASONS.WINTER], reduce: [SEASONS.MONSOON], boost: 1.2, penalty: 0.6 },
    festival: { ideal: [SEASONS.WINTER, SEASONS.AUTUMN], reduce: [], boost: 1.5, penalty: 0.9 },
    boating: { ideal: [SEASONS.WINTER], reduce: [SEASONS.MONSOON], boost: 1.2, penalty: 0.3 },
    backwaters: { ideal: [SEASONS.WINTER, SEASONS.AUTUMN], reduce: [SEASONS.MONSOON], boost: 1.3, penalty: 0.5 },
    desert: { ideal: [SEASONS.WINTER], reduce: [SEASONS.SUMMER], boost: 1.3, penalty: 0.3 },
    paragliding: { ideal: [SEASONS.AUTUMN, SEASONS.WINTER], reduce: [SEASONS.MONSOON], boost: 1.4, penalty: 0.2 },
    rafting: { ideal: [SEASONS.MONSOON, SEASONS.AUTUMN], reduce: [SEASONS.WINTER], boost: 1.4, penalty: 0.5 },
};

/** Destination seasonal profiles — static JSON (no DB needed) */
const DESTINATION_PROFILES = {
    // Hill Stations
    manali: {
        idealSeasons: [SEASONS.WINTER, SEASONS.SUMMER],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["snow", "hill", "cold", "trekking", "paragliding"],
        description: "Best Nov–Feb for snow; May–Jun for summer escape. Avoid Jul–Sep (landslides).",
        floodRisk: true,
    },
    shimla: {
        idealSeasons: [SEASONS.WINTER, SEASONS.SUMMER],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["snow", "hill", "heritage"],
        description: "Dec–Feb for snow; Mar–Jun for pleasant weather. Monsoon brings landslide risk.",
        floodRisk: false,
    },
    darjeeling: {
        idealSeasons: [SEASONS.AUTUMN, SEASONS.WINTER],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["hill", "trekking", "tea", "wildlife"],
        description: "Oct–Apr is ideal. Monsoon (Jun–Sep) causes heavy fog and disruptions.",
        floodRisk: true,
    },
    ooty: {
        idealSeasons: [SEASONS.AUTUMN, SEASONS.WINTER],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["hill", "garden", "camping"],
        description: "Oct–Jun is pleasant. Peak season Nov–Jun. Avoid heavy monsoon months.",
        floodRisk: false,
    },
    munnar: {
        idealSeasons: [SEASONS.AUTUMN, SEASONS.WINTER],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["hill", "waterfall", "wildlife", "trekking", "tea"],
        description: "Sep–May is ideal. The famous tea gardens are lush post-monsoon (Sep–Oct).",
        floodRisk: true,
    },

    // Beach Destinations
    goa: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["beach", "water sports", "nightlife", "food"],
        description: "Oct–Mar is peak beach season. Jun–Sep gets 3000mm rainfall — beaches closed.",
        floodRisk: false,
    },
    "andaman islands": {
        idealSeasons: [SEASONS.WINTER],
        avoidSeasons: [SEASONS.MONSOON, SEASONS.SUMMER],
        tags: ["beach", "water sports", "snorkeling", "diving"],
        description: "Nov–Apr is ideal. Cyclone risk May–Jun; heavy rains Jun–Sep.",
        floodRisk: false,
    },
    kovalam: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["beach", "backwaters", "ayurveda"],
        description: "Sep–Mar is best. Monsoon brings rough seas and dangerous currents.",
        floodRisk: false,
    },

    // Heritage / Culture
    rajasthan: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.SUMMER],
        tags: ["desert", "heritage", "festival", "shopping"],
        description: "Oct–Mar is best. Summer (Apr–Jun) exceeds 45°C — extremely harsh.",
        floodRisk: false,
    },
    jaipur: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.SUMMER],
        tags: ["heritage", "desert", "shopping", "festival"],
        description: "Nov–Feb is pleasant. Avoid Apr–Jun (intense heat, 40°C+).",
        floodRisk: false,
    },
    varanasi: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.MONSOON, SEASONS.SUMMER],
        tags: ["heritage", "temple", "culture", "festival"],
        description: "Oct–Mar is ideal. Monsoon causes Ganges flooding; summer is intense heat.",
        floodRisk: true,
    },
    agra: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.SUMMER],
        tags: ["heritage", "museum"],
        description: "Nov–Feb is best for Taj Mahal. Summer (May–Jun) exceeds 45°C.",
        floodRisk: false,
    },

    // Backwaters / South India
    kerala: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["backwaters", "boating", "wildlife", "food", "beach"],
        description: "Sep–Mar is ideal. Kerala receives India's heaviest rainfall Jun–Aug. Flood risk is significant.",
        floodRisk: true,
    },
    alleppey: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["backwaters", "boating", "festival"],
        description: "Aug houseboat festival (Nehru Trophy) is famous despite monsoon. Best overall: Oct–Feb.",
        floodRisk: true,
    },

    // Mountains / Adventure
    ladakh: {
        idealSeasons: [SEASONS.SUMMER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.WINTER, SEASONS.MONSOON],
        tags: ["hill", "trekking", "wildlife", "desert", "camping"],
        description: "May–Sep only — road access is weather-dependent. Winter (Oct–Mar) sees -30°C.",
        floodRisk: false,
    },
    rishikesh: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["trekking", "rafting", "camping", "yoga"],
        description: "Sep–Jun is ideal. Rafting: Sep–Nov & Feb–May. Monsoon: Ganges flooding, rafting suspended.",
        floodRisk: true,
    },
    coorg: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["hill", "trekking", "wildlife", "waterfall"],
        description: "Oct–Mar is ideal. Monsoon (Jun–Sep) is extremely heavy but scenic for waterfalls.",
        floodRisk: false,
    },

    // City / Urban
    mumbai: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.MONSOON],
        tags: ["food", "heritage", "shopping", "nightlife"],
        description: "Nov–Feb is best. Monsoon brings flooding, traffic chaos, and 3000mm+ rainfall.",
        floodRisk: true,
    },
    delhi: {
        idealSeasons: [SEASONS.WINTER, SEASONS.AUTUMN],
        avoidSeasons: [SEASONS.SUMMER],
        tags: ["heritage", "museum", "festival", "shopping"],
        description: "Oct–Mar is ideal. Summer (May–Jun) is brutal (45°C+). Monsoon is manageable.",
        floodRisk: false,
    },
};

/** Flood-prone regions (additional lookup for regions not fully profiled) */
const FLOOD_PRONE_REGIONS = [
    "assam", "bihar", "odisha", "west bengal", "andhra pradesh",
    "telangana", "uttarakhand", "himachal pradesh", "sikkim"
];

/* ============================================================
   PHASE 1 — SEASON DETECTION
   ============================================================ */

/**
 * Detect the Indian season for a given month (1-indexed or name).
 * @param {number|string} month - Month number (1–12) or name ("January")
 * @returns {{ season: string, month: number, isMonsoon: boolean, isPeak: boolean }}
 */
export function getSeasonByMonth(month) {
    let m = typeof month === "string"
        ? new Date(`${month} 1`).getMonth() + 1
        : Number(month);

    if (!m || isNaN(m)) m = new Date().getMonth() + 1; // fallback to current

    let season, isMonsoon = false, isPeak = false;

    if (m >= 3 && m <= 6) {
        season = SEASONS.SUMMER;
        isPeak = m >= 4 && m <= 5; // Apr–May hottest
    } else if (m >= 7 && m <= 9) {
        season = SEASONS.MONSOON;
        isMonsoon = true;
        isPeak = m === 8; // August peak
    } else if (m === 10 || m === 11) {
        season = SEASONS.AUTUMN;
        isPeak = m === 11; // November ideal
    } else {
        season = SEASONS.WINTER; // Dec, Jan, Feb
        isPeak = m === 12 || m === 1;
    }

    return { season, month: m, isMonsoon, isPeak };
}

/**
 * Extract month from travelDate string (ISO date, "July 2026", "07", etc.)
 * @param {string|Date} travelDate
 * @returns {number} month 1–12, or current month if unparseable
 */
export function extractMonth(travelDate) {
    if (!travelDate) return new Date().getMonth() + 1;

    const d = new Date(travelDate);
    if (!isNaN(d)) return d.getMonth() + 1;

    // Try "July 2026" format
    const named = new Date(`${travelDate} 1`);
    if (!isNaN(named)) return named.getMonth() + 1;

    // Try bare number
    const n = parseInt(travelDate);
    if (n >= 1 && n <= 12) return n;

    return new Date().getMonth() + 1;
}

/* ============================================================
   PHASE 2 — DESTINATION LOOKUP
   ============================================================ */

/**
 * Find the best-matching destination profile by name.
 * Fuzzy-matches against profile keys.
 * @param {string} location
 * @returns {Object|null} destination profile or null
 */
export function getDestinationProfile(location) {
    if (!location) return null;

    const normalized = location.toLowerCase();

    // Exact key match
    if (DESTINATION_PROFILES[normalized]) return DESTINATION_PROFILES[normalized];

    // Partial match — check if any key is contained in the location string
    for (const [key, profile] of Object.entries(DESTINATION_PROFILES)) {
        if (normalized.includes(key) || key.includes(normalized.split(",")[0].trim())) {
            return profile;
        }
    }

    return null;
}

/* ============================================================
   PHASE 3 — SEASONAL WARNING
   ============================================================ */

/**
 * Generate a seasonal warning/advisory for a destination + travel date.
 *
 * @param {string} location     - Trip destination
 * @param {string|number} travelDate - Travel date or month
 * @returns {{
 *   season: string,
 *   level: "ideal"|"caution"|"avoid",
 *   message: string,
 *   floodRisk: boolean,
 *   alternatives: string[],
 *   geminiHint: string    ← inject into AI prompt
 * }}
 */
export function getSeasonalWarning(location, travelDate) {
    const month = extractMonth(travelDate);
    const seasonal = getSeasonByMonth(month);
    const profile = getDestinationProfile(location);

    const locationLower = (location || "").toLowerCase();
    const floodRisk = profile?.floodRisk
        || FLOOD_PRONE_REGIONS.some(r => locationLower.includes(r));

    if (!profile) {
        // No profile — return generic season info
        return {
            season: seasonal.season,
            level: seasonal.isMonsoon ? "caution" : "ideal",
            message: seasonal.isMonsoon
                ? `${location} is being visited during India's monsoon season (Jul–Sep). Expect heavy rainfall and possible travel disruptions.`
                : `${seasonal.season} season visit. Check local conditions before departure.`,
            floodRisk,
            alternatives: [],
            geminiHint: seasonal.isMonsoon
                ? "Prefer indoor attractions — museums, temples, heritage sites, shopping centers. Avoid outdoor trekking and water sports."
                : "",
        };
    }

    const isAvoid = profile.avoidSeasons.includes(seasonal.season);
    const isIdeal = profile.idealSeasons.includes(seasonal.season);

    let level, message, geminiHint;

    if (isIdeal) {
        level = "ideal";
        message = `✅ ${seasonal.season} is ideal for ${location}. ${profile.description}`;
        geminiHint = `This is peak season for ${location}. Prioritize outdoor and signature experiences: ${profile.tags.join(", ")}.`;
    } else if (isAvoid) {
        level = "avoid";
        message = `⚠️ ${seasonal.season} is not recommended for ${location}. ${profile.description}${floodRisk ? " Flood risk is elevated during this period." : ""}`;
        geminiHint = `${location} is in its non-ideal season. Avoid outdoor activities tagged: ${profile.tags.filter(t =>
            Object.keys(ACTIVITY_SEASON_MAP).includes(t) &&
            ACTIVITY_SEASON_MAP[t].reduce?.includes(seasonal.season)
        ).join(", ")}. Prefer indoor alternatives.`;
    } else {
        level = "caution";
        message = `🟡 ${seasonal.season} is an acceptable time for ${location}, though not peak season. ${profile.description}`;
        geminiHint = `Moderate season for ${location}. Balance indoor and outdoor activities. Check weather daily.`;
    }

    // Build alternative suggestions for avoid-season
    const alternatives = isAvoid ? buildAlternatives(seasonal.season, profile.tags) : [];

    return {
        season: seasonal.season,
        level,
        message,
        floodRisk,
        alternatives,
        geminiHint,
        profile,
    };
}

/**
 * Suggest alternative destinations for a season based on tags.
 */
function buildAlternatives(season, tags) {
    const suggestions = [];
    for (const [dest, profile] of Object.entries(DESTINATION_PROFILES)) {
        if (
            profile.idealSeasons.includes(season) &&
            profile.tags.some(t => tags?.includes(t))
        ) {
            suggestions.push(dest.charAt(0).toUpperCase() + dest.slice(1));
        }
        if (suggestions.length >= 3) break;
    }
    return suggestions;
}

/* ============================================================
   PHASE 4 — ACTIVITY SEASON WEIGHT
   ============================================================ */

/**
 * Compute the season weight for an activity name.
 * Used in computeUtility() in budgetOptimizer.js.
 *
 * @param {string} activityName   - Activity name
 * @param {string} season         - Current season
 * @param {string[]} profileTags  - Destination tags (optional)
 * @returns {number} weight 0.2–1.5
 */
export function getActivitySeasonWeight(activityName, season, profileTags = []) {
    const name = (activityName || "").toLowerCase();

    // Match activity name against known tags
    for (const [tag, rules] of Object.entries(ACTIVITY_SEASON_MAP)) {
        if (!name.includes(tag)) continue;

        if (rules.ideal && rules.ideal.includes(season)) return rules.boost;
        if (rules.reduce && rules.reduce.includes(season)) return rules.penalty;
        return 1.0; // tag found but neutral season
    }

    // Check destination profile tags
    for (const tag of profileTags) {
        const rules = ACTIVITY_SEASON_MAP[tag];
        if (!rules) continue;
        if (rules.ideal?.includes(season)) return rules.boost * 0.8; // partial boost
        if (rules.reduce?.includes(season)) return rules.penalty * 1.2;
    }

    return 1.0; // default: no seasonal effect
}

/* ============================================================
   FULL CONTEXT BUILDER
   (single call to get everything the controller needs)
   ============================================================ */

/**
 * Build the full seasonal context object for a trip.
 * @param {string} location
 * @param {string|number} travelDate
 * @returns {Object} seasonalContext — save to Trip + inject into prompts
 */
export function buildSeasonalContext(location, travelDate) {
    const month = extractMonth(travelDate);
    const seasonal = getSeasonByMonth(month);
    const warning = getSeasonalWarning(location, travelDate);

    return {
        travelMonth: month,
        season: seasonal.season,
        isMonsoon: seasonal.isMonsoon,
        isPeakSeason: seasonal.isPeak && warning.level === "ideal",
        warningLevel: warning.level,          // "ideal" | "caution" | "avoid"
        warningMessage: warning.message,
        floodRisk: warning.floodRisk,
        alternatives: warning.alternatives,
        geminiHint: warning.geminiHint,
        destinationTags: warning.profile?.tags || [],
    };
}
