import mongoose from "mongoose";

/* ======================================================
   REVIEW MODEL - Business Reviews & Ratings System
   
   Features:
   - Booking verification (only users with completed trips can review)
   - Star ratings (1-5)
   - Text comments with photos
   - Scam reporting mechanism
   - Admin moderation
   - Business owner responses
====================================================== */

const reviewSchema = new mongoose.Schema(
    {
        // ============ CORE IDENTIFIERS ============
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true,
            index: true,
        },
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true,
            index: true,
        },

        // ============ REVIEW CONTENT ============
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            maxlength: 500,
            trim: true,
        },
        photos: [String], // URLs to review photos

        // ============ VERIFICATION ============
        verified: {
            type: Boolean,
            default: true, // Auto-true if from completed trip
        },

        // ============ ENGAGEMENT ============
        helpfulVotes: {
            type: Number,
            default: 0,
        },
        votedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }], // Track who voted to prevent duplicates

        // ============ MODERATION ============
        isScamReport: {
            type: Boolean,
            default: false,
        },
        scamReportReason: String,
        reportedBy: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            reason: String,
            reportedAt: Date,
        }],
        adminReviewed: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["active", "hidden", "deleted"],
            default: "active",
            index: true,
        },

        // ============ BUSINESS RESPONSE ============
        businessResponse: {
            type: String,
            maxlength: 300,
        },
        businessResponseAt: Date,
        businessRespondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// ============ INDEXES ============

// Get reviews for a business (public view)
reviewSchema.index({ businessId: 1, status: 1, createdAt: -1 });

// Get user's reviews
reviewSchema.index({ userId: 1, status: 1 });

// Prevent duplicate reviews (one review per user per business)
reviewSchema.index({ userId: 1, businessId: 1 }, { unique: true });

// Admin moderation queries
reviewSchema.index({ isScamReport: 1, adminReviewed: 1 });

// Verification lookup
reviewSchema.index({ userId: 1, tripId: 1, businessId: 1 });

// ============ METHODS ============

// Check if user has voted on this review
reviewSchema.methods.hasVoted = function (userId) {
    return this.votedBy.some(id => id.equals(userId));
};

// Add helpful vote
reviewSchema.methods.addHelpfulVote = async function (userId) {
    if (this.hasVoted(userId)) {
        throw new Error("User has already voted on this review");
    }
    this.votedBy.push(userId);
    this.helpfulVotes += 1;
    return await this.save();
};

// Mark as scam report
reviewSchema.methods.reportAsScam = async function (userId, reason) {
    this.reportedBy.push({
        userId,
        reason,
        reportedAt: new Date(),
    });

    // Auto-flag if multiple reports
    if (this.reportedBy.length >= 3) {
        this.isScamReport = true;
    }

    return await this.save();
};

// Business owner responds
reviewSchema.methods.addBusinessResponse = async function (response, userId) {
    this.businessResponse = response;
    this.businessResponseAt = new Date();
    this.businessRespondedBy = userId;
    return await this.save();
};

// ============ STATIC METHODS ============

// Get average rating for a business
reviewSchema.statics.getAverageRating = async function (businessId) {
    const result = await this.aggregate([
        { $match: { businessId: new mongoose.Types.ObjectId(businessId), status: "active" } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                count: { $sum: 1 },
                ratings: { $push: "$rating" },
            },
        },
    ]);

    if (result.length === 0) {
        return { averageRating: 0, count: 0, distribution: {} };
    }

    // Calculate rating distribution
    const ratings = result[0].ratings;
    const distribution = {
        5: ratings.filter(r => r === 5).length,
        4: ratings.filter(r => r === 4).length,
        3: ratings.filter(r => r === 3).length,
        2: ratings.filter(r => r === 2).length,
        1: ratings.filter(r => r === 1).length,
    };

    return {
        averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
        count: result[0].count,
        distribution,
    };
};

// Get reviews for a business with pagination
reviewSchema.statics.getBusinessReviews = function (businessId, options = {}) {
    const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = -1,
    } = options;

    return this.find({
        businessId,
        status: "active",
    })
        .populate("userId", "name email")
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
};

// Check if user can review this business
reviewSchema.statics.canUserReview = async function (userId, businessId, tripId) {
    // Check if user has already reviewed
    const existingReview = await this.findOne({ userId, businessId });
    if (existingReview) {
        return { canReview: false, reason: "User has already reviewed this business" };
    }

    // Check if trip exists and is completed
    const Trip = mongoose.model("Trip");
    const trip = await Trip.findOne({
        _id: tripId,
        userId,
        status: "completed",
    });

    if (!trip) {
        return { canReview: false, reason: "Trip not found or not completed" };
    }

    // Check if business was part of the trip
    const businessInTrip =
        trip.selectedBusinesses?.accommodation?._id?.equals(businessId) ||
        trip.selectedBusinesses?.rental?._id?.equals(businessId) ||
        Object.values(trip.selectedBusinesses?.toursPerDay || {}).some(
            tour => tour._id?.equals(businessId)
        );

    if (!businessInTrip) {
        return { canReview: false, reason: "Business was not part of this trip" };
    }

    return { canReview: true };
};

// ============ PRE-SAVE HOOKS ============

// Update business stats when review is created/updated
reviewSchema.post("save", async function () {
    if (this.status === "active") {
        const Business = mongoose.model("Business");
        const stats = await this.constructor.getAverageRating(this.businessId);

        await Business.findByIdAndUpdate(this.businessId, {
            "stats.averageRating": stats.averageRating,
            "stats.reviewCount": stats.count,
            "stats.ratingDistribution": stats.distribution,
        });
    }
});

// Update business stats when review is deleted
reviewSchema.post("findOneAndUpdate", async function (doc) {
    if (doc && doc.status !== "active") {
        const Business = mongoose.model("Business");
        const Review = mongoose.model("Review");
        const stats = await Review.getAverageRating(doc.businessId);

        await Business.findByIdAndUpdate(doc.businessId, {
            "stats.averageRating": stats.averageRating,
            "stats.reviewCount": stats.count,
            "stats.ratingDistribution": stats.distribution,
        });
    }
});

export default mongoose.model("Review", reviewSchema);
