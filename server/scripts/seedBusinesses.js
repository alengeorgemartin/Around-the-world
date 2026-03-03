import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Business from "../models/Business.js";
import bcrypt from "bcryptjs";

dotenv.config();

/* ======================================================
   SEED DATA - 20 BOT BUSINESS OWNERS IN MUNNAR
====================================================== */

const BOT_BUSINESSES = [
    // ========== HOTELS (8) ==========
    {
        name: "Misty Mountain Resort",
        type: "hotel",
        description: "Luxury resort with panoramic tea garden views. Premium amenities and fine dining.",
        priceRange: "luxury",
        coords: [77.0593, 10.0889], // [lng, lat]
        rooms: [
            { type: "Deluxe AC", price: 3500, amenities: ["AC", "WiFi", "TV", "Balcony"], capacity: 2 },
            { type: "Suite", price: 5500, amenities: ["AC", "WiFi", "TV", "Balcony", "Mini Bar", "Jacuzzi"], capacity: 3 },
            { type: "Presidential Suite", price: 8500, amenities: ["AC", "WiFi", "TV", "Balcony", "Mini Bar", "Jacuzzi", "Living Room"], capacity: 4 }
        ],
        amenities: ["WiFi", "Pool", "Parking", "Restaurant", "Spa", "Gym"]
    },
    {
        name: "Green Valley Homestay",
        type: "hotel",
        description: "Cozy budget-friendly homestay with homemade Kerala meals and warm hospitality.",
        priceRange: "budget",
        coords: [77.0621, 10.0912],
        rooms: [
            { type: "Standard Non-AC", price: 1200, amenities: ["WiFi", "TV"], capacity: 2 },
            { type: "Standard AC", price: 1800, amenities: ["AC", "WiFi", "TV"], capacity: 2 }
        ],
        amenities: ["WiFi", "Parking", "Home Meals"]
    },
    {
        name: "Tea Estate Retreat",
        type: "hotel",
        description: "Boutique hotel inside a working tea estate. Unique plantation experience.",
        priceRange: "moderate",
        coords: [77.0544, 10.0856],
        rooms: [
            { type: "Garden View", price: 2800, amenities: ["AC", "WiFi", "TV", "Balcony"], capacity: 2 },
            { type: "Estate Suite", price: 4200, amenities: ["AC", "WiFi", "TV", "Balcony", "Mini Bar"], capacity: 3 }
        ],
        amenities: ["WiFi", "Parking", "Restaurant", "Tea Tour"]
    },
    {
        name: "Hilltop Haven",
        type: "hotel",
        description: "Scenic hilltop location with breathtaking sunrise views. Perfect for couples.",
        priceRange: "moderate",
        coords: [77.0678, 10.0923],
        rooms: [
            { type: "Valley View AC", price: 3200, amenities: ["AC", "WiFi", "TV", "Balcony"], capacity: 2 },
            { type: "Honeymoon Suite", price: 4800, amenities: ["AC", "WiFi", "TV", "Balcony", "Mini Bar", "Fireplace"], capacity: 2 }
        ],
        amenities: ["WiFi", "Parking", "Restaurant", "Bonfire"]
    },
    {
        name: "Budget Inn Munnar",
        type: "hotel",
        description: "Clean and affordable accommodation in town center. Great for budget travelers.",
        priceRange: "budget",
        coords: [77.0611, 10.0891],
        rooms: [
            { type: "Economy Non-AC", price: 800, amenities: ["WiFi"], capacity: 2 },
            { type: "Standard AC", price: 1500, amenities: ["AC", "WiFi", "TV"], capacity: 2 }
        ],
        amenities: ["WiFi", "Parking"]
    },
    {
        name: "Spice Garden Resort",
        type: "hotel",
        description: "Surrounded by cardamom and pepper plantations. Authentic Kerala experience.",
        priceRange: "luxury",
        coords: [77.0512, 10.0878],
        rooms: [
            { type: "Garden Cottage", price: 4500, amenities: ["AC", "WiFi", "TV", "Private Porch"], capacity: 2 },
            { type: "Luxury Villa", price: 7500, amenities: ["AC", "WiFi", "TV", "Private Pool", "Kitchen"], capacity: 4 }
        ],
        amenities: ["WiFi", "Pool", "Parking", "Restaurant", "Spa", "Plantation Tour"]
    },
    {
        name: "Cloudscape Inn",
        type: "hotel",
        description: "Mid-range hotel with excellent service and mountain views. Family-friendly.",
        priceRange: "moderate",
        coords: [77.0589, 10.0867],
        rooms: [
            { type: "Standard Room", price: 2500, amenities: ["AC", "WiFi", "TV"], capacity: 2 },
            { type: "Family Room", price: 3800, amenities: ["AC", "WiFi", "TV", "Extra Bed"], capacity: 4 }
        ],
        amenities: ["WiFi", "Parking", "Restaurant", "Kids Play Area"]
    },
    {
        name: "Mountain Echo Lodge",
        type: "hotel",
        description: "Quiet lodge away from crowds. Perfect for nature lovers and birdwatchers.",
        priceRange: "budget",
        coords: [77.0456, 10.0834],
        rooms: [
            { type: "Basic Room", price: 1000, amenities: ["WiFi"], capacity: 2 },
            { type: "Deluxe AC", price: 1800, amenities: ["AC", "WiFi", "TV"], capacity: 2 }
        ],
        amenities: ["WiFi", "Parking", "Birdwatching Tours"]
    },

    // ========== VEHICLE RENTALS (7) ==========
    {
        name: "Munnar Wheels",
        type: "rental",
        description: "Premium car and bike rentals with well-maintained vehicles and optional drivers.",
        vehicleType: "Car",
        model: "Swift Dzire",
        price: 2500,
        capacity: 4,
        features: ["AC", "GPS", "Music System", "Driver Available"]
    },
    {
        name: "Budget Bike Rentals",
        type: "rental",
        description: "Affordable scooter and bike rentals. Perfect for exploring on your own.",
        vehicleType: "Scooter",
        model: "Honda Activa",
        price: 500,
        capacity: 2,
        features: ["Helmet Provided", "Free Delivery"]
    },
    {
        name: "SUV Adventures Munnar",
        type: "rental",
        description: "Rugged SUVs for off-road adventures and group travel. Experienced drivers.",
        vehicleType: "SUV",
        model: "Mahindra Scorpio",
        price: 4500,
        capacity: 7,
        features: ["AC", "GPS", "Music System", "4WD", "Driver Included"]
    },
    {
        name: "Royal Rides",
        type: "rental",
        description: "Luxury sedan rentals with chauffeur service. Premium travel experience.",
        vehicleType: "Car",
        model: "Toyota Camry",
        price: 3500,
        capacity: 4,
        features: ["AC", "GPS", "Music System", "Leather Seats", "Professional Driver"]
    },
    {
        name: "Classic Bike Tours",
        type: "rental",
        description: "Royal Enfield rentals for adventure enthusiasts. Guided tours available.",
        vehicleType: "Bike",
        model: "Royal Enfield Classic 350",
        price: 1200,
        capacity: 2,
        features: ["Helmet Provided", "GPS", "Tour Support"]
    },
    {
        name: "Family Travel Services",
        type: "rental",
        description: "Comfortable Innova and Tempo Traveller rentals for families and groups.",
        vehicleType: "SUV",
        model: "Toyota Innova",
        price: 3800,
        capacity: 7,
        features: ["AC", "Music System", "Spacious", "Driver Available"]
    },
    {
        name: "EcoDrive Munnar",
        type: "rental",
        description: "Eco-friendly electric scooter rentals. Sustainable travel option.",
        vehicleType: "Scooter",
        model: "Ather 450X",
        price: 600,
        capacity: 2,
        features: ["Electric", "App Tracking", "Free Charging"]
    },

    // ========== TOUR PACKAGES (5) ==========
    {
        name: "Tea Trails Explorer",
        type: "tour",
        description: "Full-day guided tour through tea estates with factory visit and tasting.",
        tourType: "Nature",
        duration: "Full Day",
        price: 1500,
        groupSize: "Groups only",
        includes: ["Guide", "Transport", "Tea Tasting", "Entry fees"],
        weatherSuitability: "all-weather"
    },
    {
        name: "Anamudi Peak Trek",
        type: "tour",
        description: "Adventure trek to South India's highest peak. For experienced trekkers.",
        tourType: "Adventure",
        duration: "2 days",
        price: 3500,
        groupSize: "Couples",
        includes: ["Guide", "Camping Equipment", "Meals", "Permits"],
        weatherSuitability: "outdoor"
    },
    {
        name: "Kathakali Cultural Night",
        type: "tour",
        description: "Traditional Kerala dance performance with dinner. Cultural immersion.",
        tourType: "Cultural",
        duration: "2 hours",
        price: 800,
        groupSize: "Family",
        includes: ["Performance", "Dinner", "Transport"],
        weatherSuitability: "indoor"
    },
    {
        name: "Spice Plantation Tour",
        type: "tour",
        description: "Guided walk through spice plantations. Learn about cardamom, pepper, vanilla.",
        tourType: "Nature",
        duration: "Half Day",
        price: 1200,
        groupSize: "Solo friendly",
        includes: ["Guide", "Transport", "Spice Samples"],
        weatherSuitability: "outdoor"
    },
    {
        name: "Scenic Waterfall Circuit",
        type: "tour",
        description: "Visit 5 beautiful waterfalls including Attukal and Lakkam. Photographer's delight.",
        tourType: "Nature",
        duration: "Full Day",
        price: 2000,
        groupSize: "Family",
        includes: ["Guide", "Transport", "Lunch", "Entry fees"],
        weatherSuitability: "outdoor"
    }
];

/* ======================================================
   SEED SCRIPT EXECUTION
====================================================== */

async function seedBusinesses() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "ai_trip_planner" });
        console.log("✅ MongoDB connected");

        // Clear existing bot businesses (optional)
        const deleteResult = await Business.deleteMany({
            "contact.email": /@munnarbot\.com$/
        });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing bot businesses`);

        const deleteUsers = await User.deleteMany({
            email: /@munnarbot\.com$/
        });
        console.log(`🗑️  Deleted ${deleteUsers.deletedCount} existing bot users`);

        let createdCount = 0;

        for (let i = 0; i < BOT_BUSINESSES.length; i++) {
            const botData = BOT_BUSINESSES[i];

            // Create bot user
            const hashedPassword = await bcrypt.hash("BotPass123!", 10);
            const user = await User.create({
                name: `${botData.name} Owner`,
                email: `${botData.name.toLowerCase().replace(/\s+/g, '')}@munnarbot.com`,
                password: hashedPassword,
                role: "user"
            });

            // Create business based on type
            let business;

            if (botData.type === "hotel") {
                business = await Business.create({
                    ownerId: user._id,
                    businessType: "hotel",
                    name: botData.name,
                    description: botData.description,
                    location: {
                        address: `${botData.name}, Munnar, Kerala`,
                        city: "Munnar",
                        state: "Kerala",
                        country: "India",
                        geo: {
                            type: "Point",
                            coordinates: botData.coords
                        }
                    },
                    priceRange: botData.priceRange,
                    pricePerNight: botData.rooms[0].price,
                    hotelDetails: {
                        starRating: botData.priceRange === "luxury" ? 5 : botData.priceRange === "moderate" ? 3 : 2,
                        amenities: botData.amenities,
                        rooms: botData.rooms.map(room => ({
                            type: room.type,
                            pricePerNight: room.price,
                            amenities: room.amenities,
                            capacity: room.capacity,
                            bedType: room.capacity > 2 ? "King" : "Double",
                            available: true,
                            description: `${room.type} room with ${room.amenities.join(', ')}`
                        }))
                    },
                    contact: {
                        phone: `+91 98765${43210 + i}`,
                        email: `${botData.name.toLowerCase().replace(/\s+/g, '')}@munnarbot.com`,
                        website: `https://${botData.name.toLowerCase().replace(/\s+/g, '')}.com`
                    },
                    status: "approved",
                    verifiedAt: new Date(),
                    availability: {
                        isAvailable: true,
                        seasonality: "All year",
                        advanceBookingDays: 30
                    }
                });
            }
            else if (botData.type === "rental") {
                business = await Business.create({
                    ownerId: user._id,
                    businessType: "rental",
                    name: botData.name,
                    description: botData.description,
                    location: {
                        address: `${botData.name}, Munnar, Kerala`,
                        city: "Munnar",
                        state: "Kerala",
                        country: "India",
                        geo: {
                            type: "Point",
                            coordinates: [77.0589, 10.0889] // Munnar center
                        }
                    },
                    priceRange: botData.price < 1000 ? "budget" : botData.price < 3000 ? "moderate" : "luxury",
                    pricePerDay: botData.price,
                    rentalDetails: {
                        vehicleType: botData.vehicleType,
                        model: botData.model,
                        capacity: botData.capacity,
                        features: botData.features
                    },
                    contact: {
                        phone: `+91 98765${43210 + i}`,
                        email: `${botData.name.toLowerCase().replace(/\s+/g, '')}@munnarbot.com`,
                        website: `https://${botData.name.toLowerCase().replace(/\s+/g, '')}.com`
                    },
                    status: "approved",
                    verifiedAt: new Date(),
                    availability: {
                        isAvailable: true,
                        seasonality: "All year",
                        advanceBookingDays: 7
                    }
                });
            }
            else if (botData.type === "tour") {
                business = await Business.create({
                    ownerId: user._id,
                    businessType: "tour",
                    name: botData.name,
                    description: botData.description,
                    location: {
                        address: `${botData.name}, Munnar, Kerala`,
                        city: "Munnar",
                        state: "Kerala",
                        country: "India",
                        geo: {
                            type: "Point",
                            coordinates: [77.0589, 10.0889] // Munnar center
                        }
                    },
                    priceRange: botData.price < 1000 ? "budget" : botData.price < 2500 ? "moderate" : "luxury",
                    pricePerDay: botData.price,
                    tourDetails: {
                        tourType: botData.tourType,
                        duration: botData.duration,
                        groupSize: botData.groupSize,
                        includes: botData.includes,
                        weatherSuitability: botData.weatherSuitability
                    },
                    contact: {
                        phone: `+91 98765${43210 + i}`,
                        email: `${botData.name.toLowerCase().replace(/\s+/g, '')}@munnarbot.com`,
                        website: `https://${botData.name.toLowerCase().replace(/\s+/g, '')}.com`
                    },
                    status: "approved",
                    verifiedAt: new Date(),
                    availability: {
                        isAvailable: true,
                        seasonality: "All year",
                        advanceBookingDays: 3
                    }
                });
            }

            createdCount++;
            console.log(`✅ Created: ${botData.name} (${botData.type})`);
        }

        console.log(`\n🎉 Successfully created ${createdCount} bot businesses in Munnar!`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Hotels: 8`);
        console.log(`   - Rentals: 7`);
        console.log(`   - Tours: 5`);
        console.log(`   - Total: 20`);
        console.log(`\n🔑 Login credentials:`);
        console.log(`   Email: <businessname>@munnarbot.com`);
        console.log(`   Password: BotPass123!`);
        console.log(`\nExample: mistymountainresort@munnarbot.com / BotPass123!`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

// Run the seed script
seedBusinesses();
