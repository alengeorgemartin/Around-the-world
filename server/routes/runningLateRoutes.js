import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { handleRunningLate, undoRunningLate } from "../controllers/runningLateController.js";

const router = express.Router();

// POST /api/running-late - Adjust itinerary for delay
router.post("/", protect(["user", "admin"]), handleRunningLate);

// POST /api/running-late/undo - Undo last adjustment
router.post("/undo", protect(["user", "admin"]), undoRunningLate);

export default router;
