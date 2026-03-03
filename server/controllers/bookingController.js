import Booking from "../models/Booking.js";
import Business from "../models/Business.js";
import Trip from "../models/Trip.js";

/**
 * Create a new booking
 * POST /api/bookings/create
 * Auth: Required (user)
 */
export const createBooking = async (req, res) => {
    try {
        const {
            tripId,
            businessId,
            bookingType,
            checkIn,
            checkOut,
            roomType,
            guests,
            pickupLocation,
            returnLocation,
            tourDay,
            participants,
            basePrice,
            totalPrice,
            specialRequests,
            contactInfo,
        } = req.body;

        // Validate required fields
        if (!tripId || !businessId || !bookingType || !checkIn || !checkOut || !basePrice || !totalPrice) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Verify trip belongs to user
        const trip = await Trip.findById(tripId);
        if (!trip || trip.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized - trip not found or does not belong to you",
            });
        }

        // Verify business exists and is approved
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found",
            });
        }

        if (business.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Business is not approved for bookings",
            });
        }

        // Create booking
        const booking = await Booking.create({
            userId: req.user.id,
            tripId,
            businessId,
            bookingType,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            roomType,
            guests,
            pickupLocation,
            returnLocation,
            tourDay,
            participants,
            basePrice,
            totalPrice,
            specialRequests,
            contactInfo,
            status: "pending",
            paymentStatus: "pending",
        });

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });
    } catch (err) {
        console.error("❌ Create booking error:", err.message);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to create booking",
        });
    }
};

/**
 * Get all bookings for current user
 * GET /api/bookings/my-bookings
 * Auth: Required (user)
 */
export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id })
            .populate("businessId", "name businessType location contact")
            .populate("tripId", "location days startDate")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (err) {
        console.error("❌ Get my bookings error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
        });
    }
};

/**
 * Get bookings for a specific business (for business owners)
 * GET /api/bookings/business/:businessId
 * Auth: Required (user/admin)
 */
export const getBusinessBookings = async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verify business ownership
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found",
            });
        }

        if (business.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Unauthorized - not the business owner",
            });
        }

        const bookings = await Booking.find({ businessId })
            .populate("userId", "name email")
            .populate("tripId", "location days startDate")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (err) {
        console.error("❌ Get business bookings error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
        });
    }
};

/**
 * Get all bookings for all businesses owned by current user
 * GET /api/bookings/business/my-bookings
 * Auth: Required (user)
 */
export const getBusinessOwnerBookings = async (req, res) => {
    try {
        // Find all businesses owned by the current user
        const businesses = await Business.find({ ownerId: req.user.id });

        if (!businesses || businesses.length === 0) {
            return res.json({
                success: true,
                count: 0,
                data: [],
                message: "No businesses found for this user",
            });
        }

        const businessIds = businesses.map(b => b._id);

        // Find all bookings for these businesses
        const bookings = await Booking.find({ businessId: { $in: businessIds } })
            .populate("userId", "name email")
            .populate("tripId", "location days startDate")
            .populate("businessId", "name businessType location")
            .populate("statusUpdatedBy", "name email")
            .sort({ createdAt: -1 });

        // Group bookings by business
        const groupedBookings = {};
        businesses.forEach(business => {
            groupedBookings[business._id] = {
                business: {
                    id: business._id,
                    name: business.name,
                    type: business.businessType,
                },
                bookings: [],
                stats: {
                    total: 0,
                    pending: 0,
                    confirmed: 0,
                    cancelled: 0,
                    completed: 0,
                },
            };
        });

        bookings.forEach(booking => {
            const businessId = booking.businessId._id.toString();
            if (groupedBookings[businessId]) {
                groupedBookings[businessId].bookings.push(booking);
                groupedBookings[businessId].stats.total++;
                groupedBookings[businessId].stats[booking.status]++;
            }
        });

        res.json({
            success: true,
            count: bookings.length,
            businesses: businesses.length,
            data: groupedBookings,
            allBookings: bookings, // Flat list for easier filtering
        });
    } catch (err) {
        console.error("❌ Get business owner bookings error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
        });
    }
};

/**
 * Get single booking details
 * GET /api/bookings/:id
 * Auth: Required (user)
 */
export const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await Booking.findById(id)
            .populate("businessId")
            .populate("tripId")
            .populate("userId", "name email");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Check authorization
        if (booking.userId._id.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        res.json({
            success: true,
            data: booking,
        });
    } catch (err) {
        console.error("❌ Get booking error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking",
        });
    }
};

/**
 * Update booking status
 * PATCH /api/bookings/:id/status
 * Auth: Required (business owner or admin)
 */
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectedReason, businessNotes } = req.body;

        if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        const booking = await Booking.findById(id).populate("businessId");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Check authorization - business owner or admin
        if (
            booking.businessId.ownerId.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        booking.status = status;
        booking.statusUpdatedAt = new Date();
        booking.statusUpdatedBy = req.user.id;

        if (status === "cancelled") {
            booking.cancelledAt = new Date();
            if (rejectedReason) {
                booking.rejectedReason = rejectedReason;
            }
        }

        if (businessNotes) {
            booking.businessNotes = businessNotes;
        }

        await booking.save();

        // Populate for response
        await booking.populate("userId", "name email");
        await booking.populate("statusUpdatedBy", "name email");

        res.json({
            success: true,
            message: `Booking ${status} successfully`,
            data: booking,
        });
    } catch (err) {
        console.error("❌ Update booking status error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to update booking",
        });
    }
};

/**
 * Cancel booking (by user)
 * DELETE /api/bookings/:id
 * Auth: Required (user)
 */
export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Check authorization
        if (booking.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking already cancelled",
            });
        }

        booking.status = "cancelled";
        booking.cancelledAt = new Date();
        booking.cancellationReason = reason || "Cancelled by user";
        await booking.save();

        res.json({
            success: true,
            message: "Booking cancelled successfully",
            data: booking,
        });
    } catch (err) {
        console.error("❌ Cancel booking error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to cancel booking",
        });
    }
};
