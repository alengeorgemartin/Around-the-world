import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    refreshToken: {
  type: String,
},
profilePhoto: {
  type: String,
  default: ""
},
  preferences: {
  travelStyle: {
    type: [String],
    default: [],
  },
  interests: {
    type: [String],
    default: [],
  },
  budget: {
    type: String,
    default: "",
  },
  pace: {
    type: String,
    default: "",
  },
},

  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
