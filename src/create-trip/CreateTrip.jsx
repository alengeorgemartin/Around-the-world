import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/CreateTripNew.css";

function CreateTrip() {
  const navigate = useNavigate();

  /* ================= PROFILE PREFERENCES ================= */
  const [profilePreferences, setProfilePreferences] = useState([]);

  useEffect(() => {
    api.get("/profile")
      .then(res => {
        const interests = res.data?.preferences?.interests || [];
        setProfilePreferences(interests);
      })
      .catch(() => { });
  }, []);

  /* ================= DESTINATION SEARCH ================= */
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationResults, setDestinationResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState("");

  /* ================= START LOCATION SEARCH ================= */
  const [startQuery, setStartQuery] = useState("");
  const [startResults, setStartResults] = useState([]);
  const [startLocation, setStartLocation] = useState("");

  /* ================= OTHER FIELDS ================= */
  const [startDate, setStartDate] = useState("");
  const [preferences, setPreferences] = useState([]);
  const [days, setDays] = useState(1);
  const [budget, setBudget] = useState("");
<<<<<<< HEAD
=======
  const [budgetAmount, setBudgetAmount] = useState(""); // NEW: numeric ₹ amount
  const [travelMonth, setTravelMonth] = useState(new Date().getMonth() + 1); // NEW: 1-12
>>>>>>> 5e87ed998656cb352f41b99d64d5316ed6d361eb
  const [travelWith, setTravelWith] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const preferenceOptions = [
    "Food & Cafes",
    "Hiking & Trekking",
    "Adventure Sports",
    "Sightseeing",
    "Nature & Relaxation",
    "Night Life",
    "Shopping",
    "Cultural & Heritage",
    "Bike / Car Riding",
  ];

  const CONFLICTING_PREFERENCES = {
    "Nature & Relaxation": ["Night Life", "Adventure Sports"],
    "Night Life": ["Nature & Relaxation", "Hiking & Trekking"],
    "Hiking & Trekking": ["Shopping", "Night Life"],
    "Shopping": ["Hiking & Trekking"],
    "Adventure Sports": ["Cultural & Heritage", "Nature & Relaxation"],
    "Cultural & Heritage": ["Adventure Sports"],
  };

  /* ================= SEARCH FUNCTIONS ================= */
  const searchDestination = async (value) => {
    setDestinationQuery(value);

    if (value.length < 3) {
      setDestinationResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setDestinationResults(data);
    } catch {
      setDestinationResults([]);
    }
  };

  const searchStartLocation = async (value) => {
    setStartQuery(value);

    if (value.length < 3) {
      setStartResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setStartResults(data);
    } catch {
      setStartResults([]);
    }
  };

  /* ================= SELECT HANDLERS ================= */
  const selectDestination = (place) => {
    setSelectedPlace(place.display_name);
    setDestinationQuery(place.display_name);
    setDestinationResults([]);
  };

  const selectStartLocation = (place) => {
    setStartLocation(place.display_name);
    setStartQuery(place.display_name);
    setStartResults([]);
  };

  /* ================= PREFERENCES ================= */
  const togglePreference = (pref) => {
    setPreferences((prev) => {
      if (prev.includes(pref)) {
        return prev.filter(p => p !== pref);
      }

      const conflicts = CONFLICTING_PREFERENCES[pref] || [];
      const filtered = prev.filter(p => !conflicts.includes(p));

      return [...filtered, pref];
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalPreferences =
      preferences.length > 0 ? preferences : profilePreferences;

    if (
      !selectedPlace ||
      !startLocation ||
      !startDate ||
      !days ||
      !budget ||
      !travelWith
    ) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/travel", {
        location: selectedPlace,
        startLocation,
        startDate,
        days,
        budget,
<<<<<<< HEAD
=======
        budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
        travelMonth: Number(travelMonth),
>>>>>>> 5e87ed998656cb352f41b99d64d5316ed6d361eb
        travelWith,
        preferences: finalPreferences,
      });

      if (res.data.success) {
        navigate(`/trip/${res.data.data._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>

      <div className="container">
        <h1 className="big-title">Plan Your Trip</h1>
        <p className="create-trip-subtitle">Tell us your preferences and let AI create your perfect itinerary</p>

        <form onSubmit={handleSubmit} className="trip-form">
          {/* Destination Card */}
          <div className="form-card">
            <h2 className="card-title">
              <i className="fa-solid fa-location-dot"></i> Where to?
            </h2>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Search destination..."
                value={destinationQuery}
                onChange={(e) => searchDestination(e.target.value)}
                className="form-input"
              />
              {destinationResults.length > 0 && (
                <div className="search-results">
                  {destinationResults.slice(0, 5).map((place, idx) => (
                    <div
                      key={idx}
                      className="result-item"
                      onClick={() => selectDestination(place)}
                    >
                      <i className="fa-solid fa-map-pin"></i>
                      {place.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Start Location Card */}
          <div className="form-card">
            <h2 className="card-title">
              <i className="fa-solid fa-house"></i> Starting from?
            </h2>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Your starting location..."
                value={startQuery}
                onChange={(e) => searchStartLocation(e.target.value)}
                className="form-input"
              />
              {startResults.length > 0 && (
                <div className="search-results">
                  {startResults.slice(0, 5).map((place, idx) => (
                    <div
                      key={idx}
                      className="result-item"
                      onClick={() => selectStartLocation(place)}
                    >
                      <i className="fa-solid fa-map-pin"></i>
                      {place.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trip Details Card */}
          <div className="form-card">
            <h2 className="card-title">
              <i className="fa-solid fa-calendar-days"></i> Trip Details
            </h2>
            <div className="details-grid">
              <div className="input-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <label>Duration (Days)</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  min="1"
                  max="30"
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <label>Budget</label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select budget</option>
                  <option value="Cheap">Cheap</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>

              <div className="input-group">
<<<<<<< HEAD
=======
                <label>
                  💰 Total Budget (&#8377;){" "}
                  <span style={{ fontWeight: 400, fontSize: "0.8em", opacity: 0.7 }}>
                    optional — enables smart allocation
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  min="500"
                  step="500"
                  className="form-input"
                />
              </div>

              <div className="input-group">
>>>>>>> 5e87ed998656cb352f41b99d64d5316ed6d361eb
                <label>Traveling With</label>
                <select
                  value={travelWith}
                  onChange={(e) => setTravelWith(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select companions</option>
                  <option value="Solo">Solo</option>
                  <option value="Couple">Couple</option>
                  <option value="Family">Family</option>
                  <option value="Friends">Friends</option>
                </select>
              </div>
<<<<<<< HEAD
=======

              {/* NEW: Seasonal Context Input */}
              <div className="input-group">
                <label>
                  🌦 Travel Month
                  <span style={{ fontWeight: 400, fontSize: "0.8em", opacity: 0.7, marginLeft: "6px" }}>
                    optimizes activities for season
                  </span>
                </label>
                <select
                  value={travelMonth}
                  onChange={(e) => setTravelMonth(e.target.value)}
                  className="form-input"
                >
                  <option value={1}>January (Winter)</option>
                  <option value={2}>February (Winter)</option>
                  <option value={3}>March (Summer)</option>
                  <option value={4}>April (Summer)</option>
                  <option value={5}>May (Summer)</option>
                  <option value={6}>June (Summer)</option>
                  <option value={7}>July (Monsoon)</option>
                  <option value={8}>August (Monsoon)</option>
                  <option value={9}>September (Monsoon)</option>
                  <option value={10}>October (Autumn)</option>
                  <option value={11}>November (Autumn)</option>
                  <option value={12}>December (Winter)</option>
                </select>
              </div>
>>>>>>> 5e87ed998656cb352f41b99d64d5316ed6d361eb
            </div>
          </div>

          {/* Preferences Card */}
          <div className="form-card">
            <h2 className="card-title">
              <i className="fa-solid fa-heart"></i> Travel Interests
            </h2>
            <p className="card-subtitle">Select your preferences (conflicting ones will be auto-removed)</p>
            <div className="preferences-grid">
              {preferenceOptions.map((pref) => {
                const isSelected = preferences.includes(pref);
                const conflicts = CONFLICTING_PREFERENCES[pref] || [];
                const hasConflict = preferences.some(p => conflicts.includes(p));
                const isDisabled = hasConflict && !isSelected;

                return (
                  <div
                    key={pref}
                    className={`pref-chip ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                    onClick={() => !isDisabled && togglePreference(pref)}
                  >
                    {pref}
                    {isSelected && <i className="fa-solid fa-check"></i>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Generating Itinerary...
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                Generate My Trip
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}

export default CreateTrip;
