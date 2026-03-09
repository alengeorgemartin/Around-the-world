import express from "express";
import {
    createBooking,
    getMyBookings,
    getBusinessBookings,
    getBusinessOwnerBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    processMockPayment
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ======================================================
   BOOKING ROUTES
====================================================== */

// User routes
router.post("/create", protect(["user", "admin"]), createBooking);
router.get("/my-bookings", protect(["user", "admin"]), getMyBookings);
router.get("/:id", protect(["user", "admin"]), getBookingById);
router.delete("/:id", protect(["user", "admin"]), cancelBooking);

// Business owner routes
router.get("/business/my-bookings", protect(["user", "admin"]), getBusinessOwnerBookings);
router.get("/business/:businessId", protect(["user", "admin"]), getBusinessBookings);
router.patch("/:id/status", protect(["user", "admin"]), updateBookingStatus);
router.patch("/:id/pay", protect(["user", "admin"]), processMockPayment);

export default router;
