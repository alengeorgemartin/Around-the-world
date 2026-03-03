import mongoose from "mongoose";

/* ======================================================
   BUSINESS MODEL - Multi-stakeholder Tourism Platform
   
   Supports: Hotels, Vehicle Rentals, Tour Packages
   
   Design Features:
   - Single flexible schema for all business types
   - Geospatial indexing for location-based queries
   - Admin approval workflow (pending → approved)
   - Future-ready for bookings, ratings, payments
====================================================== */

const businessSchema = new mongoose.Schema(
    {
        // ============ OWNERSHIP ============
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // ============ BUSINESS TYPE ============
        businessType: {
            type: String,
            enum: ["hotel", "rental", "tour"],
            required: true,
            index: true,
        },

        // ============ BASIC INFORMATION ============
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            maxlength: 500,
        },

        // ============ LOCATION (Critical for AI matching) ============
        location: {
            address: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
                index: true,
            },
            state: String,
            country: {
                type: String,
                default: "India",
            },
            geo: {
                type: {
                    type: String,
                    enum: ["Point"],
                    default: "Point",
                },
                coordinates: {
                    type: [Number], // [longitude, latitude]
                    required: true,
                },
            },
        },

        // ============ PRICING ============
        priceRange: {
            type: String,
            enum: ["budget", "moderate", "luxury"],
            required: true,
            index: true,
        },
        pricePerNight: Number, // For hotels
        pricePerDay: Number, // For rentals/tours

        // ============ TYPE-SPECIFIC DETAILS ============

        // Hotel-specific fields
        hotelDetails: {
            starRating: {
                type: Number,
                min: 1,
                max: 5,
            },
            amenities: [String], // Hotel-level: ['WiFi', 'Pool', 'Parking', 'Restaurant']

            // Enhanced: Individual room types with pricing
            rooms: [{
                type: {
                    type: String,
                    required: true,
                    // Examples: 'Standard AC', 'Deluxe Non-AC', 'Suite', 'Presidential Suite'
                },
                pricePerNight: {
                    type: Number,
                    required: true,
                },
                amenities: [String], // Room-specific: ['AC', 'WiFi', 'TV', 'Balcony', 'Mini Bar']
                capacity: {
                    type: Number,
                    default: 2, // Number of guests
                },
                bedType: String, // 'Single', 'Double', 'King', 'Twin'
                available: {
                    type: Boolean,
                    default: true,
                },
                description: String, // "Spacious room with king bed and ocean view"
            }],

            // Backward compatibility (kept for filtering, auto-calculated from rooms)
            roomTypes: [String], // ['Standard AC', 'Deluxe', 'Suite']
        },

        // Vehicle Rental-specific fields
        rentalDetails: {
            vehicleType: String, // 'Car', 'Bike', 'SUV', 'Scooter', 'Bus'
            model: String,
            capacity: Number, // Number of passengers
            features: [String], // ['AC', 'GPS', 'Music System', 'Driver']
        },

        // Tour Package-specific fields
        tourDetails: {
            tourType: String, // 'Adventure', 'Cultural', 'Nature', 'Food', 'Historical'
            duration: String, // '2 hours', 'Half Day', 'Full Day', '2 days'
            groupSize: String, // 'Solo friendly', 'Couples', 'Groups only', 'Family'
            includes: [String], // ['Guide', 'Meals', 'Transport', 'Entry fees']
            weatherSuitability: String, // 'outdoor', 'indoor', 'all-weather'
        },

        // ============ AVAILABILITY ============
        availability: {
            isAvailable: {
                type: Boolean,
                default: true,
            },
            seasonality: String, // 'All year', 'Summer only', 'Monsoon closed', etc.
            advanceBookingDays: Number, // How far in advance to book
        },

        // ============ CONTACT & MEDIA ============
        contact: {
            phone: {
                type: String,
                required: true,
            },
            email: String,
            website: String,
        },
        photos: [String], // URLs to business photos

        // ============ STATUS & VERIFICATION ============
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "suspended"],
            default: "pending",
            index: true,
        },
        verifiedAt: Date,
        rejectionReason: String, // Admin can provide reason for rejection

        // ============ FUTURE-READY FIELDS ============

        // Statistics (for ratings/bookings system)
        stats: {
            totalBookings: {
                type: Number,
                default: 0,
            },
            averageRating: {
                type: Number,
                default: 0,
                min: 0,
                max: 5,
            },
            reviewCount: {
                type: Number,
                default: 0,
            },
            // Rating distribution for displaying star breakdown
            ratingDistribution: {
                5: { type: Number, default: 0 },
                4: { type: Number, default: 0 },
                3: { type: Number, default: 0 },
                2: { type: Number, default: 0 },
                1: { type: Number, default: 0 },
            },
        },

        // Marketplace features
        featured: {
            type: Boolean,
            default: false, // For premium listings
        },
        commissionRate: {
            type: Number,
            default: 10, // Percentage for future payment integration
        },
    },
    {
        timestamps: true,
    }
);

// ============ INDEXES ============

// Geospatial index for location-based queries
businessSchema.index({ "location.geo": "2dsphere" });

// Compound index for efficient filtering
businessSchema.index({
    businessType: 1,
    status: 1,
    "location.city": 1
});

// Price range filtering
businessSchema.index({
    priceRange: 1,
    status: 1
});

// Owner's businesses lookup
businessSchema.index({
    ownerId: 1,
    status: 1
});

// ============ VIRTUAL FIELDS ============

// Helper to get display price
businessSchema.virtual("displayPrice").get(function () {
    if (this.businessType === "hotel" && this.pricePerNight) {
        return `₹${this.pricePerNight}/night`;
    }
    if ((this.businessType === "rental" || this.businessType === "tour") && this.pricePerDay) {
        return `₹${this.pricePerDay}/day`;
    }
    return "Price on request";
});

// ============ METHODS ============

// Check if business is active and available
businessSchema.methods.isActive = function () {
    return this.status === "approved" && this.availability.isAvailable;
};

// Get budget compatibility score
businessSchema.methods.matchesBudget = function (userBudget) {
    const budgetMap = {
        budget: ["budget"],
        moderate: ["budget", "moderate"],
        luxury: ["budget", "moderate", "luxury"],
    };
    return budgetMap[userBudget]?.includes(this.priceRange) || false;
};

// ============ STATIC METHODS ============

// Find businesses near a location
businessSchema.statics.findNearLocation = function (coordinates, maxDistance = 10000, filters = {}) {
    return this.find({
        "location.geo": {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: coordinates, // [lng, lat]
                },
                $maxDistance: maxDistance, // meters
            },
        },
        status: "approved",
        "availability.isAvailable": true,
        ...filters,
    });
};

// Find by type and city
businessSchema.statics.findByTypeAndCity = function (businessType, city, filters = {}) {
    return this.find({
        businessType,
        "location.city": new RegExp(city, "i"),
        status: "approved",
        "availability.isAvailable": true,
        ...filters,
    });
};

// Validate before save
businessSchema.pre("save", function () {
    // Ensure geo coordinates are in correct order [lng, lat]
    if (this.location?.geo?.coordinates) {
        const [lng, lat] = this.location.geo.coordinates;
        if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
            throw new Error("Invalid geo coordinates");
        }
    }

    // Ensure type-specific details exist
    if (this.businessType === "hotel") {
        // Check if rooms array exists and has at least one room
        if (!this.hotelDetails?.rooms || this.hotelDetails.rooms.length === 0) {
            // Fallback: if pricePerNight exists, create default room
            if (this.pricePerNight) {
                this.hotelDetails = this.hotelDetails || {};
                this.hotelDetails.rooms = [{
                    type: "Standard Room",
                    pricePerNight: this.pricePerNight,
                    amenities: [],
                    capacity: 2,
                    available: true
                }];
            } else {
                throw new Error("Hotels must have at least one room type or pricePerNight");
            }
        }

        // Auto-calculate roomTypes array from rooms for backward compatibility
        if (this.hotelDetails.rooms && this.hotelDetails.rooms.length > 0) {
            this.hotelDetails.roomTypes = this.hotelDetails.rooms.map(r => r.type);
        }
    }

    if (this.businessType === "rental" && !this.rentalDetails?.vehicleType) {
        throw new Error("Rentals must have vehicleType");
    }
    if (this.businessType === "tour" && !this.tourDetails?.tourType) {
        throw new Error("Tours must have tourType");
    }
});

export default mongoose.model("Business", businessSchema);
