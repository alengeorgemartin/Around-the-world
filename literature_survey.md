# Chapter 2: Literature Review / Literature Survey

## 2.1 Introduction
The development of an intelligent, context-aware travel planner requires an understanding of existing methodologies in recommendation systems, route optimization, and budget allocation. This chapter reviews the literature related to the core algorithms and technologies used in the AI Travel Planner, including Large Language Models (LLMs), solving the Traveling Salesperson Problem (TSP), and Knapsack-based budget optimization.

---

## 2.2 Review of Relevant Literature

### Paper 1: AI-Driven Travel Recommendation Systems using Collaborative Filtering
**Authors:** S. Kumar, et al.
**Year:** 2022
**Summary:** This paper proposes a travel recommendation system utilizing collaborative filtering and natural language processing to suggest destinations based on user history. It focuses on reducing the cold-start problem in new user onboarding by utilizing preliminary questionnaires.
**Limitations:** The system mainly suggests individual places rather than generating a complete, day-by-day logical itinerary. It also lacks real-time budget adjustments.
**How Our Project Overcomes This:** Our project utilizes **Google's Gemini LLM** to generate end-to-end, contextual daily itineraries dynamically. Instead of just suggesting places, our system organizes them by days and time constraints, ensuring a structured user experience.

### Paper 2: Applying the Traveling Salesman Problem (TSP) to Tourist Route Optimization
**Authors:** M. Zheng, & L. Wang.
**Year:** 2020
**Summary:** The authors implement a genetic algorithm to solve the Traveling Salesman Problem (TSP) for tourists navigating multiple landmarks in a city. The goal is to minimize the total walking/driving distance.
**Limitations:** Their routing does not factor in real-world spherical distances (Earth's curvature) efficiently for long-distance travel, and the computational overhead of the genetic algorithm is high for real-time mobile applications.
**How Our Project Overcomes This:** We implement a **Nearest Neighbor TSP** heuristic combined with the **Haversine formula**. This guarantees extremely fast, real-time route optimization that correctly accounts for the Earth's curvature, ensuring realistic travel times and distances without heavy computational delays.

### Paper 3: Budget-Constrained Trip Planning using the 0/1 Knapsack Problem
**Authors:** J. Li, T. Chen, & H. Liu.
**Year:** 2021
**Summary:** This research introduces a method for maximizing the "tourist satisfaction value" of selected attractions while strictly keeping the total cost under a specific user budget, modeled as a 0/1 Knapsack Problem.
**Limitations:** The system strictly rejects locations if the total exceeds the budget, leading to sparse itineraries if the user inputs a slightly restrictive budget. It lacks a fallback mechanism.
**How Our Project Overcomes This:** Our system implements a dual-strategy approach: A **Knapsack algorithm** for strict optimization, combined with a **Greedy fallback algorithm**. If the budget is too constrained, the Greedy algorithm ensures the user still receives a viable itinerary composed of high-value, low-cost (or free) activities, dynamically adjusting to provide the best possible experience.

### Paper 4: Context-Aware Mobile Tourist Guides Using Weather and Seasonal Data
**Authors:** A. Rossi, & M. Bianchi.
**Year:** 2019
**Summary:** The paper describes a mobile guide that dynamically alters recommendations based on real-time weather APIs and seasonal inputs (e.g., suggesting indoor museums during rain).
**Limitations:** The rules for seasonal adjustment are hard-coded, making the system brittle and difficult to scale to global destinations with diverse microclimates. 
**How Our Project Overcomes This:** We employ **Seasonal Intelligence strategies** fused with the Gemini LLM. Instead of hardcoded rules, the LLM contextually understands the implications of the weather/season (e.g., "Monsoon in Kerala") and naturally filters out unsafe or non-ideal activities, providing a highly scalable context-aware recommendation.

### Paper 5: Integration of Large Language Models in Context-Aware Recommender Systems
**Authors:** D. Smith, et al.
**Year:** 2023
**Summary:** This comprehensive survey evaluates the integration of large language models (LLMs) into standard recommender systems to enhance conversational search and explanation generation.
**Limitations:** While LLMs are excellent at generation, the survey notes they often hallucinate geographical facts (e.g., placing venues closer than they are) and struggle with strict mathematical constraints like budgets.
**How Our Project Overcomes This:** Our platform implements an **Orchestration Architecture** where the Gemini LLM is strictly used for semantic understanding and creative generation, while the deterministic mathematical constraints (budget via Knapsack, routing via TSP/Haversine) are handled by a dedicated Node.js backend logic. This dual approach ensures both creativity and mathematical precision.

---

## 2.3 Summary of Identified Gaps and Project Novelty

Based on the literature survey, existing solutions often handle trip generation, route optimization, and budget constraints as isolated problems in distinct papers. 

**The novel contribution of this AI Travel Planner is the orchestration of these disparate algorithmic approaches into a single cohesive pipeline:**
1. **Dynamic Generation:** Using LLMs instead of static databases.
2. **Spatial Logic:** Using Haversine + TSP for logical physical routing without hallucination.
3. **Financial Logic:** Using Knapsack + Greedy algorithms for strict but flexible fail-safe budget adherence.
4. **Contextual Logic:** Adapting to seasons and user-specific constraints instantly.

By combining deterministic operations (TSP, Knapsack) with generative AI (Gemini), the proposed system directly addresses the gaps identified in current literature—eliminating the geographical and financial hallucinations typical of pure-LLM planners, while maintaining the flexibility that rigid traditional algorithmic planners lack.
