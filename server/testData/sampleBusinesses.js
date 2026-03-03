/* ======================================================
   BUSINESS API TEST SCRIPT
   
   Creates sample businesses for testing:
   - Hotels in Goa, Mumbai, Delhi
   - Vehicle rentals
   - Tour packages
====================================================== */

const sampleBusinesses = [
    // ============ HOTELS ============
    {
        businessType: "hotel",
        name: "Seaside Paradise Resort",
        description: "Luxury beachfront resort with ocean views, infinity pool, and spa. Perfect for couples and families seeking a premium beach experience.",
        location: {
            address: "Calangute Beach Road, Calangute",
            city: "Goa",
            state: "Goa",
            country: "India",
            geo: {
                lat: 15.5440,
                lng: 73.7548,
            },
        },
        priceRange: "luxury",
        pricePerNight: 8500,
        hotelDetails: {
            starRating: 5,
            amenities: ["WiFi", "Pool", "Spa", "Beach Access", "Restaurant", "Bar"],
            roomTypes: ["Deluxe Sea View", "Premium Suite", "Royal Villa"],
        },
        availability: {
            isAvailable: true,
            seasonality: "All year",
            advanceBookingDays: 90,
        },
        contact: {
            phone: "+91-832-2276800",
            email: "info@seasideparadise.com",
            website: "https://seasideparadise.com",
        },
        photos: [
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
        ],
    },
    {
        businessType: "hotel",
        name: "Budget Inn Goa",
        description: "Clean and comfortable budget hotel near Baga Beach. Ideal for backpackers and solo travelers. Basic amenities with friendly service.",
        location: {
            address: "Baga-Calangute Road, Baga",
            city: "Goa",
            state: "Goa",
            geo: {
                lat: 15.5557,
                lng: 73.7519,
            },
        },
        priceRange: "budget",
        pricePerNight: 1200,
        hotelDetails: {
            starRating: 2,
            amenities: ["WiFi", "AC", "Parking"],
            roomTypes: ["Standard Single", "Standard Double"],
        },
        availability: {
            isAvailable: true,
            seasonality: "All year",
        },
        contact: {
            phone: "+91-832-2275500",
            email: "budgetinn@gmail.com",
        },
    },
    {
        businessType: "hotel",
        name: "Gateway Residency Mumbai",
        description: "Modern hotel in South Mumbai with excellent connectivity. Walking distance to Gateway of India and Colaba Causeway.",
        location: {
            address: "Shahid Bhagat Singh Road, Colaba",
            city: "Mumbai",
            state: "Maharashtra",
            geo: {
                lat: 18.9220,
                lng: 72.8347,
            },
        },
        priceRange: "moderate",
        pricePerNight: 4500,
        hotelDetails: {
            starRating: 3,
            amenities: ["WiFi", "Restaurant", "Room Service", "Laundry"],
            roomTypes: ["Standard", "Deluxe", "Executive"],
        },
        availability: {
            isAvailable: true,
        },
        contact: {
            phone: "+91-22-22830000",
            email: "gateway@mumbaihotels.com",
        },
    },

    // ============ VEHICLE RENTALS ============
    {
        businessType: "rental",
        name: "Goa Wheels",
        description: "Premier vehicle rental service in Goa. Wide range of bikes, scooters, and cars with 24/7 roadside assistance.",
        location: {
            address: "Dabolim Airport Road, Vasco da Gama",
            city: "Goa",
            state: "Goa",
            geo: {
                lat: 15.3808,
                lng: 73.8314,
            },
        },
        priceRange: "moderate",
        pricePerDay: 800,
        rentalDetails: {
            vehicleType: "Scooter",
            model: "Honda Activa",
            capacity: 2,
            features: ["Helmet", "Insurance", "Roadside Assistance"],
        },
        availability: {
            isAvailable: true,
            seasonality: "All year",
        },
        contact: {
            phone: "+91-832-2540100",
            email: "rentals@goawheels.com",
            website: "https://goawheels.com",
        },
    },
    {
        businessType: "rental",
        name: "Mumbai Car Rentals",
        description: "Reliable car rental service with driver options. Perfect for family trips and corporate travel.",
        location: {
            address: "Andheri East, Near Airport",
            city: "Mumbai",
            state: "Maharashtra",
            geo: {
                lat: 19.0990,
                lng: 72.8681,
            },
        },
        priceRange: "moderate",
        pricePerDay: 2500,
        rentalDetails: {
            vehicleType: "SUV",
            model: "Toyota Innova",
            capacity: 7,
            features: ["AC", "Driver", "GPS", "Music System"],
        },
        availability: {
            isAvailable: true,
        },
        contact: {
            phone: "+91-22-26834567",
            email: "bookings@mumbaicarrentals.com",
        },
    },

    // ============ TOUR PACKAGES ============
    {
        businessType: "tour",
        name: "Goa Heritage Walk",
        description: "Explore Old Goa's Portuguese heritage with expert guides. Visit churches, museums, and historic sites. Includes lunch at local restaurant.",
        location: {
            address: "Old Goa Heritage Complex",
            city: "Goa",
            state: "Goa",
            geo: {
                lat: 15.5008,
                lng: 73.9114,
            },
        },
        priceRange: "budget",
        pricePerDay: 1500,
        tourDetails: {
            tourType: "Cultural",
            duration: "Half Day",
            groupSize: "Solo friendly",
            includes: ["Guide", "Entry fees", "Lunch"],
            weatherSuitability: "all-weather",
        },
        availability: {
            isAvailable: true,
            seasonality: "All year",
        },
        contact: {
            phone: "+91-832-2285900",
            email: "tours@goaheritage.com",
        },
    },
    {
        businessType: "tour",
        name: "Goa Water Sports Adventure",
        description: "Thrilling water sports package including parasailing, jet ski, and banana boat rides. Safety equipment provided.",
        location: {
            address: "Baga Beach Water Sports Center",
            city: "Goa",
            state: "Goa",
            geo: {
                lat: 15.5557,
                lng: 73.7515,
            },
        },
        priceRange: "moderate",
        pricePerDay: 3500,
        tourDetails: {
            tourType: "Adventure",
            duration: "2 hours",
            groupSize: "Groups only",
            includes: ["Safety equipment", "Instructor", "Photos"],
            weatherSuitability: "outdoor",
        },
        availability: {
            isAvailable: true,
            seasonality: "October to May",
        },
        contact: {
            phone: "+91-832-2279800",
            email: "adventure@goawatersports.com",
        },
    },
    {
        businessType: "tour",
        name: "Spice Plantation Tour",
        description: "Guided tour of organic spice plantations. Learn about Indian spices, enjoy traditional Goan lunch, and shop for fresh spices.",
        location: {
            address: "Ponda Taluka, Plantation Belt",
            city: "Goa",
            state: "Goa",
            geo: {
                lat: 15.4009,
                lng: 74.0183,
            },
        },
        priceRange: "moderate",
        pricePerDay: 2000,
        tourDetails: {
            tourType: "Nature",
            duration: "Full Day",
            groupSize: "Family",
            includes: ["Guide", "Lunch", "Transport", "Spice samples"],
            weatherSuitability: "all-weather",
        },
        availability: {
            isAvailable: true,
            seasonality: "All year",
        },
        contact: {
            phone: "+91-832-2312400",
            email: "info@goaspicetours.com",
        },
    },
    {
        businessType: "tour",
        name: "Mumbai Food Trail",
        description: "Culinary walking tour through Mumbai's street food scene. Taste iconic foods like vada pav, pav bhaji, and filter coffee.",
        location: {
            address: "Starting Point: Chhatrapati Shivaji Terminus",
            city: "Mumbai",
            state: "Maharashtra",
            geo: {
                lat: 18.9398,
                lng: 72.8348,
            },
        },
        priceRange: "budget",
        pricePerDay: 1200,
        tourDetails: {
            tourType: "Food",
            duration: "3 hours",
            groupSize: "Solo friendly",
            includes: ["Guide", "Food tastings", "Bottled water"],
            weatherSuitability: "all-weather",
        },
        availability: {
            isAvailable: true,
        },
        contact: {
            phone: "+91-22-22620500",
            email: "foodtours@mumbaieats.com",
        },
    },
];

// Instructions for manual testing:
console.log("Sample Business Data Created");
console.log("Total businesses:", sampleBusinesses.length);
console.log("\n=== TO TEST THE API ===");
console.log("\n1. Start the server: npm start");
console.log("\n2. Login/Register a user to get auth token");
console.log("\n3. Use these sample businesses to test:");
console.log("   - POST /api/business/register (send one business at a time)");
console.log("   - GET /api/business/my-businesses");
console.log("   - GET /api/business/type/hotel?city=Goa");
console.log("\n4. As admin, approve businesses:");
console.log("   - PATCH /api/business/:id/status");
console.log("   - Body: { status: 'approved' }");
console.log("\n5. Test trip generation:");
console.log("   - POST /api/travel");
console.log("   - Location: Goa, Budget: moderate");
console.log("   - Should see businesses in trip.businessDetails");

export default sampleBusinesses;
