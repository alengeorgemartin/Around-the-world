/**
 * ============================================================
 *  BUDGET OPTIMIZER SERVICE
 *  Pure functions — no DB calls, no Gemini calls, no side effects.
 *
 *  Algorithm Progression (for research paper comparison):
 *    Phase 1 → Deterministic Baseline Allocation
 *    Phase 2 → Greedy Utility-Scored Activity Selection
 *    Phase 3 → 0/1 Knapsack Activity Selection
 *
 *  Research: Compare greedy vs knapsack satisfaction & utilization.
 * ============================================================
 */

/* ============================================================
   STATIC COST LOOKUP TABLES
   Based on Indian tourism averages (₹ per person per day)
   ============================================================ */

const FOOD_COST_PER_DAY = {
    cheap: 350,
    budget: 500,
    moderate: 900,
    luxury: 1800,
};

const TRANSPORT_BASE_COST = {
    cheap: 400,
    budget: 600,
    moderate: 1200,
    luxury: 2500,
};

// Average activity entry costs in ₹ (used when no DB cost data)
const ACTIVITY_COST_DEFAULTS = {
    free: 0,
    budget: 300,
    moderate: 700,
    luxury: 1500,
};

// Popularity / satisfaction scores for common activity types
// Used when the DB has no explicit score. Range 0-10.
const PREFERENCE_WEIGHT = {
    "Food & Cafes": 0.8,
    "Hiking & Trekking": 0.9,
    "Adventure Sports": 0.95,
    "Sightseeing": 0.75,
    "Nature & Relaxation": 0.7,
    "Night Life": 0.85,
    "Shopping": 0.65,
    "Cultural & Heritage": 0.8,
    "Bike / Car Riding": 0.88,
};

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Normalize budget label to lowercase key for lookup tables.
 * Handles both category strings ("Moderate") and numeric-only inputs.
 */
function normalizeBudgetKey(budget) {
    if (!budget) return "moderate";
    const map = {
        cheap: "cheap", budget: "budget", cheap: "cheap",
        moderate: "moderate", luxury: "luxury",
    };
    return map[budget.toLowerCase()] || "moderate";
}

/* ============================================================
   PHASE 1 — DETERMINISTIC BASELINE ALLOCATION
   ============================================================
   Formula (researcher-friendly):
     stay      = days × avgStayPerNight(budget)
     food      = days × avgFoodPerDay(budget)
     transport = baseTransportCost(budget)  [fixed per trip]
     activities = totalBudget − stay − food − transport

   This is the "naive baseline" you compare knapsack against.
   ============================================================ */

/**
 * Estimate average stay cost per night from hotel data or fallback.
 * @param {Object[]} hotels - Hotel objects with pricePerNight field
 * @param {string}   budget - Budget category
 * @returns {number} Estimated per-night cost in ₹
 */
function estimateStayPerNight(hotels, budget) {
    if (hotels && hotels.length > 0) {
        const withPrice = hotels.filter(h => h.pricePerNight > 0);
        if (withPrice.length > 0) {
            return withPrice.reduce((s, h) => s + h.pricePerNight, 0) / withPrice.length;
        }
    }
    // Static fallback per budget tier
    const fallback = { cheap: 800, budget: 1200, moderate: 2500, luxury: 7000 };
    return fallback[normalizeBudgetKey(budget)] || 2500;
}

/**
 * Allocate total budget into stay / food / transport / activities.
 *
 * @param {number}   totalBudget   - Total trip budget in ₹
 * @param {number}   days          - Trip duration
 * @param {string}   budget        - Budget category ("Cheap"|"Moderate"|"Luxury")
 * @param {string}   travelWith    - "Solo"|"Couple"|"Family"|"Friends"
 * @param {Object[]} hotels        - Available hotels (for avg price)
 * @returns {{ stay, food, transport, activities, totalBudget, deficit }}
 */
export function allocateBudget({ totalBudget, days, budget, travelWith, hotels = [] }) {
    if (!totalBudget || totalBudget <= 0) {
        return null; // Optimizer disabled — caller uses category-only
    }

    const key = normalizeBudgetKey(budget);
    const people = travelWith?.toLowerCase() === "solo" ? 1
        : travelWith?.toLowerCase() === "couple" ? 2
            : 4; // family / friends default

    const stayPerNight = estimateStayPerNight(hotels, budget);
    const stay = Math.round(stayPerNight * days * (people > 2 ? 1.5 : 1));
    const food = Math.round(FOOD_COST_PER_DAY[key] * days * people);
    const transport = Math.round(TRANSPORT_BASE_COST[key] * (days > 1 ? days * 0.7 : 1));
    const activities = Math.max(0, totalBudget - stay - food - transport);
    const deficit = stay + food + transport > totalBudget
        ? stay + food + transport - totalBudget
        : 0;

    console.log(`💰 [BudgetOptimizer] Allocation:
    Total:      ₹${totalBudget}
    Stay:       ₹${stay}  (${days}N × ₹${Math.round(stayPerNight)})
    Food:       ₹${food}  (₹${FOOD_COST_PER_DAY[key]}/day × ${days}D × ${people}P)
    Transport:  ₹${transport}
    Activities: ₹${activities}
    ${deficit > 0 ? `⚠️  Deficit: ₹${deficit}` : "✅  Budget balanced"}`);

    return {
        totalBudget,
        stay,
        food,
        transport,
        activities,
        stayPerNight: Math.round(stayPerNight),
        deficit,  // > 0 means budget is tight — warn user
    };
}

/* ============================================================
   ACTIVITY COST ESTIMATION
   ============================================================ */

/**
 * Estimate the cost of an activity by name and budget tier.
 * Used when no DB record has an explicit cost.
 *
 * @param {string} activityName
 * @param {string} budget - Budget category
 * @returns {{ estimatedCost: number, costTier: string }}
 */
export function estimateActivityCost(activityName, budget) {
    const name = (activityName || "").toLowerCase();
    const key = normalizeBudgetKey(budget);

    // Free activities
    if (/park|beach|lake|river|viewpoint|sunrise|sunset|garden|walk|promenade/i.test(name)) {
        return { estimatedCost: 0, costTier: "free" };
    }

    // Budget activities
    if (/market|bazaar|temple|church|mosque|shrine|fort|street food/i.test(name)) {
        return { estimatedCost: ACTIVITY_COST_DEFAULTS.budget, costTier: "budget" };
    }

    // Luxury activities
    if (/spa|resort|cruise|helicopter|hot air balloon|casino/i.test(name)) {
        return { estimatedCost: ACTIVITY_COST_DEFAULTS.luxury, costTier: "luxury" };
    }

    // Adventure / moderate
    if (/trek|trekking|rafting|zipline|paragliding|safari|wildlife/i.test(name)) {
        return { estimatedCost: ACTIVITY_COST_DEFAULTS.moderate, costTier: "moderate" };
    }

    // Default: use budget tier
    return {
        estimatedCost: ACTIVITY_COST_DEFAULTS[key] || ACTIVITY_COST_DEFAULTS.budget,
        costTier: key,
    };
}

/* ============================================================
   UTILITY SCORE COMPUTATION
   ============================================================
   utility_i = (priorityWeight × preferenceWeight × popularityScore) / estimatedCost

   priorityWeight: must=1.0, flexible=0.7, optional=0.4
   preferenceWeight: derived from user preferences (0.65–0.95)
   popularityScore: 1–10 (static default = 7)
   estimatedCost: in ₹ (min 1 to avoid division by zero)
   ============================================================ */

/**
 * Calculate utility score for a single activity.
 *
 * @param {Object} activity        - Activity object
 * @param {string[]} preferences   - User preference array
 * @param {number} popularityScore - 1-10 (default 7)
 * @param {number} seasonWeight    - Season multiplier from seasonEngine (0.2–1.5, default 1.0)
 * @returns {number} Utility score (higher = better)
 *
 * Formula (publishable):
 *   u_i = (w_priority × w_preference × popularity_i × w_season) / cost_i
 */
export function computeUtility(activity, preferences = [], popularityScore = 7, seasonWeight = 1.0) {
    const priorityMap = { must: 1.0, flexible: 0.7, optional: 0.4 };
    const priorityWeight = priorityMap[activity.priority] || 0.7;

    // Derive preference weight from user preferences
    let preferenceWeight = 0.7; // default
    for (const pref of preferences) {
        if (PREFERENCE_WEIGHT[pref] !== undefined) {
            preferenceWeight = Math.max(preferenceWeight, PREFERENCE_WEIGHT[pref]);
        }
    }

    const cost = Math.max(activity.estimatedCost || 1, 1); // avoid ÷0

    // Updated formula — seasonWeight is the new environmental factor
    return (priorityWeight * preferenceWeight * popularityScore * seasonWeight) / cost;
}

/* ============================================================
   PHASE 2 — GREEDY ACTIVITY SELECTION
   ============================================================
   Sort activities by utility score (desc), pick greedily
   until activity budget is exhausted.
   Time complexity: O(n log n)
   ============================================================ */

/**
 * Select activities using greedy utility-scored approach.
 *
 * @param {Object[]} activities     - All candidate activities with estimatedCost
 * @param {number}   activityBudget - Budget allocated for activities (₹)
 * @param {string[]} preferences    - User preference array
 * @returns {{ selected: Object[], totalCost: number, satisfactionScore: number }}
 */
export function selectActivitiesGreedy(activities, activityBudget, preferences = []) {
    if (!activities?.length || activityBudget <= 0) {
        return { selected: activities || [], totalCost: 0, satisfactionScore: 0 };
    }

    // Score each activity
    const scored = activities.map(a => ({
        ...a,
        utilityScore: computeUtility(a, preferences),
    }));

    // Sort: must-priority first, then by utility desc
    scored.sort((a, b) => {
        if (a.priority === "must" && b.priority !== "must") return -1;
        if (b.priority === "must" && a.priority !== "must") return 1;
        return b.utilityScore - a.utilityScore;
    });

    let remaining = activityBudget;
    const selected = [];

    for (const activity of scored) {
        if (activity.priority === "must") {
            selected.push(activity);
            remaining -= activity.estimatedCost;
        } else if (remaining >= activity.estimatedCost) {
            selected.push(activity);
            remaining -= activity.estimatedCost;
        }
    }

    const totalCost = activityBudget - remaining;
    const satisfactionScore = calculateSatisfactionScore(selected, activities);

    return { selected, totalCost, satisfactionScore };
}

/* ============================================================
   PHASE 3 — 0/1 KNAPSACK ACTIVITY SELECTION
   ============================================================
   Maximize Σ utilityScore_i × x_i
   Subject to: Σ estimatedCost_i × x_i ≤ activityBudget
               x_i ∈ {0, 1}
   Time complexity: O(n × B) where B = activityBudget (discretized)
   ============================================================ */

/**
 * Select activities using 0/1 Knapsack DP for maximum satisfaction.
 * Budget is discretized to units of ₹100 to keep the table manageable.
 *
 * @param {Object[]} activities     - All candidate activities with estimatedCost
 * @param {number}   activityBudget - Budget allocated for activities (₹)
 * @param {string[]} preferences    - User preference array
 * @returns {{ selected: Object[], totalCost: number, satisfactionScore: number }}
 */
export function selectActivitiesKnapsack(activities, activityBudget, preferences = []) {
    if (!activities?.length || activityBudget <= 0) {
        return { selected: activities || [], totalCost: 0, satisfactionScore: 0 };
    }

    // Always include "must" priority items first
    const must = activities.filter(a => a.priority === "must");
    const others = activities.filter(a => a.priority !== "must");

    let mustCost = must.reduce((s, a) => s + (a.estimatedCost || 0), 0);
    let remaining = activityBudget - mustCost;

    if (remaining < 0 || others.length === 0) {
        const totalCost = mustCost;
        return {
            selected: must,
            totalCost,
            satisfactionScore: calculateSatisfactionScore(must, activities),
        };
    }

    // Discretize: use units of ₹100 to cap table size
    const UNIT = 100;
    const W = Math.floor(remaining / UNIT); // capacity in units
    const n = others.length;

    // Precompute scored costs and utilities
    const scored = others.map(a => ({
        ...a,
        utilityScore: computeUtility(a, preferences),
        wUnits: Math.max(1, Math.ceil((a.estimatedCost || UNIT) / UNIT)),
    }));

    // DP table (1D optimization)
    const dp = new Array(W + 1).fill(0);
    // Track selections
    const keep = Array.from({ length: n }, () => new Array(W + 1).fill(false));

    for (let i = 0; i < n; i++) {
        const { utilityScore, wUnits } = scored[i];
        for (let w = W; w >= wUnits; w--) {
            if (dp[w - wUnits] + utilityScore > dp[w]) {
                dp[w] = dp[w - wUnits] + utilityScore;
                keep[i][w] = true;
            }
        }
    }

    // Backtrack to find selected items
    const knapsackSelected = [];
    let w = W;
    for (let i = n - 1; i >= 0; i--) {
        if (keep[i][w]) {
            knapsackSelected.push(scored[i]);
            w -= scored[i].wUnits;
        }
    }

    const selected = [...must, ...knapsackSelected];
    const totalCost = mustCost + knapsackSelected.reduce((s, a) => s + (a.estimatedCost || 0), 0);
    const satisfactionScore = calculateSatisfactionScore(selected, activities);

    return { selected, totalCost, satisfactionScore };
}

/* ============================================================
   SATISFACTION SCORE
   ============================================================
   S = Σ utility(selected_i) / Σ utility(all_i)
   Range: 0.0 (nothing chosen) → 1.0 (best possible choice)
   ============================================================ */

/**
 * Calculate satisfaction score for a selection.
 * @param {Object[]} selected  - Selected activities
 * @param {Object[]} all       - All candidate activities
 * @returns {number} 0–1 satisfaction score
 */
export function calculateSatisfactionScore(selected, all) {
    if (!all?.length) return 0;

    const sumAll = all.reduce((s, a) => s + (a.utilityScore || 1), 0);
    const sumSelected = selected.reduce((s, a) => s + (a.utilityScore || 1), 0);

    return sumAll > 0 ? Math.min(1, parseFloat((sumSelected / sumAll).toFixed(4))) : 0;
}

/* ============================================================
   PLAN COMPARISON (Research Layer)
   ============================================================ */

/**
 * Run both greedy and knapsack, return comparison metrics for paper.
 *
 * @param {Object[]} activities     - All candidate activities
 * @param {number}   activityBudget - Activity budget in ₹
 * @param {string[]} preferences    - User preferences
 * @returns {Object} Comparison metrics object
 */
export function comparePlans(activities, activityBudget, preferences = []) {
    const startGreedy = Date.now();
    const greedy = selectActivitiesGreedy(activities, activityBudget, preferences);
    const greedyMs = Date.now() - startGreedy;

    const startKnap = Date.now();
    const knapsack = selectActivitiesKnapsack(activities, activityBudget, preferences);
    const knapMs = Date.now() - startKnap;

    const comparison = {
        greedy: {
            selectedCount: greedy.selected.length,
            totalCost: greedy.totalCost,
            satisfactionScore: greedy.satisfactionScore,
            budgetUtilization: activityBudget > 0 ? parseFloat((greedy.totalCost / activityBudget).toFixed(4)) : 0,
            processingTimeMs: greedyMs,
            algorithm: "greedy",
        },
        knapsack: {
            selectedCount: knapsack.selected.length,
            totalCost: knapsack.totalCost,
            satisfactionScore: knapsack.satisfactionScore,
            budgetUtilization: activityBudget > 0 ? parseFloat((knapsack.totalCost / activityBudget).toFixed(4)) : 0,
            processingTimeMs: knapMs,
            algorithm: "knapsack",
        },
        improvement: {
            satisfactionDelta: parseFloat((knapsack.satisfactionScore - greedy.satisfactionScore).toFixed(4)),
            utilizationDelta: parseFloat(((knapsack.totalCost - greedy.totalCost) / activityBudget).toFixed(4)),
        },
    };

    console.log(`📊 [ResearchMetrics] Greedy: ${greedy.satisfactionScore} satisfaction | Knapsack: ${knapsack.satisfactionScore} satisfaction`);
    console.log(`⏱️  Greedy: ${greedyMs}ms | Knapsack: ${knapMs}ms`);

    return { greedy, knapsack, comparison };
}

/* ============================================================
   BUDGET BREAKDOWN SUMMARY
   Combines allocation + actual spending for Trip document
   ============================================================ */

/**
 * Build final budgetBreakdown object to save to Trip.
 *
 * @param {Object} allocation     - Output of allocateBudget()
 * @param {Object} actualSpent    - { stay, food, transport, activities } actual amounts
 * @param {number} satisfactionScore - 0-1
 * @param {string} algorithm      - "greedy" | "knapsack"
 * @returns {Object} budgetBreakdown for Trip schema
 */
export function buildBudgetBreakdown(allocation, actualSpent = {}, satisfactionScore = 0, algorithm = "greedy") {
    if (!allocation) return null;

    const totalActual = (actualSpent.stay || 0)
        + (actualSpent.food || 0)
        + (actualSpent.transport || 0)
        + (actualSpent.activities || 0);

    return {
        totalBudget: allocation.totalBudget,
        allocated: {
            stay: allocation.stay,
            food: allocation.food,
            transport: allocation.transport,
            activities: allocation.activities,
        },
        actualSpent: {
            stay: actualSpent.stay || allocation.stay,
            food: actualSpent.food || allocation.food,
            transport: actualSpent.transport || allocation.transport,
            activities: actualSpent.activities || 0,
        },
        satisfactionScore,
        budgetUtilization: allocation.totalBudget > 0
            ? parseFloat((totalActual / allocation.totalBudget).toFixed(4))
            : 0,
        algorithm,
    };
}
