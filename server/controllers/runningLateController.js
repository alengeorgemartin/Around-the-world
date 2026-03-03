import Trip from "../models/Trip.js";
import { processRunningLate } from "../utils/timeEngine.js";

// In-memory rate limiting
const cooldownCache = new Map();

// Cleanup expired cooldown entries
setInterval(() => {
    const now = Date.now();
    for (const [key, expiry] of cooldownCache.entries()) {
        if (expiry < now) {
            cooldownCache.delete(key);
        }
    }
}, 60000);

/**
 * Main controller for Running Late feature
 * Uses the time engine module for all time logic
 */
export const handleRunningLate = async (req, res) => {
    try {
        const { trip_id, day, delay_minutes } = req.body;

        // 1. Validation
        if (!trip_id || !day || !delay_minutes) {
            return res.status(400).json({
                success: false,
                error: "Invalid request",
                message: "trip_id, day, and delay_minutes are required",
            });
        }

        if (delay_minutes < 10) {
            return res.status(400).json({
                success: false,
                error: "Delay too small",
                message: "Minimum delay is 10 minutes",
            });
        }

        if (![15, 30, 60].includes(delay_minutes)) {
            return res.status(400).json({
                success: false,
                error: "Invalid delay value",
                message: "Delay must be 15, 30, or 60 minutes",
            });
        }

        // 2. Fetch trip
        const trip = await Trip.findById(trip_id);
        if (!trip) {
            return res.status(404).json({
                success: false,
                error: "Trip not found",
            });
        }

        // 3. Authorization
        if (trip.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: "Unauthorized",
            });
        }

        // 4. Find day
        const dayNumber = parseInt(day);
        const dayItinerary = trip.itinerary.find((d) => d.day === dayNumber);

        if (!dayItinerary) {
            return res.status(404).json({
                success: false,
                error: "Day not found in itinerary",
            });
        }

        // 5. Save undo snapshot
        const undoSnapshot = {
            timestamp: new Date(),
            snapshot: JSON.parse(JSON.stringify(dayItinerary)),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        if (!trip.undoSnapshots) {
            trip.undoSnapshots = [];
        }
        trip.undoSnapshots.push(undoSnapshot);

        if (trip.undoSnapshots.length > 3) {
            trip.undoSnapshots = trip.undoSnapshots.slice(-3);
        }

        // 6. Process using time engine
        const { updatedItinerary, explanation, changes } = processRunningLate(
            dayItinerary,
            delay_minutes,
            {
                location: trip.location,
                currentTime: null, // Use earliest activity time
                endOfDay: 22 * 60, // 10:00 PM
                minDuration: 30,
            }
        );

        // 7. Update trip
        dayItinerary.morning = updatedItinerary.morning;
        dayItinerary.afternoon = updatedItinerary.afternoon;
        dayItinerary.evening = updatedItinerary.evening;

        await trip.save();

        // 8. Return response
        res.json({
            success: true,
            message: `Itinerary adjusted for ${delay_minutes}-minute delay`,
            changes: {
                adjusted_activities: [
                    ...changes.compressed.map((c) => ({
                        activity_name: c.activity,
                        change_type: "compressed",
                        old_duration: c.oldDuration,
                        new_duration: c.newDuration,
                    })),
                    ...changes.moved.map((m) => ({
                        activity_name: m.activity,
                        change_type: "moved",
                        old_start_time: m.oldStart,
                        new_start_time: m.newStart,
                    })),
                    ...changes.removed.map((r) => ({
                        activity_name: r.activity,
                        change_type: "removed",
                        reason: r.reason,
                    })),
                ],
                ai_explanation: explanation.summaryMessage,
                removed_count: changes.removed.length,
                compressed_count: changes.compressed.length,
                moved_count: changes.moved.length,
            },
            explanation,
            undo_token: undoSnapshot._id || trip.undoSnapshots[trip.undoSnapshots.length - 1]._id,
        });
    } catch (err) {
        console.error("❌ Running Late error:", err.message);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to adjust itinerary",
        });
    }
};

/**
 * Undo last Running Late adjustment
 */
export const undoRunningLate = async (req, res) => {
    try {
        const { trip_id, undo_token } = req.body;

        if (!trip_id || !undo_token) {
            return res.status(400).json({
                success: false,
                error: "trip_id and undo_token are required",
            });
        }

        const trip = await Trip.findById(trip_id);
        if (!trip) {
            return res.status(404).json({ success: false, error: "Trip not found" });
        }

        if (trip.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: "Unauthorized" });
        }

        const snapshot = trip.undoSnapshots[trip.undoSnapshots.length - 1];

        if (!snapshot) {
            return res.status(404).json({
                success: false,
                error: "No undo data available",
            });
        }

        const dayNumber = snapshot.snapshot.day;
        const dayIndex = trip.itinerary.findIndex((d) => d.day === dayNumber);

        if (dayIndex !== -1) {
            trip.itinerary[dayIndex] = snapshot.snapshot;
            trip.undoSnapshots.pop();
            await trip.save();

            res.json({
                success: true,
                message: "Changes reverted successfully",
            });
        } else {
            res.status(404).json({
                success: false,
                error: "Day not found in itinerary",
            });
        }
    } catch (err) {
        console.error("❌ Undo error:", err.message);
        res.status(500).json({
            success: false,
            error: "Failed to undo changes",
        });
    }
};
