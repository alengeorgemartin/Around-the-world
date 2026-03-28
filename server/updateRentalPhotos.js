import dotenv from "dotenv";
import mongoose from "mongoose";
import Business from "./models/Business.js";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai_trip_planner";

// Map business names to the uploaded car images (local paths served from public/)
const PHOTO_MAP = {
    "Munnar Wheels": ["/images/car4-camaro.png"],
    "Budget Bike Rentals": ["/images/car3-concept.png"],
    "SUV Adventures Munnar": ["/images/car5-nissan.png"],
    "Royal Rides": ["/images/car1-vw.png"],
    "Classic Bike Tours": ["/images/car5-nissan.png"],
    "Family Travel Services": ["/images/car4-camaro.png"],
    "EcoDrive Munnar": ["/images/car3-concept.png"],
};

async function updatePhotos() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        for (const [name, photos] of Object.entries(PHOTO_MAP)) {
            const result = await Business.updateOne(
                { name, businessType: "rental" },
                { $set: { photos } }
            );
            if (result.modifiedCount > 0) {
                console.log(`✅ Updated photos for: ${name}`);
            } else {
                console.log(`⚠️  Not found or already updated: ${name}`);
            }
        }

        console.log("\nDone updating rental photos!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

updatePhotos();
