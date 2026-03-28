# Route Optimization in AI Travel Planner

Our AI Travel Planner utilizes a dual-layered approach to generate realistic, time-efficient itineraries. While the LLM (Gemini) generates the raw recommendations based on user preferences and budget, our routing algorithm ensures these recommendations are geographically logical and temporally feasible.

## How It Works: TSP with Time Windows (TSPTW)

The routing engine relies on three core mathematical and temporal concepts:

1. **The Haversine Formula (Spatial Reality):**
   Since the Earth is a sphere, we cannot use simple straight-line (Euclidean) geometry to calculate the distance between two tourist attractions. The Haversine formula calculates the exact "great-circle" distance between two points based on their latitude and longitude coordinates. 
   **Formula:** `Distance (d) = 2 * r * arcsin(√A)`
   *Where `A = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)`*
   - **r:** Radius of the Earth (approx 6,371 km)
   - **Δlat & Δlon:** Difference in Latitude and Longitude

2. **Time Window Constraints (Temporal Reality):**
   A perfect route is useless if the user arrives at a location after it closes. Our improved algorithm integrates strict time windows:
   - **Opening & Closing Times:** When the location is accessible.
   - **Visit Duration:** How much time the user needs to spend there.
   
   The algorithm ensures strict compliance using this simple rule:
   **Formula:** `[Arrival Time] + [Visit Duration] <= [Closing Time]`
   
   If a location is closed, or if visiting it would push the user past the closing time of the *next* critical location, the algorithm rejects it for that time slot.

3. **Nearest-Neighbor Heuristic with Time-Weighting:**
   Finding the absolute perfect route for many locations is computationally heavy (NP-Hard). Instead, we use a highly efficient approach:
   - Start at the user's hotel (or the first attraction) at a specific valid start time (e.g., 9:00 AM).
   - Calculate the Haversine distance from the current location to all unvisited locations.
   - Filter out any locations where Arrival Time + $D_i$ > Closing Time ($C_i$).
   - From the remaining *valid* options, select the closest location as the next stop.
   - Update the current time clock (Current Time + Travel Time + $D_i$).
   - Repeat until all locations for the day are scheduled.

This eliminates "scattered routing" while concurrently ensuring the user never arrives at a closed attraction.

---

## Case Study: Optimizing a Day Trip in Munnar (Kerala)

### The Scenario
A user is planning a 1-day trip to Munnar, Kerala, starting at **9:00 AM** from their hotel in **Munnar Town**. Our budget module has selected four must-visit locations for the day:

| Location | Opening Hours | Required Duration ($D_i$) | Haversine Distance from Town |
| :--- | :--- | :--- | :--- |
| **A. Eravikulam National Park** | 7:30 AM - 4:00 PM | 3 Hours | 10 km (North) |
| **B. Mattupetty Dam** | 9:30 AM - 5:00 PM | 2 Hours | 13 km (East) |
| **C. Echo Point** | 7:00 AM - 6:00 PM | 1 Hour | 18 km (East) |
| **D. Tea Museum** | 9:00 AM - 4:00 PM | 2 Hours | 2 km (Center) |

### Step 1: Evaluating the First Stop (9:00 AM)
- *If relying purely on Nearest-Neighbor (Distance Only):* The algorithm would pick the **Tea Museum** (only 2 km away).
- **The Time Window Problem:** If the user visits the Tea Museum (9:00 AM - 11:00 AM) and stays in town for lunch, they won't reach Eravikulam until 1:00 PM. Factoring in the 3-hour required duration ($D_i$), they finish at 4:00 PM, meaning they miss the optimal time for the Dam and risk arriving at Echo Point in the dark.

### Step 2: Applying the TSPTW Algorithm (Distance + Time)

Our system actively prevents temporal conflicts.

1. **Initialization:** Start at the User Hotel at **9:00 AM**.
2. **First Calculation (Time-Weighted):**
   - The algorithm recognizes $D_i$ for Eravikulam is 3 hours and its $C_i$ (Closing time) is 4:00 PM, making it the most restrictive time window. 
   - Despite the Tea Museum being physically closer, Eravikulam requires prioritization to ensure strict temporal compliance for the rest of the day.
   - *Algorithm selects **Eravikulam National Park** as Stop 1.*
3. **Updating the Clock:**
   - Travel to Eravikulam: ~30 mins. Arrival: 9:30 AM.
   - Duration ($D_i$): 3 hours.
   - Departure Time: **12:30 PM**.
4. **Second Calculation (From Eravikulam at 12:30 PM):**
   - Haversine distance to Mattupetty Dam = 22 km. $C_i$ is 5:00 PM. (Valid).
   - Haversine distance to Tea Museum = 9 km. $C_i$ is 4:00 PM. (Valid).
   - The algorithm selects the closest valid point heading back: **Tea Museum**.
5. **Updating the Clock:**
   - Travel to Tea Museum: ~30 mins. Arrival: 1:00 PM.
   - Duration ($D_i$): 2 hours.
   - Departure Time: **3:00 PM**.
6. **Third Calculation (From Tea Museum at 3:00 PM):**
   - Haversine distance to Mattupetty Dam = 13 km. $C_i$ is 5:00 PM.
   - Travel time: ~40 mins. Arrival: 3:40 PM. (Valid).
   - *Algorithm selects **Mattupetty Dam** as Stop 3.*
7. **Updating the Clock:**
   - Departure from Dam: **5:00 PM** (Closing time).
8. **Fourth Calculation (From Mattupetty at 5:00 PM):**
   - Only Echo Point remains. $C_i$ is 6:00 PM. Distance = 5 km.
   - Travel time: ~15 mins. Arrival: 5:15 PM.
   - *Algorithm selects **Echo Point** as Stop 4 for sunset viewing.*

### Step 3: The Optimized Route 
The final itinerary presented to the user:
**Hotel (9:00 AM) $\rightarrow$ Eravikulam (9:30 AM) $\rightarrow$ Tea Museum (1:00 PM) $\rightarrow$ Mattupetty Dam (3:40 PM) $\rightarrow$ Echo Point (5:15 PM - Sunset)**

**Conclusion:** 
By upgrading from a basic Nearest-Neighbor model to one that integrates **Time Windows (TSPTW)** and **Required Durations**, the AI completely solved the temporal routing flaw. It successfully routed the user to a massive 3-hour activity early in the day, ensuring they never arrived at a closed location, while still utilizing Haversine logic to keep driving distances to a minimum.
