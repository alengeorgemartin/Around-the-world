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
  budget: String,
  travelWith: String,
  itinerary: [DaySchema],
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
