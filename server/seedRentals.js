import dotenv from "dotenv";
import mongoose from "mongoose";
import Business from "./models/Business.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-travel-planner";

// We need a dummy ObjectId for the ownerId since it's required
const DUMMY_OWNER_ID = new mongoose.Types.ObjectId();

const induzCars = [
    {
        ownerId: DUMMY_OWNER_ID,
        businessType: "rental",
        name: "Toyota Corolla",
        description: "Reliable and efficient compact sedan perfect for city driving and small families.",
        priceRange: "moderate",
        pricePerDay: 2000,
        location: {
            address: "Induz Cars Hub",
            city: "Munnar",
            state: "Kerala",
            geo: {
                type: "Point",
                coordinates: [77.0595, 10.0889] // longitude, latitude order
            }
        },
        rentalDetails: {
            vehicleType: "Compact Sedan",
            model: "Corolla",
            capacity: 5,
            features: ["AC", "Bluetooth", "Automatic"]
        },
        photos: ["/images/car1-vw.png"],
        contact: {
            phone: "+91 9876543210",
            email: "bookings@induzcars.com",
            website: "www.induzcars.com"
        },
        status: "approved",
        stats: {
            averageRating: 4.8,
            reviewCount: 124
        }
    },
    {
        ownerId: DUMMY_OWNER_ID,
        businessType: "rental",
        name: "Honda Civic",
        description: "Sporty and comfortable sedan with excellent fuel economy.",
        priceRange: "moderate",
        pricePerDay: 2500,
        location: {
            address: "Induz Cars Hub",
            city: "Munnar",
            state: "Kerala",
            geo: {
                type: "Point",
                coordinates: [77.0595, 10.0889]
            }
        },
        rentalDetails: {
            vehicleType: "Compact Sedan",
            model: "Civic",
            capacity: 5,
            features: ["AC", "Sunroof", "Touchscreen", "Automatic"]
        },
        photos: ["/images/car2-logo.png"],
        contact: {
            phone: "+91 9876543210",
            email: "bookings@induzcars.com"
        },
        status: "approved",
        stats: {
            averageRating: 4.9,
            reviewCount: 205
        }
    },
    {
        ownerId: DUMMY_OWNER_ID,
        businessType: "rental",
        name: "Chevrolet Cruze",
        description: "Stylish performance sedan offering a premium drive experience.",
        priceRange: "luxury",
        pricePerDay: 2800,
        location: {
            address: "Induz Cars Hub",
            city: "Munnar",
            state: "Kerala",
            geo: {
                type: "Point",
                coordinates: [77.0595, 10.0889]
            }
        },
        rentalDetails: {
            vehicleType: "Compact Sedan",
            model: "Cruze",
            capacity: 4,
            features: ["AC", "Leather Seats", "Alloy Wheels", "Automatic"]
        },
        photos: ["/images/car3-concept.png"],
        contact: {
            phone: "+91 9876543210",
            email: "bookings@induzcars.com"
        },
        status: "approved",
        stats: {
            averageRating: 4.6,
            reviewCount: 89
        }
    },
    {
        ownerId: DUMMY_OWNER_ID,
        businessType: "rental",
        name: "Toyota Highlander",
        description: "Spacious premium SUV perfect for family trips and difficult terrains.",
        priceRange: "luxury",
        pricePerDay: 4000,
        location: {
            address: "Induz Cars Hub",
            city: "Munnar",
            state: "Kerala",
            geo: {
                type: "Point",
                coordinates: [77.0595, 10.0889]
            }
        },
        rentalDetails: {
            vehicleType: "SUV",
            model: "Highlander",
            capacity: 7,
            features: ["AC", "4WD", "Panoramic Roof", "Automatic"]
        },
        photos: ["/images/car4-camaro.png"],
        contact: {
            phone: "+91 9876543210",
            email: "bookings@induzcars.com"
        },
        status: "approved",
        stats: {
            averageRating: 4.7,
            reviewCount: 156
        }
    },
    {
        ownerId: DUMMY_OWNER_ID,
        businessType: "rental",
        name: "Ford Mustang",
        description: "Iconic convertible sports car for an unforgettable journey.",
        priceRange: "luxury",
        pricePerDay: 6000,
        location: {
            address: "Induz Cars Hub",
            city: "Munnar",
            state: "Kerala",
            geo: {
                type: "Point",
                coordinates: [77.0595, 10.0889]
            }
        },
        rentalDetails: {
            vehicleType: "Convertible",
            model: "Mustang",
            capacity: 4,
            features: ["AC", "Convertible Top", "Premium Audio", "Automatic"]
        },
        photos: ["/images/car5-nissan.png"],
        contact: {
            phone: "+91 9876543210",
            email: "bookings@induzcars.com"
        },
        status: "approved",
        stats: {
            averageRating: 5.0,
            reviewCount: 42
        }
    },
    {
        ownerId: DUMMY_OWNER_ID,
        businessType: "rental",
        name: "Hyundai i20",
        description: "Premium hatchback with advanced features and great city mileage.",
        priceRange: "budget",
        pricePerDay: 1500,
        location: {
            address: "Induz Cars Hub",
            city: "Munnar",
            state: "Kerala",
            geo: {
                type: "Point",
                coordinates: [77.0595, 10.0889]
            }
        },
        rentalDetails: {
            vehicleType: "Hatchback",
            model: "i20",
            capacity: 5,
            features: ["AC", "Touchscreen", "Manual"]
        },
        photos: ["/images/car4-camaro.png"],
        contact: {
            phone: "+91 9876543210",
            email: "bookings@induzcars.com"
        },
        status: "approved",
        stats: {
            averageRating: 4.5,
            reviewCount: 310
        }
    }
];

async function seedData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Optional: Remove existing rental cars in Munnar to avoid duplicates
        await Business.deleteMany({ businessType: "rental", "location.city": "Munnar" });
        console.log("Cleared old rental data in Munnar");

        // Insert new data
        await Business.insertMany(induzCars);
        console.log("Successfully seeded Induz Cars data!");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
}

seedData();
