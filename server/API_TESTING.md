# Business API Testing Guide

## Quick Start

### 1. Server Running
Ensure server is running on `http://localhost:5000`

```bash
cd server
npm start
```

### 2. Get Auth Token

**Register/Login:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:** Save the `accessToken` from cookies or response

### 3. Register Sample Businesses

Use the sample data from `testData/sampleBusinesses.js`

**Register Hotel:**
```bash
POST http://localhost:5000/api/business/register
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "businessType": "hotel",
  "name": "Seaside Paradise Resort",
  "description": "Luxury beachfront resort with ocean views",
  "location": {
    "address": "Calangute Beach Road, Calangute",
    "city": "Goa",
    "state": "Goa",
    "geo": {
      "lat": 15.5440,
      "lng": 73.7548
    }
  },
  "priceRange": "luxury",
  "pricePerNight": 8500,
  "hotelDetails": {
    "starRating": 5,
    "amenities": ["WiFi", "Pool", "Spa", "Beach Access"],
    "roomTypes": ["Deluxe Sea View", "Premium Suite"]
  },
  "contact": {
    "phone": "+91-832-2276800",
    "email": "info@seasideparadise.com"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Business registered successfully. Pending admin approval.",
  "data": {
    "_id": "...",
    "status": "pending",
    "name": "Seaside Paradise Resort",
    ...
  }
}
```

### 4. Get Your Businesses

```bash
GET http://localhost:5000/api/business/my-businesses
Authorization: Bearer YOUR_TOKEN
```

### 5. Approve Business (Admin Only)

First, set user role to admin in database, then:

```bash
PATCH http://localhost:5000/api/business/:businessId/status
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "status": "approved"
}
```

### 6. List Public Businesses

```bash
GET http://localhost:5000/api/business/type/hotel?city=Goa
```

### 7. Test Trip Generation with Businesses

```bash
POST http://localhost:5000/api/travel
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "location": "Goa",
  "startLocation": "Goa",
  "startDate": "2026-01-15",
  "days": 3,
  "budget": "moderate",
  "travelWith": "couple",
  "preferences": ["Nature", "Adventure", "Food"]
}
```

**Expected in Response:**
```json
{
  "success": true,
  "data": {
    "businessDetails": {
      "hotel": {
        "name": "Seaside Paradise Resort",
        "address": "Calangute Beach Road, Calangute",
        "pricePerNight": 8500,
        "contact": { "phone": "..." }
      },
      "rental": { ... },
      "toursPerDay": { ... }
    },
    "selectedBusinesses": {
      "hotel": "businessId",
      "rental": "businessId",
      "tours": ["tourId1", "tourId2"]
    }
  }
}
```

## API Endpoints Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/business/register` | User | Register new business |
| GET | `/api/business/my-businesses` | User | Get user's businesses |
| PUT | `/api/business/:id` | Owner | Update business |
| DELETE | `/api/business/:id` | Owner | Delete business |
| GET | `/api/business/type/:type` | Public | List by type & city |
| PATCH | `/api/business/:id/status` | Admin | Approve/reject |

## Testing Checklist

- [ ] Register 3 hotels (budget, moderate, luxury)
- [ ] Register 2 vehicle rentals
- [ ] Register 3 tour packages
- [ ] Approve all businesses as admin
- [ ] List public businesses
- [ ] Generate trip and verify businesses appear
- [ ] Verify graceful fallback (trip with no businesses in remote city)

## Common Issues

**1. "Business not found in trip"**
- Check if businesses are approved (`status: 'approved'`)
- Check if city matches trip location
- Check if budget range is compatible

**2. "Unauthorized"**
- Ensure valid auth token in request
- Check token expiry

**3. "Geocoding failed"**
- Verify lat/lng coordinates are valid
- Ensure coordinates are in [lng, lat] order for MongoDB

## Next Steps

After testing API:
1. Build frontend Profile "My Businesses" section
2. Add business display to ViewTrip
3. Create admin dashboard for approvals
