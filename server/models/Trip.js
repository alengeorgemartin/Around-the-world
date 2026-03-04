import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema({
  activity: String,
  description: String,
  placeUrl: String,
  startTime: String,
  duration: String,
  durationMinutes: { type: Number, default: 90 }, // For Running Late calculations
  travelFromPrevious: String,
  geo: {
    lat: Number,
    lng: Number,
  },
  // ============ BUDGET OPTIMIZER FIELDS ============
  estimatedCost: { type: Number, default: 0 },       // in ₹
  costTier: {
    type: String,
    enum: ["free", "budget", "moderate", "luxury"],
    default: "budget",
  },
  utilityScore: { type: Number, default: 0 },        // computed by optimizer
  // Running Late support
  priority: {
    type: String,
    enum: ["must", "flexible", "optional"],
    default: "flexible"
  },
  status: {
    type: String,
    enum: ["planned", "in-progress", "skipped", "completed"],
    default: "planned"
  },
  isBooked: { type: Boolean, default: false },
  closingTime: String,
});

const DaySchema = new mongoose.Schema({
  day: Number,
  morning: [ActivitySchema],
  afternoon: [ActivitySchema],
  evening: [ActivitySchema],
});

const TripSchema = new mongoose.Schema({
  location: String,
  days: Number,
  budget: String,          // Category: "Cheap" | "Moderate" | "Luxury"
  budgetAmount: Number,    // Numeric total in ₹  (e.g. 15000)
  travelWith: String,
  itinerary: [DaySchema],

  // ============ BUDGET BREAKDOWN (optimizer output) ============
  budgetBreakdown: {
    totalBudget: { type: Number, default: 0 },
    allocated: {
      stay: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
    },
    actualSpent: {
      stay: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
    },
    satisfactionScore: { type: Number, default: 0 }, // 0-1
    budgetUtilization: { type: Number, default: 0 }, // actualSpent/totalBudget
    algorithm: { type: String, default: "greedy" }, // "greedy" | "knapsack"
  },

  // ============ RESEARCH METRICS (paper comparison) ============
  researchMetrics: {
    greedySatisfaction: Number,
    knapsackSatisfaction: Number,
    greedyUtilization: Number,
    knapsackUtilization: Number,
    processingTimeMs: Number,
    // Seasonal experiment (new dimension for paper)
    satisfactionWithoutSeason: Number,   // baseline (no seasonWeight)
    satisfactionWithSeason: Number,      // with seasonWeight applied
    seasonalImprovementDelta: Number,
  },

  // ============ SEASONAL INTELLIGENCE (seasonEngine output) ============
  travelMonth: { type: Number, min: 1, max: 12 },  // 1–12
  seasonalContext: {
    season: { type: String },               // "Winter" | "Summer" | "Monsoon" | "Autumn"
    warningLevel: { type: String, enum: ["ideal", "caution", "avoid"] },
    warningMessage: { type: String },
    floodRisk: { type: Boolean, default: false },
    isPeakSeason: { type: Boolean, default: false },
    alternatives: [String],                        // suggested destinations if avoid-season
    destinationTags: [String],                        // e.g. ["beach", "hill", "trekking"]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  accommodation: {
    name: String,
    address: String,
  },
  weatherData: [{
    day: Number,
    date: String,
    condition: String,
    temperature: String,
    rainProbability: Number,
    classification: String,
    alerts: [String],
  }],
  weatherAdjustments: [{
    day: Number,
    period: String,
    originalActivity: String,
    adjustedActivity: String,
    reason: String,
  }],

  // ============ BUSINESS INTEGRATION ============
  // References to selected businesses (for data integrity)
  selectedBusinesses: {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
    },
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
    },
    tours: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    }],
  },

  // Denormalized business details (for faster display, avoids extra queries)
  businessDetails: {
    hotel: {
      name: String,
      address: String,
      pricePerNight: Number,
      starRating: Number,
      contact: {
        phone: String,
        email: String,
        website: String,
      },
    },
    rental: {
      name: String,
      vehicleType: String,
      model: String,
      pricePerDay: Number,
      contact: String,
    },
    toursPerDay: mongoose.Schema.Types.Mixed, // { "1": {...}, "2": {...} }
  },

  // ============ TRIP STATUS ============
  status: {
    type: String,
    enum: ["planning", "in-progress", "completed", "cancelled"],
    default: "planning",
    index: true,
  },
  completedAt: Date,

  // ============ REVIEW TRACKING ============
  reviewsSubmitted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review",
  }],

  createdAt: {
    type: Date,
    default: Date.now,
  },

  // ============ RUNNING LATE UNDO SUPPORT ============
  undoSnapshots: [{
    timestamp: { type: Date, default: Date.now },
    snapshot: mongoose.Schema.Types.Mixed,
    expires: Date,
  }],
});

export default mongoose.model("Trip", TripSchema);
