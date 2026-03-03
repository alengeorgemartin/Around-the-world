import Business from "../models/Business.js";
import { geocodePlace } from "../aiController.js";

/* ======================================================
   BUSINESS CONTROLLER - API Endpoints
   
   Handles:
   - Business registration by users
   - Business listing & filtering
   - Admin approval workflow
   - Internal business fetching for AI
====================================================== */

/**
 * Register a new business
 * POST /api/business/register
 * Auth: Required (user)
 */
export const registerBusiness = async (req, res) => {
    try {
        console.log("📝 Business registration request received");
        console.log("User:", req.user);
        console.log("Body:", JSON.stringify(req.body, null, 2));

        const {
            businessType,
            name,
            description,
            location,
            priceRange,
            pricePerNight,
            pricePerDay,
            hotelDetails,
            rentalDetails,
            tourDetails,
            availability,
            contact,
            photos,
        } = req.body;

        // Validate required fields
        if (!businessType || !name || !description || !location || !priceRange || !contact?.phone) {
            console.log("❌ Missing required fields");
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Geocode the address if not provided
        let geo = location.geo;
        if (!geo || !geo.lat || !geo.lng) {
            console.log("🌍 Geocoding address:", location.address, location.city);
            const geoResult = await geocodePlace(location.address, location.city);
            if (geoResult) {
                geo = { lat: geoResult.lat, lng: geoResult.lng };
                console.log("✅ Geocoded:", geo);
            } else {
                console.log("❌ Geocoding failed");
                return res.status(400).json({
                    success: false,
                    message: "Could not geocode location. Please provide valid address.",
                });
            }
        }

        // Convert lat/lng to GeoJSON format
        const geoJSON = {
            type: "Point",
            coordinates: [geo.lng, geo.lat], // MongoDB expects [longitude, latitude]
        };

        // Create business - use _id from MongoDB user object
        const ownerId = req.user._id || req.user.id;
        console.log("👤 Owner ID:", ownerId);

        const business = await Business.create({
            ownerId,
            businessType,
            name,
            description,
            location: {
                ...location,
                geo: geoJSON,
            },
            priceRange,
            pricePerNight,
            pricePerDay,
            hotelDetails: businessType === "hotel" ? hotelDetails : undefined,
            rentalDetails: businessType === "rental" ? rentalDetails : undefined,
            tourDetails: businessType === "tour" ? tourDetails : undefined,
            availability: availability || { isAvailable: true },
            contact,
            photos: photos || [],
            status: "pending", // Requires admin approval
        });

        console.log("✅ Business created successfully:", business._id);

        res.status(201).json({
            success: true,
            message: "Business registered successfully. Pending admin approval.",
            data: business,
        });
    } catch (err) {
        console.error("❌ Business registration error:");
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to register business",
        });
    }
};

/**
 * Get all businesses owned by current user
 * GET /api/business/my-businesses
 * Auth: Required (user)
 */
export const getMyBusinesses = async (req, res) => {
    try {
        const businesses = await Business.find({ ownerId: req.user.id }).sort({
            createdAt: -1,
        });

        res.json({
            success: true,
            data: businesses,
        });
    } catch (err) {
        console.error("❌ Get my businesses error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch businesses",
        });
    }
};

/**
 * Update a business
 * PUT /api/business/:id
 * Auth: Required (owner)
 */
export const updateBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const business = await Business.findById(id);

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found",
            });
        }

        // Check ownership
        if (business.ownerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // Update business
        Object.assign(business, req.body);

        // If location changed, re-geocode
        if (req.body.location && !req.body.location.geo) {
            const geoResult = await geocodePlace(
                req.body.location.address,
                req.body.location.city
            );
            if (geoResult) {
                business.location.geo = {
                    type: "Point",
                    coordinates: [geoResult.lng, geoResult.lat],
                };
            }
        }

        await business.save();

        res.json({
            success: true,
            message: "Business updated successfully",
            data: business,
        });
    } catch (err) {
        console.error("❌ Update business error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to update business",
        });
    }
};

/**
 * Delete a business
 * DELETE /api/business/:id
 * Auth: Required (owner)
 */
export const deleteBusiness = async (req, res) => {
    try {
        const { id } = req.params;
        const business = await Business.findById(id);

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found",
            });
        }

        // Check ownership
        if (business.ownerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        await Business.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Business deleted successfully",
        });
    } catch (err) {
        console.error("❌ Delete business error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete business",
        });
    }
};

/**
 * List businesses by type and location (public)
 * GET /api/business/type/:type?city=...&priceRange=...
 * Auth: Not required
 */
export const listBusinessesByType = async (req, res) => {
    try {
        const { type } = req.params;
        const { city, priceRange, limit = 20 } = req.query;

        const query = {
            businessType: type,
            status: "approved",
            "availability.isAvailable": true,
        };

        if (city) {
            query["location.city"] = new RegExp(city, "i");
        }

        if (priceRange) {
            query.priceRange = priceRange;
        }

        const businesses = await Business.find(query)
            .limit(parseInt(limit))
            .sort({ "stats.averageRating": -1, createdAt: -1 })
            .select("-ownerId"); // Don't expose owner ID publicly

        res.json({
            success: true,
            count: businesses.length,
            data: businesses,
        });
    } catch (err) {
        console.error("❌ List businesses error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to list businesses",
        });
    }
};

/**
 * Admin: Get ALL businesses (all statuses)
 * GET /api/business/admin/all
 * Auth: Required (admin)
 */
export const getAllBusinessesForAdmin = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        // Fetch ALL businesses, regardless of status
        const businesses = await Business.find({})
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: businesses.length,
            data: businesses,
        });
    } catch (err) {
        console.error("❌ Get all businesses error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch businesses",
        });
    }
};

/**
 * Admin: Update business status (approve/reject)
 * PATCH /api/business/:id/status
 * Auth: Required (admin)
 */
export const updateBusinessStatus = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        const business = await Business.findById(id);

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found",
            });
        }

        business.status = status;
        if (status === "approved") {
            business.verifiedAt = new Date();
        }
        if (status === "rejected" && rejectionReason) {
            business.rejectionReason = rejectionReason;
        }

        await business.save();

        res.json({
            success: true,
            message: `Business ${status} successfully`,
            data: business,
        });
    } catch (err) {
        console.error("❌ Update status error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to update business status",
        });
    }
};

/**
 * Internal: Get businesses for AI trip planning
 * This is used by aiController, not exposed as public API
 * (Could be made internal-only or require special auth)
 */
export const getBusinessesForAI = async (location, budget, filters = {}) => {
    try {
        const city = location.split(",")[0].trim();

        const query = {
            status: "approved",
            "availability.isAvailable": true,
            "location.city": new RegExp(city, "i"),
            ...filters,
        };

        const businesses = await Business.find(query).limit(20).lean();

        return businesses;
    } catch (err) {
        console.error("❌ Get businesses for AI error:", err.message);
        return [];
    }
};
