import Trip from "../models/Trip.js";
import timeEngine from "../utils/timeEngine.js";
import { callGemini, extractJSON } from "../services/geminiService.js";
import { buildPreferenceBias, estimateActivityCost } from "../aiController.js";
// Since fillActivityDetails is not exported, we either need to export it or redefine/copy the enrichment logic.
// However, we can export it from aiController.js. I'll need to modify aiController.js to export fillActivityDetails and geocodePlace.
