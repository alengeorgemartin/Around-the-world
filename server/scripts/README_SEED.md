# Business Seed Script - Bot Users

## 📋 Overview
This script creates **20 bot business owners** in Munnar with realistic:
- **8 Hotels** (budget, moderate, luxury)
- **7 Vehicle Rentals** (cars, bikes, scooters, SUVs)
- **5 Tour Packages** (nature, adventure, cultural)

## 🚀 Usage

### Run the seed script:
```bash
cd server
node scripts/seedBusinesses.js
```

## ✅ What Gets Created

### Hotels (8)
1. **Misty Mountain Resort** - Luxury (₹3,500-8,500/night)
2. **Green Valley Homestay** - Budget (₹1,200-1,800/night)
3. **Tea Estate Retreat** - Moderate (₹2,800-4,200/night)
4. **Hilltop Haven** - Moderate (₹3,200-4,800/night)
5. **Budget Inn Munnar** - Budget (₹800-1,500/night)
6. **Spice Garden Resort** - Luxury (₹4,500-7,500/night)
7. **Cloudscape Inn** - Moderate (₹2,500-3,800/night)
8. **Mountain Echo Lodge** - Budget (₹1,000-1,800/night)

### Rentals (7)
1. **Munnar Wheels** - Car (Swift Dzire, ₹2,500/day)
2. **Budget Bike Rentals** - Scooter (Honda Activa, ₹500/day)
3. **SUV Adventures Munnar** - SUV (Scorpio, ₹4,500/day)
4. **Royal Rides** - Luxury Car (Camry, ₹3,500/day)
5. **Classic Bike Tours** - Bike (Royal Enfield, ₹1,200/day)
6. **Family Travel Services** - SUV (Innova, ₹3,800/day)
7. **EcoDrive Munnar** - Electric Scooter (₹600/day)

### Tours (5)
1. **Tea Trails Explorer** - Full Day (₹1,500)
2. **Anamudi Peak Trek** - 2 Days (₹3,500)
3. **Kathakali Cultural Night** - 2 Hours (₹800)
4. **Spice Plantation Tour** - Half Day (₹1,200)
5. **Scenic Waterfall Circuit** - Full Day (₹2,000)

## 🔑 Login Credentials

**Email Pattern:** `<businessname>@munnarbot.com`  
**Password:** `BotPass123!`

**Examples:**
- `mistymountainresort@munnarbot.com` / `BotPass123!`
- `munnarwheels@munnarbot.com` / `BotPass123!`
- `teatrailsexplorer@munnarbot.com` / `BotPass123!`

## 🗺️ Location Data
All businesses have real coordinates in Munnar:
- Hotels: Spread across different areas
- Rentals & Tours: Centered in Munnar town
- Geospatial data ready for AI matching

## 🎯 Features
- ✅ All businesses **auto-approved** (status: "approved")
- ✅ Realistic pricing and descriptions
- ✅ Multiple room types per hotel
- ✅ Complete contact information
- ✅ Weather suitability tags for tours
- ✅ Ready for trip planner integration

## 🔄 Re-running
Running the script again will:
1. Delete all existing `@munnarbot.com` users
2. Delete all existing bot businesses
3. Create fresh 20 businesses

Safe to run multiple times!
