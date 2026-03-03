/**
 * TIME ENGINE MODULE
 * 
 * Handles all itinerary time calculations independently from database/UI concerns.
 * Provides normalization, conflict detection, and resolution logic.
 * 
 * Core principles:
 * - No database dependencies
 * - No UI dependencies
 * - Deterministic (same input → same output)
 * - Never crashes on bad data
 * - Pure functions (testable)
 */

/* =====================================================
   TIME PARSING & FORMATTING UTILITIES
===================================================== */

/**
 * Parse time string to minutes since midnight
 * @param {string} timeStr - Time string (e.g., "9:30 AM")
 * @param {number} defaultMinutes - Default if parsing fails
 * @returns {number} Minutes since midnight
 */
export function parseTimeToMinutes(timeStr, defaultMinutes = 540) {
    if (!timeStr || typeof timeStr !== "string") return defaultMinutes;

    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return defaultMinutes;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const totalMinutes = hours * 60 + minutes;

    // Validate range (6 AM to 11 PM)
    if (totalMinutes < 360 || totalMinutes > 1380) return defaultMinutes;

    return totalMinutes;
}

/**
 * Convert minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Formatted time (e.g., "9:30 AM")
 */
export function minutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Parse duration to minutes
 * @param {string|number} duration - Duration value
 * @param {number} defaultMinutes - Default if parsing fails
 * @returns {number} Duration in minutes
 */
export function parseDurationToMinutes(duration, defaultMinutes = 90) {
    if (typeof duration === "number" && duration > 0) return duration;
    if (!duration || typeof duration !== "string") return defaultMinutes;

    // Match "1-2 hours", "90 min", etc.
    const rangeMatch = duration.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(hour|hr|min)/i);
    if (rangeMatch) {
        const avg = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
        const unit = rangeMatch[3].toLowerCase();
        return unit.startsWith("hour") || unit === "hr" ? avg * 60 : avg;
    }

    const singleMatch = duration.match(/(\d+(?:\.\d+)?)\s*(hour|hr|min)/i);
    if (singleMatch) {
        const value = parseFloat(singleMatch[1]);
        const unit = singleMatch[2].toLowerCase();
        return unit.startsWith("hour") || unit === "hr" ? value * 60 : value;
    }

    return defaultMinutes;
}

/**
 * Get default start time for period
 * @param {string} period - morning|afternoon|evening
 * @returns {number} Default start time in minutes
 */
export function getDefaultStartTime(period) {
    const defaults = {
        morning: 9 * 60,      // 9:00 AM
        afternoon: 14 * 60,   // 2:00 PM
        evening: 18 * 60,     // 6:00 PM
    };
    return defaults[period] || 9 * 60;
}

/* =====================================================
   ACTIVITY NORMALIZATION
===================================================== */

/**
 * Normalize a single activity to internal timeline format
 * @param {Object} activity - Raw activity from database
 * @param {string} period - morning|afternoon|evening
 * @param {number} index - Index in period array
 * @returns {Object} Normalized activity
 */
export function normalizeActivity(activity, period, index) {
    // Parse start time
    const startMinutes = activity.startTime
        ? parseTimeToMinutes(activity.startTime, getDefaultStartTime(period))
        : getDefaultStartTime(period) + (index * 120); // Space out if missing

    // Parse duration
    const durationMinutes = activity.durationMinutes
        ? activity.durationMinutes
        : parseDurationToMinutes(activity.duration, 90);

    // Determine priority and flexibility
    const priority = activity.priority || "medium";
    const isFlexible = priority !== "high" && priority !== "must";

    return {
        ...activity,
        originalPeriod: period,
        originalIndex: index,
        startMinutes,
        durationMinutes,
        endMinutes: startMinutes + durationMinutes,
        priority,
        isFlexible,
        isSkipped: activity.status === "skipped",
        isCompleted: activity.status === "completed",
        isInProgress: activity.status === "in-progress",
    };
}

/* =====================================================
   TIMELINE CONSTRUCTION
===================================================== */

/**
 * Build a flat timeline from day itinerary
 * @param {Object} dayItinerary - Day with morning/afternoon/evening arrays
 * @returns {Array} Sorted timeline of normalized activities
 */
export function buildTimeline(dayItinerary) {
    const timeline = [];

    ["morning", "afternoon", "evening"].forEach((period) => {
        const activities = dayItinerary[period] || [];
        activities.forEach((activity, index) => {
            const normalized = normalizeActivity(activity, period, index);
            timeline.push(normalized);
        });
    });

    // Sort by start time
    timeline.sort((a, b) => a.startMinutes - b.startMinutes);

    return timeline;
}

/**
 * Convert timeline back to day itinerary format
 * @param {Array} timeline - Normalized timeline
 * @returns {Object} Day itinerary with morning/afternoon/evening
 */
export function timelineToItinerary(timeline) {
    const morning = [];
    const afternoon = [];
    const evening = [];

    timeline.forEach((activity) => {
        // Remove temporary fields
        const cleaned = { ...activity };
        delete cleaned.originalPeriod;
        delete cleaned.originalIndex;
        delete cleaned.endMinutes;
        delete cleaned.isFlexible;

        // Update time fields
        cleaned.startTime = minutesToTimeString(activity.startMinutes);
        cleaned.duration = `${activity.durationMinutes} min`;
        cleaned.durationMinutes = activity.durationMinutes;

        // Redistribute based on actual start time
        const time = activity.startMinutes;
        if (time < 12 * 60) {
            morning.push(cleaned);
        } else if (time < 18 * 60) {
            afternoon.push(cleaned);
        } else {
            evening.push(cleaned);
        }
    });

    return { morning, afternoon, evening };
}

/* =====================================================
   DELAY APPLICATION
===================================================== */

/**
 * Apply delay to timeline
 * @param {Array} timeline - Normalized timeline
 * @param {number} delayMinutes - Delay amount
 * @param {number} currentTime - Current time in minutes (optional)
 * @returns {Array} Timeline with delay applied
 */
export function applyDelay(timeline, delayMinutes, currentTime = null) {
    // If no current time provided, use earliest activity time
    const now = currentTime || Math.min(...timeline.map(a => a.startMinutes));

    return timeline.map((activity) => {
        // Skip completed/in-progress/skipped activities
        if (activity.isCompleted || activity.isInProgress || activity.isSkipped) {
            return activity;
        }

        // Shift activities that haven't started yet
        if (activity.startMinutes >= now) {
            return {
                ...activity,
                startMinutes: activity.startMinutes + delayMinutes,
                endMinutes: activity.endMinutes + delayMinutes,
            };
        }

        return activity;
    });
}

/* =====================================================
   CONFLICT DETECTION & RESOLUTION
===================================================== */

/**
 * Detect conflicts (overlaps) in timeline
 * @param {Array} timeline - Normalized timeline
 * @returns {Array} Array of conflicts
 */
export function detectConflicts(timeline) {
    const conflicts = [];

    for (let i = 0; i < timeline.length - 1; i++) {
        const current = timeline[i];
        const next = timeline[i + 1];

        if (current.endMinutes > next.startMinutes) {
            conflicts.push({
                currentIndex: i,
                nextIndex: i + 1,
                overlapMinutes: current.endMinutes - next.startMinutes,
            });
        }
    }

    return conflicts;
}

/**
 * Resolve conflicts in timeline
 * @param {Array} timeline - Timeline with conflicts
 * @param {Object} options - Resolution options
 * @returns {Object} { timeline, changes }
 */
export function resolveConflicts(timeline, options = {}) {
    const {
        endOfDay = 22 * 60,           // 10:00 PM
        minDuration = 30,              // Minimum activity duration
        maxIterations = 50,            // Prevent infinite loops
    } = options;

    const changes = {
        compressed: [],
        moved: [],
        removed: [],
    };

    let conflicts = detectConflicts(timeline);
    let iterations = 0;

    while (conflicts.length > 0 && iterations < maxIterations) {
        iterations++;
        const conflict = conflicts[0];
        const current = timeline[conflict.currentIndex];
        const next = timeline[conflict.nextIndex];
        const overlapMinutes = conflict.overlapMinutes;

        let resolved = false;

        // Strategy 1: Compress flexible activity
        if (current.isFlexible && current.durationMinutes > minDuration) {
            const reduction = Math.min(overlapMinutes, current.durationMinutes - minDuration);
            const oldDuration = current.durationMinutes;
            current.durationMinutes -= reduction;
            current.endMinutes -= reduction;

            changes.compressed.push({
                activity: current.activity,
                oldDuration,
                newDuration: current.durationMinutes,
                savedMinutes: reduction,
            });

            resolved = true;
        }
        // Strategy 2: Move next activity forward
        else if (next.endMinutes + overlapMinutes <= endOfDay) {
            const oldStart = next.startMinutes;
            next.startMinutes += overlapMinutes;
            next.endMinutes += overlapMinutes;

            changes.moved.push({
                activity: next.activity,
                oldStart: minutesToTimeString(oldStart),
                newStart: minutesToTimeString(next.startMinutes),
            });

            resolved = true;
        }
        // Strategy 3: Remove lower priority activity
        else if (current.priority === "low" || (current.isFlexible && next.priority === "high")) {
            current.isSkipped = true;
            current.status = "skipped";

            changes.removed.push({
                activity: current.activity,
                reason: "Removed to accommodate delay",
                priority: current.priority,
            });

            resolved = true;
        }
        else if (next.priority === "low") {
            next.isSkipped = true;
            next.status = "skipped";

            changes.removed.push({
                activity: next.activity,
                reason: "Removed to accommodate delay",
                priority: next.priority,
            });

            resolved = true;
        }
        // Last resort: compress aggressively
        else if (current.durationMinutes > 20) {
            const reduction = Math.min(overlapMinutes, current.durationMinutes - 20);
            const oldDuration = current.durationMinutes;
            current.durationMinutes -= reduction;
            current.endMinutes -= reduction;

            changes.compressed.push({
                activity: current.activity,
                oldDuration,
                newDuration: current.durationMinutes,
                savedMinutes: reduction,
            });

            resolved = true;
        }

        // Force removal if nothing worked
        if (!resolved) {
            current.isSkipped = true;
            current.status = "skipped";

            changes.removed.push({
                activity: current.activity,
                reason: "Critical conflict - unavoidable removal",
                priority: current.priority,
            });
        }

        // Recheck conflicts
        conflicts = detectConflicts(timeline);
    }

    // Filter out skipped activities
    const finalTimeline = timeline.filter((activity) => !activity.isSkipped);

    return { timeline: finalTimeline, changes };
}

/* =====================================================
   EXPLANATION GENERATION
===================================================== */

/**
 * Generate human-readable explanation
 * @param {number} delayMinutes - Applied delay
 * @param {Object} changes - Changes made
 * @param {string} location - Trip location
 * @returns {Object} Explanation object
 */
export function generateExplanation(delayMinutes, changes, location = "your destination") {
    const { compressed, moved, removed } = changes;

    let summary = `You were running ${delayMinutes} minutes late in ${location}. `;

    if (removed.length === 0 && compressed.length === 0) {
        summary += "All activities adjusted smoothly without any removals.";
    } else {
        const parts = [];

        if (compressed.length > 0) {
            const names = compressed.map((c) => c.activity).slice(0, 2).join(", ");
            parts.push(`shortened ${compressed.length} activity(ies) including ${names}`);
        }

        if (moved.length > 0) {
            parts.push(`moved ${moved.length} activity(ies) to later times`);
        }

        if (removed.length > 0) {
            const names = removed.map((r) => r.activity).slice(0, 2).join(", ");
            parts.push(`removed ${removed.length} optional activity(ies) including ${names}`);
        }

        summary += "I " + parts.join(", ") + " to get you back on track.";
    }

    return {
        delayApplied: delayMinutes,
        compressedActivities: compressed,
        movedActivities: moved,
        removedActivities: removed,
        summaryMessage: summary,
    };
}

/* =====================================================
   COMPLETE WORKFLOW HELPER
===================================================== */

/**
 * Complete workflow: apply delay and resolve conflicts
 * @param {Object} dayItinerary - Day with morning/afternoon/evening
 * @param {number} delayMinutes - Delay to apply
 * @param {Object} options - Additional options
 * @returns {Object} { updatedItinerary, explanation }
 */
export function processRunningLate(dayItinerary, delayMinutes, options = {}) {
    const { location = "your destination", currentTime = null } = options;

    // 1. Build timeline
    let timeline = buildTimeline(dayItinerary);

    // 2. Apply delay
    timeline = applyDelay(timeline, delayMinutes, currentTime);

    // 3. Resolve conflicts
    const { timeline: resolvedTimeline, changes } = resolveConflicts(timeline, options);

    // 4. Generate explanation
    const explanation = generateExplanation(delayMinutes, changes, location);

    // 5. Convert back to itinerary format
    const updatedItinerary = timelineToItinerary(resolvedTimeline);

    return {
        updatedItinerary,
        explanation,
        changes,
    };
}

// Export all functions
export default {
    // Time utilities
    parseTimeToMinutes,
    minutesToTimeString,
    parseDurationToMinutes,
    getDefaultStartTime,

    // Normalization
    normalizeActivity,

    // Timeline
    buildTimeline,
    timelineToItinerary,

    // Delay
    applyDelay,

    // Conflicts
    detectConflicts,
    resolveConflicts,

    // Explanation
    generateExplanation,

    // Complete workflow
    processRunningLate,
};
