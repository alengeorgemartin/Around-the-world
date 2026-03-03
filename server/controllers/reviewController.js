import Review from "../models/Review.js";
import Business from "../models/Business.js";
import Trip from "../models/Trip.js";

/* ======================================================
   REVIEW CONTROLLER - Reviews & Ratings API
   
   Endpoints:
   - Create review (with trip verification)
   - Get business reviews (public)
   - Get user's reviews
   - Update/delete own review
   - Vote helpful
   - Report scam
   - Business response
   - Admin moderation
====================================================== */

// ============ USER ENDPOINTS ============

/**
 * Create a new review
 * POST /api/reviews
 * Requires: Authentication, completed trip
 */
export const createReview = async (req, res) => {
    try {
        const { businessId, tripId, rating, comment, photos } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!businessId || !tripId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: "businessId, tripId, rating, and comment are required",
            });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5",
            });
        }

        // Check if user can review (trip verification)
        const verification = await Review.canUserReview(userId, businessId, tripId);
        if (!verification.canReview) {
            return res.status(403).json({
                success: false,
                message: verification.reason,
            });
        }

        // Create review
        const review = await Review.create({
            userId,
            businessId,
            tripId,
            rating,
            comment,
            photos: photos || [],
            verified: true,
        });

        // Add review to trip's reviewsSubmitted
        await Trip.findByIdAndUpdate(tripId, {
            $push: { reviewsSubmitted: review._id },
        });

        // Populate user info
        await review.populate("userId", "name email");

        res.status(201).json({
            success: true,
            message: "Review created successfully",
            data: review,
        });
    } catch (error) {
        console.error("Error creating review:", error);

        // Handle duplicate review error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this business",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create review",
            error: error.message,
        });
    }
};

/**
 * Get all reviews for a business (public)
 * GET /api/reviews/business/:businessId
 */
export const getBusinessReviews = async (req, res) => {
    try {
        const { businessId } = req.params;
        const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;

        const reviews = await Review.getBusinessReviews(businessId, {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder: -1,
        });

        // Get total count for pagination
        const totalCount = await Review.countDocuments({
            businessId,
            status: "active",
        });

        // Get average rating stats
        const stats = await Review.getAverageRating(businessId);

        res.status(200).json({
            success: true,
            data: {
                reviews,
                stats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit),
                },
            },
        });
    } catch (error) {
        console.error("Error fetching business reviews:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch reviews",
            error: error.message,
        });
    }
};

/**
 * Get current user's reviews
 * GET /api/reviews/my-reviews
 */
export const getUserReviews = async (req, res) => {
    try {
        const userId = req.user._id;

        const reviews = await Review.find({
            userId,
            status: { $ne: "deleted" },
        })
            .populate("businessId", "name businessType location")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        console.error("Error fetching user reviews:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch your reviews",
            error: error.message,
        });
    }
};

/**
 * Update own review
 * PATCH /api/reviews/:id
 */
export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, photos } = req.body;
        const userId = req.user._id;

        const review = await Review.findOne({ _id: id, userId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission to edit it",
            });
        }

        // Update fields
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be between 1 and 5",
                });
            }
            review.rating = rating;
        }
        if (comment !== undefined) review.comment = comment;
        if (photos !== undefined) review.photos = photos;

        await review.save();

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: review,
        });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update review",
            error: error.message,
        });
    }
};

/**
 * Delete own review (soft delete)
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const review = await Review.findOneAndUpdate(
            { _id: id, userId },
            { status: "deleted" },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission to delete it",
            });
        }

        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete review",
            error: error.message,
        });
    }
};

/**
 * Vote review as helpful
 * POST /api/reviews/:id/helpful
 */
export const voteHelpful = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        if (review.hasVoted(userId)) {
            return res.status(400).json({
                success: false,
                message: "You have already voted on this review",
            });
        }

        await review.addHelpfulVote(userId);

        res.status(200).json({
            success: true,
            message: "Vote recorded",
            data: { helpfulVotes: review.helpfulVotes },
        });
    } catch (error) {
        console.error("Error voting helpful:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to record vote",
        });
    }
};

/**
 * Report review as scam
 * POST /api/reviews/:id/report
 */
export const reportScam = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user._id;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Reason is required for reporting",
            });
        }

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        await review.reportAsScam(userId, reason);

        res.status(200).json({
            success: true,
            message: "Review reported successfully",
            data: {
                isScamReport: review.isScamReport,
                reportCount: review.reportedBy.length,
            },
        });
    } catch (error) {
        console.error("Error reporting review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to report review",
            error: error.message,
        });
    }
};

// ============ BUSINESS OWNER ENDPOINTS ============

/**
 * Business owner responds to review
 * POST /api/reviews/:id/respond
 */
export const respondToReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;
        const userId = req.user._id;

        if (!response || response.length > 300) {
            return res.status(400).json({
                success: false,
                message: "Response is required and must be 300 characters or less",
            });
        }

        const review = await Review.findById(id).populate("businessId");

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        // Check if user owns the business
        if (!review.businessId.ownerId.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: "You don't own this business",
            });
        }

        await review.addBusinessResponse(response, userId);

        res.status(200).json({
            success: true,
            message: "Response added successfully",
            data: review,
        });
    } catch (error) {
        console.error("Error responding to review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add response",
            error: error.message,
        });
    }
};

// ============ ADMIN ENDPOINTS ============

/**
 * Get reported reviews (admin only)
 * GET /api/reviews/admin/reported
 */
export const getReportedReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            isScamReport: true,
            adminReviewed: false,
        })
            .populate("userId", "name email")
            .populate("businessId", "name businessType")
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        console.error("Error fetching reported reviews:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch reported reviews",
            error: error.message,
        });
    }
};

/**
 * Moderate review (admin only)
 * PATCH /api/reviews/:id/moderate
 */
export const moderateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, adminNotes } = req.body;

        // action: 'approve', 'hide', 'delete'
        if (!["approve", "hide", "delete"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid action. Must be: approve, hide, or delete",
            });
        }

        const statusMap = {
            approve: "active",
            hide: "hidden",
            delete: "deleted",
        };

        const review = await Review.findByIdAndUpdate(
            id,
            {
                status: statusMap[action],
                adminReviewed: true,
                scamReportReason: adminNotes || review.scamReportReason,
            },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        res.status(200).json({
            success: true,
            message: `Review ${action}d successfully`,
            data: review,
        });
    } catch (error) {
        console.error("Error moderating review:", error);
        res.status(500).json({
            success: false,
            message: "Failed to moderate review",
            error: error.message,
        });
    }
};

/**
 * Get review stats (admin only)
 * GET /api/reviews/admin/stats
 */
export const getReviewStats = async (req, res) => {
    try {
        const totalReviews = await Review.countDocuments();
        const activeReviews = await Review.countDocuments({ status: "active" });
        const reportedReviews = await Review.countDocuments({ isScamReport: true });
        const pendingModeration = await Review.countDocuments({
            isScamReport: true,
            adminReviewed: false,
        });

        // Average rating across all businesses
        const avgResult = await Review.aggregate([
            { $match: { status: "active" } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalReviews,
                activeReviews,
                reportedReviews,
                pendingModeration,
                platformAverageRating: avgResult[0]?.averageRating || 0,
            },
        });
    } catch (error) {
        console.error("Error fetching review stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch stats",
            error: error.message,
        });
    }
};
