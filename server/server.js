import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { generateTravelPlan } from "./aiController.js";
import Trip from "./models/Trip.js";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import runningLateRoutes from "./routes/runningLateRoutes.js";
import { protect } from "./middleware/authMiddleware.js";
import cookieParser from "cookie-parser";
import User from "./models/User.js";
import {
  replaceActivity,
  activitySuggestions,
} from "./aiController.js";
import { additionalSuggestions } from "./aiController.js";
import { appendActivity } from "./aiController.js";
import { deleteActivity } from "./aiController.js";
import { smartAdjustment } from "./aiController.js";
import { undoLastChange, reorderActivity } from "./aiController.js";
import { generateTripPDF } from "./services/pdfGenerator.js";


dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(bodyParser.json());

app.use(cookieParser());

// ====== MONGODB CONNECTION ======
mongoose.connect(process.env.MONGO_URI, { dbName: "ai_trip_planner" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));


app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost port (handles Vite switching from 5173 to 5174, etc.)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ====== ROUTES ======
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/running-late", runningLateRoutes);

// Generate and save trip
app.post(
  "/api/travel",
  protect(["user", "admin"]),
  generateTravelPlan
);


// Get trip by ID
app.get(
  "/api/my-trips",
  protect(["user", "admin"]),
  async (req, res) => {
    try {
      const trips = await Trip.find({ userId: req.user.id });
      res.json({ success: true, data: trips });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

app.get("/api/trip/:id", protect(["user", "admin"]),
  async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Trip ID is required" });

    try {
      const trip = await Trip.findById(id);
      if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });

      res.json({ success: true, data: trip });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

// Get all businesses for a city
app.route("/api/businesses/:city")
  .get(async (req, res) => {
    try {
      const { city } = req.params;
      const Business = (await import("./models/Business.js")).default;

      // Fetch all approved businesses for the city
      const businesses = await Business.find({
        "location.city": new RegExp(city, "i"),
        status: "approved",
        "availability.isAvailable": true
      });

      // Group by business type
      const hotels = businesses.filter(b => b.businessType === "hotel");
      const rentals = businesses.filter(b => b.businessType === "rental");
      const tours = businesses.filter(b => b.businessType === "tour");

      res.json({
        success: true,
        data: {
          hotels,
          rentals,
          tours,
          total: businesses.length
        }
      });
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
app.post(
  "/api/trip/:id/replace-activity",
  protect(["user", "admin"]),
  replaceActivity
);

app.post(
  "/api/trip/:id/activity-suggestions",
  protect(["user", "admin"]),
  activitySuggestions
);
app.post(
  "/api/trip/:id/additional-suggestions",
  protect(["user", "admin"]),
  additionalSuggestions
);
app.post(
  "/api/trip/:id/append-activity",
  protect(["user", "admin"]),
  appendActivity
);
app.post(
  "/api/trip/:id/delete-activity",
  protect(["user", "admin"]),
  deleteActivity
);
app.post(
  "/api/trip/:id/undo",
  protect(["user", "admin"]),
  undoLastChange
);
app.post(
  "/api/trip/:id/reorder-activity",
  protect(["user", "admin"]),
  reorderActivity
);
app.post(
  "/api/trip/:id/smart-adjustment",
  protect(["user", "admin"]),
  smartAdjustment
);

// ────── PDF DOWNLOAD ──────
// GET /api/trip/:id/pdf  → streams a PDF of the full trip plan
app.get(
  "/api/trip/:id/pdf",
  protect(["user", "admin"]),
  async (req, res) => {
    try {
      const trip = await Trip.findById(req.params.id).lean();
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      // Security: only trip owner or admin
      if (req.user.role !== "admin" && trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }

      const safeFilename = (trip.location || "Trip")
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeFilename}-Travel-Plan.pdf"`
      );

      await generateTripPDF(trip, res);
    } catch (err) {
      console.error("❌ PDF generation failed:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "PDF generation failed" });
      }
    }
  }
);


app.get("/api/admin/data", protect(["admin"]), (req, res) => {
  res.json({ message: "Admin access granted" });
});

// ✅ GET LOGGED-IN USER PROFILE
app.get("/api/profile", protect(["user", "admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Profile fetch failed" });
  }
});

app.put(
  "/api/profile/preferences",
  protect(["user", "admin"]),
  async (req, res) => {
    try {
      console.log("PREFERENCES BODY:", req.body); // 👈 ADD THIS

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { preferences: req.body },
        { new: true }
      ).select("-password");

      res.json({ success: true, preferences: user.preferences });
    } catch (error) {
      console.error("SAVE PREF ERROR:", error);
      res.status(500).json({ message: "Failed to save preferences" });
    }
  }
);



// List all trips
app.get(
  "/api/trips",
  protect(["admin"]),
  async (req, res) => {
    try {
      const trips = await Trip.find();
      res.json({ success: true, data: trips });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
app.delete(
  "/api/trip/:id",
  protect(["user", "admin"]),  // Allow both users and admins
  async (req, res) => {
    const { id } = req.params;

    try {
      const trip = await Trip.findById(id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Check if user owns this trip (unless they're an admin)
      if (req.user.role !== "admin" && trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this trip" });
      }

      await Trip.findByIdAndDelete(id);
      res.json({ success: true, message: "Trip deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("API running");
});

