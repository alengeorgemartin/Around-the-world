import mongoose from "mongoose";

const TravelPlanSchema = new mongoose.Schema(
  {
    location: String,
    days: Number,
    budget: String,
    travelWith: String,
    resultJson: Object,   // <-- store whole AI JSON result here
  },
  { timestamps: true }
);

export default mongoose.model("TravelPlan", TravelPlanSchema);
