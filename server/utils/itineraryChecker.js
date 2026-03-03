/* ================= VALIDATION HELPERS ================= */

const VALID_ACTIVITY_REGEX = /^(Visit|Explore)\s.+/;
const VALID_TIME_REGEX = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/* ================= MAIN CHECKER ================= */

export function validateAndSanitizeItinerary(rawPlan, expectedDays) {
  if (!rawPlan || typeof rawPlan !== "object") return null;

  const sanitized = {
    location: cleanString(rawPlan.location),
    days: expectedDays,
    travelWith: cleanString(rawPlan.travelWith),
    budget: cleanString(rawPlan.budget),
    itinerary: [],
    accommodation: {
      name: cleanString(rawPlan?.accommodation?.name),
      address: cleanString(rawPlan?.accommodation?.address),
    },
  };

  if (!Array.isArray(rawPlan.itinerary)) return null;

  if (rawPlan.itinerary.length !== expectedDays) return null;

  for (let i = 0; i < expectedDays; i++) {
    const dayBlock = rawPlan.itinerary[i];
    if (!dayBlock) return null;

    const day = {
      day: i + 1,
      morning: [],
      afternoon: [],
      evening: [],
    };

    for (const period of ["morning", "afternoon", "evening"]) {
      const slot = Array.isArray(dayBlock[period])
        ? dayBlock[period][0]
        : null;

      if (!slot) return null;

      const activity = cleanString(slot.activity);
      const time = cleanString(slot.time);

      if (!VALID_ACTIVITY_REGEX.test(activity)) return null;
      if (!VALID_TIME_REGEX.test(time)) return null;

      day[period].push({ activity, time });
    }

    sanitized.itinerary.push(day);
  }

  return sanitized;
}