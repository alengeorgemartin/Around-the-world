# Budget Optimization in AI Travel Planner

Generating an itinerary isn't just about finding the best places—it's about finding the best places *that the user can actually afford*. Our AI Travel Planner ensures strict budget compliance while maximizing the quality of the trip by utilizing established mathematical optimization modules.

## How It Works: The 0/1 Knapsack & Greedy Approach

When a user specifies a budget, the AI faces a classic algorithmic challenge: how do we select the most rewarding combination of activities without exceeding the total spending limit? We solve this using a dual-layered approach:

### 1. The Greedy Heuristic (Utility Scoring)
Before any selection happens, every potential attraction or activity is assigned a **Utility Score ($u_i$)**. This score is dynamically calculated based on:
- **User Preferences:** (e.g., Does the user love nature? Are they looking for adventure?)
- **Popularity/Rating:** (e.g., Google Reviews or intrinsic value of the location)
- **Time/Cost Ratio:** How much "value" the user gets per dollar spent.

By ranking activities based on this Utility Score, the Greedy module can quickly filter out low-value, high-cost activities.

### 2. The 0/1 Knapsack Module (Dynamic Programming)
The filtered list is then passed to the Knapsack module. 
- The **Knapsack Capacity ($B$)** is the user's daily or total activity budget.
- The **Items** are the activities, each with a specific **Cost ($c_i$)** and **Utility Score ($u_i$)**.
- **0/1 Constraint:** The AI can either select an activity (1) or not select it (0). It cannot split a ticket price in half.

Using Dynamic Programming, the algorithm evaluates possible combinations to find the exact subset of activities that provides the **maximum total satisfaction/utility ($S$)** strictly within the budget ($B$).

---

## Case Study: Budgeting a Day in Munnar (Kerala)

### The Scenario
A user is planning a 1-day trip to Munnar. Our AI has narrowed down the best attractions, but the user has set a strict **activity budget of ₹1,000 for the day**. 

Here are the potential activities the Greedy module has shortlisted:

| Activity | Cost ($c_i$) | Utility Score ($u_i$) | Description |
| :--- | :--- | :--- | :--- |
| **A. Eravikulam National Park** | ₹300 | 9.0 | High Priority: Famous for Nilgiri Tahr and views. |
| **B. Kolukkumalai Jeep Safari** | ₹800 | 9.5 | High Priority: Spectacular sunrise and adventure. |
| **C. Tea Museum Tour** | ₹150 | 6.5 | Medium Priority: Informative history of tea. |
| **D. Mattupetty Dam Boating** | ₹350 | 7.0 | Medium Priority: Scenic boat ride. |
| **E. Echo Point (Entry only)** | ₹50 | 5.5 | Low Priority: Quick scenic stop. |

### Step 1: The Greedy Pitfall (Why simple logic fails)
If the AI simply picked the highest utility item first (The Jeep Safari at ₹800), the user would only have ₹200 left. 
With ₹200 remaining, the AI could only pick the Tea Museum (₹150) or Echo Point (₹50).
- **Result:** Jeep Safari + Tea Museum = Cost: ₹950. **Total Utility Score: 16.0**
- *The user misses out on Eravikulam, the most iconic spot in Munnar.*

### Step 2: The 0/1 Knapsack Optimization

Our Knapsack module evaluates the combinations holistically to maximize utility without exceeding ₹1,000. 

**Knapsack Evaluation Matrix:**
- **Combination 1 (Jeep Focus):** Jeep Safari + Tea Museum (Cost: ₹950 / Utility: 16.0)
- **Combination 2 (Nature Focus):** Eravikulam + Mattupetty + Tea Museum + Echo Point (Cost: ₹850 / Utility: 28.0)
- **Combination 3 (Mixed):** Eravikulam + Jeep Safari (Cost: ₹1,100) $\leftarrow$ *Rejected: Exceeds Budget!*

### Step 3: The Optimized Selection
The Knapsack algorithm determines that **Combination 2** yields the highest total Utility Score (28.0) while staying well under the ₹1,000 limit.

The AI creates the final activity list for the day:
1. **Eravikulam National Park** (₹300)
2. **Mattupetty Dam Boating** (₹350)
3. **Tea Museum Tour** (₹150)
4. **Echo Point** (₹50)

**Total Cost: ₹850** (Leaving room for tea and snacks!)
**Total Utility/Satisfaction:** 28.0

**Conclusion:** 
By utilizing the 0/1 Knapsack algorithm instead of basic sorting, the AI avoided sinking 80% of the budget into a single expensive activity (the Safari). Instead, it provided a rich, 4-activity itinerary that maximized the user's experience while strictly adhering to their financial constraints.
