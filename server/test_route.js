import { optimizeDailyRoute } from './services/routeOptimizer.js';
import fs from 'fs';

const mockActivities = [
    {
        activityName: "Hotel Start", // Index 0 (Current location initially)
        geo: { lat: 48.8566, lng: 2.3522 },
        timeWindow: { open: "00:00", close: "23:59" },
        durationMinutes: 0
    },
    {
        activityName: "Morning Museum", // Should be picked first (near, opens 09:00)
        geo: { lat: 48.8606, lng: 2.3376 },
        timeWindow: { open: "09:00", close: "18:00" },
        durationMinutes: 180
    },
    {
        activityName: "Nightclub", // Physically close but opens at 22:00
        geo: { lat: 48.8600, lng: 2.3380 },
        timeWindow: { open: "22:00", close: "04:00" },
        durationMinutes: 120
    },
    {
        activityName: "Lunch Cafe", // Further away, but time window fits after museum
        geo: { lat: 48.8700, lng: 2.3400 },
        timeWindow: { open: "11:00", close: "15:00" },
        durationMinutes: 60
    },
    {
        activityName: "Afternoon Park", // Should be picked after lunch
        geo: { lat: 48.8500, lng: 2.3200 },
        timeWindow: { open: "08:00", close: "20:00" },
        durationMinutes: 120
    }
];

// Re-implementing lightly to trace
const AVG_SPEED_KMH = 30;
function distance(a, b) {
    if (!a || !b) return Infinity;
    const R = 6371; const dLat = (b.lat - a.lat) * Math.PI / 180; const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)); return R * c;
}
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
};

let outputLog = "";

let currentTime = 540;
let current = mockActivities[0];
let visited = [current];
let remaining = mockActivities.slice(1);
outputLog += `Start Time: ${currentTime}\n`;

while (remaining.length) {
    let nearestIndex = 0; let bestScore = Infinity; let chosenNextTime = currentTime;
    outputLog += `\nFrom: ${current.activityName} (Current Time: ${currentTime})\n`;
    
    remaining.forEach((place, index) => {
        const dist = distance(current.geo, place.geo);
        const expectedArrival = currentTime + (dist / AVG_SPEED_KMH) * 60;
        let openTime = timeToMinutes(place.timeWindow?.open);
        let closeTime = timeToMinutes(place.timeWindow?.close);
        if (closeTime < openTime) closeTime += 24 * 60; // Handle wrap-around like 22:00 to 04:00

        let score = dist;
        let actualArrival = expectedArrival;

        if (expectedArrival < openTime) {
            score += (openTime - expectedArrival) * 0.5;
            actualArrival = openTime;
        }

        if (actualArrival + (place.durationMinutes || 120) > closeTime) {
            score = Infinity;
        }
        outputLog += `  -> ${place.activityName}: dist=${dist.toFixed(2)}, arv=${expectedArrival.toFixed(0)}, wait=${Math.max(0, openTime - expectedArrival).toFixed(0)}, score=${score===Infinity?'INF':score.toFixed(2)}, close=${closeTime}\n`;
        
        if (score < bestScore) {
            bestScore = score; nearestIndex = index; chosenNextTime = actualArrival + (place.durationMinutes || 120);
        }
    });

    if (bestScore === Infinity) {
        outputLog += `  [!] All rejected, picking closest distance\n`;
        let closestDist = Infinity;
        remaining.forEach((place, idx) => {
            const d = distance(current.geo, place.geo);
            if (d < closestDist) { closestDist = d; nearestIndex = idx; }
        });
        const p = remaining[nearestIndex];
        chosenNextTime = currentTime + (closestDist / AVG_SPEED_KMH) * 60 + (p.durationMinutes || 120);
    }
    current = remaining.splice(nearestIndex, 1)[0];
    visited.push(current);
    currentTime = chosenNextTime;
}

outputLog += "\nResults:\n";
outputLog += visited.map(v => v.activityName).join(" -> ") + "\n";
fs.writeFileSync('debug_route.txt', outputLog);
