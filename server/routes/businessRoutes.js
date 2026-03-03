import express from "express";
import {
    registerBusiness,
    getMyBusinesses,
    updateBusiness,
    deleteBusiness,
    listBusinessesByType,
    updateBusinessStatus,
    getAllBusinessesForAdmin,
} from "../controllers/businessController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ======================================================
   BUSINESS ROUTES
====================================================== */

// Public routes
router.get("/type/:type", listBusinessesByType);

// Protected routes (user)
router.post("/register", protect(["user", "admin"]), registerBusiness);
router.get("/my-businesses", protect(["user", "admin"]), getMyBusinesses);
router.put("/:id", protect(["user", "admin"]), updateBusiness);
router.delete("/:id", protect(["user", "admin"]), deleteBusiness);

// Admin routes
router.get("/admin/all", protect(["admin"]), getAllBusinessesForAdmin);
router.patch("/:id/status", protect(["admin"]), updateBusinessStatus);

export default router;
