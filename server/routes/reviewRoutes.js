import express from "express";
import {
    createReview,
    getBusinessReviews,
    getUserReviews,
    updateReview,
    deleteReview,
    voteHelpful,
    reportScam,
    respondToReview,
    getReportedReviews,
    moderateReview,
    getReviewStats,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Get reviews for a business (public access)
router.get("/business/:businessId", getBusinessReviews);

// ============ USER ROUTES (AUTHENTICATED) ============
// Create a new review
router.post("/", protect(["user", "admin"]), createReview);

// Get current user's reviews
router.get("/my-reviews", protect(["user", "admin"]), getUserReviews);

// Update own review
router.patch("/:id", protect(["user", "admin"]), updateReview);

// Delete own review
router.delete("/:id", protect(["user", "admin"]), deleteReview);

// Vote review as helpful
router.post("/:id/helpful", protect(["user", "admin"]), voteHelpful);

// Report review as scam
router.post("/:id/report", protect(["user", "admin"]), reportScam);

// ============ BUSINESS OWNER ROUTES ============
// Respond to a review
router.post("/:id/respond", protect(["user", "admin"]), respondToReview);

// ============ ADMIN ROUTES ============
// Get reported reviews
router.get("/admin/reported", protect(["admin"]), getReportedReviews);

// Get review statistics
router.get("/admin/stats", protect(["admin"]), getReviewStats);

// Moderate review (hide/approve/delete)
router.patch("/:id/moderate", protect(["admin"]), moderateReview);

export default router;
