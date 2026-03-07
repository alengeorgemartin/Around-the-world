import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  MapPin,
  Sun,
  Cloud,
  Moon,
  Sparkles,
  Replace,
  Plus,
  Wand2,
  Undo,
  Calendar,
  DollarSign,
  Users,
  Navigation,
  Clock,
  X,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudFog,
  Zap,
  Thermometer,
  Droplets,
  AlertTriangle,
  Star,
  Trash2,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/ViewTripNew.css";
import BookingModal from "../components/BookingModal";

/* ---------------- FIX LEAFLET ICON ISSUE ---------------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ---------------- AUTO FIT MAP ---------------- */
function AutoFit({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(points.map(p => [p.geo.lat, p.geo.lng]), {
      padding: [60, 60],
    });
  }, [points, map]);

  return null;
}

/* ---------------- PERIOD ICON ---------------- */
const getPeriodIcon = (period) => {
  if (period === "morning") return <Sun size={18} className="text-amber-500" />;
  if (period === "afternoon") return <Cloud size={18} className="text-blue-500" />;
  if (period === "evening") return <Moon size={18} className="text-indigo-600" />;
  return null;
};

/* ---------------- WEATHER ICON ---------------- */
const getWeatherIcon = (condition) => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes("clear") || conditionLower.includes("sunny")) {
    return <Sun size={20} className="text-yellow-500" />;
  }
  if (conditionLower.includes("rain")) {
    return <CloudRain size={20} className="text-blue-600" />;
  }
  if (conditionLower.includes("drizzle")) {
    return <CloudDrizzle size={20} className="text-blue-400" />;
  }
  if (conditionLower.includes("snow")) {
    return <CloudSnow size={20} className="text-gray-400" />;
  }
  if (conditionLower.includes("thunder") || conditionLower.includes("storm")) {
    return <Zap size={20} className="text-purple-600" />;
  }
  if (conditionLower.includes("fog")) {
    return <CloudFog size={20} className="text-gray-500" />;
  }
  return <Cloud size={20} className="text-gray-400" />;
};

/* ---------------- WEATHER CLASSIFICATION BADGE ---------------- */
const getClassificationBadge = (classification) => {
  if (classification === "outdoor-friendly") {
    return (
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
        ✓ Outdoor Friendly
      </span>
    );
  }
  if (classification === "indoor-preferred") {
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
        ! Indoor Preferred
      </span>
    );
  }
  if (classification === "restricted") {
    return (
      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
        <AlertTriangle size={12} />
        Extreme Weather
      </span>
    );
  }
  return null;
};

function ViewTrip() {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // Replace modal
  const [activeEdit, setActiveEdit] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Extra suggestions (add)
  const [extraSuggestions, setExtraSuggestions] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  // Track which activity has suggestions open (day, period, activityIndex)
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  // Smart adjust suggestions
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [loadingSmart, setLoadingSmart] = useState(false);
  const [activeSmartSuggestion, setActiveSmartSuggestion] = useState(null);

  // Polling state
  const [pollCount, setPollCount] = useState(0);

  // Booking state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Running Late state
  const [runningLateLoading, setRunningLateLoading] = useState(false);
  const [runningLateResult, setRunningLateResult] = useState(null);
  const [showRunningLateModal, setShowRunningLateModal] = useState(false);

  // Partner Businesses state
  const [allBusinesses, setAllBusinesses] = useState({ hotels: [], rentals: [], tours: [] });
  const [activeBusinessTab, setActiveBusinessTab] = useState('hotels');
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [showPartnerBusinesses, setShowPartnerBusinesses] = useState(false);

  // PDF download state
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  /* ---------------- PDF DOWNLOAD HANDLER ---------------- */
  const downloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const res = await api.get(`/trip/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      const safeLocation = (trip.location || "Trip").replace(/[^a-zA-Z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      link.setAttribute("download", `${safeLocation}-Travel-Plan.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  /* ---------------- FETCH TRIP ---------------- */
  const fetchTrip = async () => {
    const res = await api.get(`/trip/${id}`);
    setTrip(res.data.data);
    return res.data.data;
  };

  /* ---------------- CHECK IF DETAILS ARE LOADING ---------------- */
  const hasLoadingDetails = (tripData) => {
    if (!tripData || !tripData.itinerary) return false;

    for (const day of tripData.itinerary) {
      for (const period of ['morning', 'afternoon', 'evening']) {
        if (day[period] && day[period].length > 0) {
          for (const activity of day[period]) {
            if (activity.description === "Loading details...") {
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  /* ---------------- INITIAL FETCH AND POLLING ---------------- */
  useEffect(() => {
    let pollingInterval = null;

    const startPolling = async () => {
      // Initial fetch
      const tripData = await fetchTrip();

      // Fetch all businesses for this location
      if (tripData && tripData.location) {
        const city = tripData.location.split(',')[0].trim();
        try {
          setLoadingBusinesses(true);
          const res = await api.get(`/businesses/${city}`);
          if (res.data.success) {
            setAllBusinesses(res.data.data);
          }
        } catch (error) {
          console.error('Error fetching businesses:', error);
        } finally {
          setLoadingBusinesses(false);
        }
      }

      // Check if we need to poll for updates
      if (hasLoadingDetails(tripData)) {
        console.log("🔄 Trip has loading details, starting auto-refresh polling...");

        // Poll every 3 seconds
        pollingInterval = setInterval(async () => {
          setPollCount(prev => {
            const newCount = prev + 1;

            // Stop polling after 20 attempts (60 seconds)
            if (newCount >= 20) {
              console.log("⏱️ Polling limit reached, stopping auto-refresh");
              if (pollingInterval) clearInterval(pollingInterval);
              return newCount;
            }

            return newCount;
          });

          const updatedTrip = await fetchTrip();

          // Stop polling if all details are loaded
          if (!hasLoadingDetails(updatedTrip)) {
            console.log("✅ All trip details loaded, stopping auto-refresh");
            if (pollingInterval) clearInterval(pollingInterval);
          }
        }, 3000); // Poll every 3 seconds
      } else {
        console.log("✅ Trip details already complete");
      }
    };

    startPolling();

    // Cleanup on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [id]);

  /* ---------------- MAP POINTS ---------------- */
  const mapPoints = useMemo(() => {
    if (!trip) return [];

    const pts = [];
    trip.itinerary.forEach(day => {
      if (selectedDay && day.day !== selectedDay) return;

      ["morning", "afternoon", "evening"].forEach(slot => {
        day[slot].forEach(a => {
          if (a.geo?.lat && a.geo?.lng) {
            pts.push({ ...a, day: day.day, period: slot });
          }
        });
      });
    });

    return pts;
  }, [trip, selectedDay]);

  /* ---------------- ACTIONS ---------------- */
  const replaceActivity = async (strategyHint) => {
    if (!activeEdit) return;

    setLoadingAI(true);
    await api.post(`/trip/${id}/replace-activity`, {
      day: activeEdit.day,
      period: activeEdit.period,
      currentActivity: activeEdit.activity.activity,
      preferenceHint: strategyHint,
    });

    await fetchTrip();
    setActiveEdit(null);
    setLoadingAI(false);
  };

  const loadAdditionalSuggestions = async (day, period, activity, activityIndex) => {
    setLoadingExtras(true);
    setExtraSuggestions([]);
    setActiveSuggestion({ day, period, activityIndex });

    const res = await api.post(`/trip/${id}/additional-suggestions`, {
      day,
      period,
      currentActivity: activity.activity,
    });

    setExtraSuggestions(res.data.suggestions || []);
    setLoadingExtras(false);
  };

  const addActivity = async (day, period, suggestion) => {
    try {
      await api.post(`/trip/${id}/append-activity`, {
        day,
        period,
        activity: {
          activity: suggestion.activity,
          address: trip.location,
          description: suggestion.reason,
          placeUrl: "https://maps.google.com",
        },
      });

      // Clear suggestions and refresh trip data
      setExtraSuggestions([]);
      setActiveSuggestion(null);
      await fetchTrip();
    } catch (error) {
      console.error("Error adding activity:", error);
      alert("Failed to add activity. Please try again.");
    }
  };

  const deleteActivity = async (day, period, activityIndex) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this activity?");
    if (!confirmDelete) return;

    try {
      await api.post(`/trip/${id}/delete-activity`, {
        day,
        period,
        activityIndex,
      });

      // Clear any open suggestions and refresh trip data
      setExtraSuggestions([]);
      setActiveSuggestion(null);
      setSmartSuggestions([]);
      setActiveSmartSuggestion(null);
      await fetchTrip();
      alert("✓ Activity deleted successfully!");
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Failed to delete activity. Please try again.");
    }
  };

  const undoLastChange = async () => {
    const confirmUndo = window.confirm("Are you sure you want to undo the last change?");
    if (!confirmUndo) return;

    try {
      await api.post(`/trip/${id}/undo`);
      await fetchTrip();
      alert("✓ Successfully undone last change!");
    } catch (error) {
      console.error("Error undoing change:", error);
      alert("Failed to undo. Please try again.");
    }
  };

  /* ---------------- SMART ADJUST ---------------- */
  const smartAdjust = async (day, period, activityIndex) => {
    setLoadingSmart(true);
    setSmartSuggestions([]);
    setActiveSmartSuggestion({ day, period, activityIndex });

    const res = await api.post(`/trip/${id}/smart-adjustment`, {
      day,
      period,
      context: "time based",
    });

    setSmartSuggestions(res.data.suggestions || []);
    setLoadingSmart(false);
  };

  /* ---------------- BOOKING HANDLERS ---------------- */
  const handleBookNow = (bookingData) => {
    setSelectedBooking(bookingData);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      const response = await api.post('/bookings/create', {
        tripId: trip._id,
        businessId: bookingData.businessId,
        bookingType: bookingData.bookingType,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        roomType: bookingData.roomType,
        guests: bookingData.guests,
        pickupLocation: bookingData.pickupLocation,
        returnLocation: bookingData.returnLocation,
        tourDay: bookingData.tourDay,
        participants: bookingData.participants,
        basePrice: bookingData.basePrice,
        totalPrice: bookingData.totalPrice || bookingData.basePrice,
        specialRequests: bookingData.specialRequests,
        contactInfo: bookingData.contactInfo,
      });

      if (response.data.success) {
        alert('Booking created successfully! The business owner will confirm your booking soon.');
        setShowBookingModal(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert(error.response?.data?.message || 'Failed to create booking. Please try again.');
    }
  };

  /* ---------------- RUNNING LATE HANDLERS ---------------- */
  const handleRunningLate = async (delayMinutes, dayNumber) => {
    setRunningLateLoading(true);
    setRunningLateResult(null);

    try {
      const response = await api.post('/running-late', {
        trip_id: id,
        day: dayNumber,
        delay_minutes: delayMinutes,
      });

      if (response.data.success) {
        setRunningLateResult(response.data);
        setShowRunningLateModal(true);
        await fetchTrip(); // Refresh trip data
      } else {
        // Warning case (must-activities conflict)
        alert(response.data.warning || 'Cannot adjust schedule');
        if (response.data.conflicts) {
          console.log('Conflicts:', response.data.conflicts);
        }
      }
    } catch (error) {
      console.error('Running Late error:', error);
      if (error.response?.status === 429) {
        alert('Please wait before adjusting again. Rate limit active.');
      } else {
        alert(error.response?.data?.message || 'Failed to adjust itinerary');
      }
    } finally {
      setRunningLateLoading(false);
    }
  };

  const handleUndoRunningLate = async () => {
    if (!runningLateResult?.undo_token) return;

    try {
      await api.post('/running-late/undo', {
        trip_id: id,
        undo_token: runningLateResult.undo_token,
      });

      await fetchTrip();
      setShowRunningLateModal(false);
      setRunningLateResult(null);
      alert('✓ Changes reverted successfully!');
    } catch (error) {
      console.error('Undo error:', error);
      alert('Failed to undo changes');
    }
  };

  // Check if a day is today
  // Show Running Late buttons on ALL days for flexibility
  const isToday = (dayNumber) => {
    return true;
  };



  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading your trip...</p>
        </div>
      </div>
    );
  }

  const isLoadingDetails = hasLoadingDetails(trip);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">

        {/* AUTO-REFRESH BANNER */}
        {isLoadingDetails && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg p-4 mb-4 animate-pulse">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <p className="font-semibold">
                🔄 Enriching your trip details... Auto-refreshing every 3 seconds
              </p>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="text-blue-600" size={32} />
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {trip.location}
                </h1>
              </div>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {trip.days} days
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={16} />
                  {trip.budget}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {trip.travelWith}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await fetchTrip();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                title="Refresh trip details"
              >
                <Sparkles size={18} />
                Refresh
              </button>

              <button
                onClick={undoLastChange}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <Undo size={18} />
                Undo Last Change
              </button>

              <button
                onClick={downloadPDF}
                disabled={downloadingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Download full trip plan as PDF"
              >
                {downloadingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <polyline points="9 15 12 18 15 15" />
                    </svg>
                    Download Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════ SEASONAL INTELLIGENCE BANNER ══════════ */}
        {trip.seasonalContext && trip.seasonalContext.warningLevel && (
          <div className={`mb-6 p-5 rounded-2xl shadow-md border-l-8 flex flex-col md:flex-row gap-4 items-start md:items-center ${trip.seasonalContext.warningLevel === 'ideal'
            ? 'bg-green-50 border-green-500'
            : trip.seasonalContext.warningLevel === 'avoid'
              ? 'bg-red-50 border-red-500'
              : 'bg-yellow-50 border-yellow-500'
            }`}>
            <div className="text-4xl">
              {trip.seasonalContext.season === 'Summer' ? '☀️'
                : trip.seasonalContext.season === 'Winter' ? '❄️'
                  : trip.seasonalContext.season === 'Monsoon' ? '🌧️'
                    : '🍂'}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-1 ${trip.seasonalContext.warningLevel === 'ideal' ? 'text-green-800'
                : trip.seasonalContext.warningLevel === 'avoid' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                Seasonal Intelligence: {trip.seasonalContext.season} Travel
              </h3>
              <p className="text-gray-700 text-sm md:text-base">
                {trip.seasonalContext.warningMessage}
              </p>

              {/* Flood Risk Banner */}
              {trip.seasonalContext.floodRisk && trip.seasonalContext.season === 'Monsoon' && (
                <div className="mt-3 inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  High Flood Risk Region during Monsoon
                </div>
              )}

              {/* Alternatives for Avoid */}
              {trip.seasonalContext.warningLevel === 'avoid' && trip.seasonalContext.alternatives?.length > 0 && (
                <div className="mt-3 text-sm">
                  <span className="font-semibold text-gray-800">AI Suggested Alternatives: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {trip.seasonalContext.alternatives.map((alt, i) => (
                      <span key={i} className="bg-white px-3 py-1 rounded-full text-gray-700 border border-gray-200 shadow-sm">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden lg:block shrink-0 bg-white/50 px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Activities Optimized for</div>
              <div className="font-bold text-gray-800">{trip.seasonalContext.season}</div>
            </div>
          </div>
        )}

        {/* ══════════ BUDGET BREAKDOWN CARD ══════════ */}
        {trip.budgetBreakdown?.totalBudget > 0 && (() => {
          const bd = trip.budgetBreakdown;
          const alloc = bd.allocated || {};
          const spent = bd.actualSpent || {};
          const total = bd.totalBudget;
          const score = Math.round((bd.satisfactionScore || 0) * 100);
          const util = Math.round((bd.budgetUtilization || 0) * 100);

          const segments = [
            { label: "Stay", emoji: "🏨", alloc: alloc.stay, color: "#6366f1" },
            { label: "Food", emoji: "🍽️", alloc: alloc.food, color: "#f59e0b" },
            { label: "Transport", emoji: "🚗", alloc: alloc.transport, color: "#10b981" },
            { label: "Activities", emoji: "🎯", alloc: alloc.activities, color: "#f43f5e" },
          ];

          return (
            <div style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)",
              borderRadius: 20,
              padding: "24px 28px",
              marginBottom: 24,
              boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
              color: "#fff",
            }}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                    💰 Smart Budget Breakdown
                  </h2>
                  <p style={{ margin: "4px 0 0", opacity: 0.7, fontSize: 13 }}>
                    Total: ₹{total.toLocaleString("en-IN")} &nbsp;·&nbsp; {bd.algorithm === "knapsack" ? "🧠 Knapsack Optimized" : "⚡ Greedy Allocated"}
                  </p>
                </div>

                {/* Satisfaction score ring */}
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 64, height: 64,
                    borderRadius: "50%",
                    background: `conic-gradient(#a5b4fc ${score * 3.6}deg, rgba(255,255,255,0.15) 0deg)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 700,
                  }}>
                    {score}%
                  </div>
                  <p style={{ fontSize: 10, opacity: 0.7, margin: "4px 0 0" }}>Satisfaction</p>
                </div>
              </div>

              {/* Allocation bars */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {segments.map(seg => {
                  const pct = total > 0 ? Math.round((seg.alloc / total) * 100) : 0;
                  return (
                    <div key={seg.label} style={{
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "12px 14px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{seg.emoji} {seg.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>₹{(seg.alloc || 0).toLocaleString("en-IN")}</span>
                      </div>
                      {/* Bar */}
                      <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, height: 6, overflow: "hidden" }}>
                        <div style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: seg.color,
                          borderRadius: 6,
                          transition: "width 0.8s ease",
                        }} />
                      </div>
                      <p style={{ fontSize: 10, opacity: 0.6, margin: "4px 0 0" }}>{pct}% of total</p>
                    </div>
                  );
                })}
              </div>

              {/* Budget utilization footer */}
              {util > 0 && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.8 }}>
                  <span>Budget Utilization: <strong>{util}%</strong></span>
                  {trip.researchMetrics && (
                    <span>
                      Greedy: {Math.round((trip.researchMetrics.greedySatisfaction || 0) * 100)}% →
                      Knapsack: {Math.round((trip.researchMetrics.knapsackSatisfaction || 0) * 100)}% satisfaction
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* PARTNER BUSINESSES BUTTON */}
        {!showPartnerBusinesses && (
          <button
            onClick={() => setShowPartnerBusinesses(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all mb-6 flex items-center justify-center gap-3 font-semibold text-lg"
          >
            <Star className="text-yellow-300" size={24} />
            View Partner Businesses ({allBusinesses.hotels.length + allBusinesses.rentals.length + allBusinesses.tours.length})
          </button>
        )}

        {/* PARTNER BUSINESSES SECTION - REDESIGNED */}
        {showPartnerBusinesses && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Star className="text-yellow-500" size={24} />
                Partner Businesses {allBusinesses.hotels.length + allBusinesses.rentals.length + allBusinesses.tours.length > 0 && `(${allBusinesses.hotels.length + allBusinesses.rentals.length + allBusinesses.tours.length})`}
              </h2>
              <button
                onClick={() => setShowPartnerBusinesses(false)}
                className="text-gray-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {loadingBusinesses ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading businesses...</p>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setActiveBusinessTab('hotels')}
                    className={`px-6 py-3 font-semibold transition-all ${activeBusinessTab === 'hotels'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    🏨 Hotels ({allBusinesses.hotels.length})
                  </button>
                  <button
                    onClick={() => setActiveBusinessTab('rentals')}
                    className={`px-6 py-3 font-semibold transition-all ${activeBusinessTab === 'rentals'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    🚗 Rentals ({allBusinesses.rentals.length})
                  </button>
                  <button
                    onClick={() => setActiveBusinessTab('tours')}
                    className={`px-6 py-3 font-semibold transition-all ${activeBusinessTab === 'tours'
                      ? 'text-green-600 border-b-2 border-green-600 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    ✨ Tours ({allBusinesses.tours.length})
                  </button>
                </div>

                {/* Hotels Tab */}
                {activeBusinessTab === 'hotels' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allBusinesses.hotels.length === 0 ? (
                      <p className="col-span-full text-center text-gray-500 py-8">No hotels available</p>
                    ) : (
                      allBusinesses.hotels.map((hotel) => (
                        <div key={hotel._id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all border border-gray-100">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-gray-800">{hotel.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${hotel.priceRange === 'luxury' ? 'bg-purple-100 text-purple-700' :
                              hotel.priceRange === 'moderate' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                              {hotel.priceRange}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{hotel.description}</p>

                          {hotel.hotelDetails?.rooms && hotel.hotelDetails.rooms.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">From:</p>
                              <p className="text-lg font-bold text-purple-600">
                                ₹{Math.min(...hotel.hotelDetails.rooms.map(r => r.pricePerNight))}/night
                              </p>
                              <p className="text-xs text-gray-500">{hotel.hotelDetails.rooms.length} room type(s)</p>
                            </div>
                          )}

                          {hotel.hotelDetails?.amenities && hotel.hotelDetails.amenities.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-600 flex flex-wrap gap-1">
                                {hotel.hotelDetails.amenities.slice(0, 4).map((amenity, idx) => (
                                  <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-xs">{amenity}</span>
                                ))}
                              </p>
                            </div>
                          )}

                          {hotel.contact?.phone && (
                            <a href={`tel:${hotel.contact.phone}`} className="text-xs text-blue-600 hover:underline block mb-2">
                              📞 {hotel.contact.phone}
                            </a>
                          )}

                          <button
                            onClick={() => handleBookNow({
                              businessId: hotel._id,
                              businessName: hotel.name,
                              bookingType: 'hotel',
                              roomType: hotel.hotelDetails?.rooms?.[0]?.type || 'Room',
                              basePrice: hotel.hotelDetails?.rooms?.[0]?.pricePerNight || hotel.pricePerNight || 0,
                              location: trip.location,
                              suggestedCheckIn: trip.startDate || '',
                              suggestedCheckOut: trip.startDate ? new Date(new Date(trip.startDate).getTime() + trip.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
                            })}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                          >
                            📅 Book Now
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Rentals Tab */}
                {activeBusinessTab === 'rentals' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allBusinesses.rentals.length === 0 ? (
                      <p className="col-span-full text-center text-gray-500 py-8">No rentals available</p>
                    ) : (
                      allBusinesses.rentals.map((rental) => (
                        <div key={rental._id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all border border-gray-100">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-gray-800">{rental.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${rental.priceRange === 'luxury' ? 'bg-purple-100 text-purple-700' :
                              rental.priceRange === 'moderate' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                              {rental.priceRange}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{rental.description}</p>

                          {rental.rentalDetails && (
                            <div className="mb-3 space-y-1">
                              <p className="text-sm"><span className="font-semibold">{rental.rentalDetails.vehicleType}:</span> {rental.rentalDetails.model}</p>
                              <p className="text-sm text-gray-600">Capacity: {rental.rentalDetails.capacity} persons</p>
                              <p className="text-lg font-bold text-orange-600">₹{rental.pricePerDay}/day</p>
                            </div>
                          )}

                          {rental.rentalDetails?.features && rental.rentalDetails.features.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-600 flex flex-wrap gap-1">
                                {rental.rentalDetails.features.slice(0, 3).map((feature, idx) => (
                                  <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-xs">{feature}</span>
                                ))}
                              </p>
                            </div>
                          )}

                          {rental.contact?.phone && (
                            <a href={`tel:${rental.contact.phone}`} className="text-xs text-blue-600 hover:underline block mb-2">
                              📞 {rental.contact.phone}
                            </a>
                          )}

                          <button
                            onClick={() => handleBookNow({
                              businessId: rental._id,
                              businessName: rental.name,
                              bookingType: 'rental',
                              vehicleType: rental.rentalDetails?.vehicleType || 'Vehicle',
                              basePrice: rental.pricePerDay || 0,
                              location: trip.location,
                            })}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                          >
                            🚗 Book Now
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tours Tab */}
                {activeBusinessTab === 'tours' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allBusinesses.tours.length === 0 ? (
                      <p className="col-span-full text-center text-gray-500 py-8">No tours available</p>
                    ) : (
                      allBusinesses.tours.map((tour) => (
                        <div key={tour._id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all border border-gray-100">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-gray-800">{tour.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${tour.priceRange === 'luxury' ? 'bg-purple-100 text-purple-700' :
                              tour.priceRange === 'moderate' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                              {tour.priceRange}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tour.description}</p>

                          {tour.tourDetails && (
                            <div className="mb-3 space-y-1">
                              <p className="text-sm"><span className="font-semibold">{tour.tourDetails.tourType}</span> • {tour.tourDetails.duration}</p>
                              <p className="text-sm text-gray-600">{tour.tourDetails.groupSize}</p>
                              <p className="text-lg font-bold text-green-600">₹{tour.pricePerDay}</p>
                            </div>
                          )}

                          {tour.tourDetails?.includes && tour.tourDetails.includes.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">Includes:</p>
                              <p className="text-xs text-gray-600 flex flex-wrap gap-1">
                                {tour.tourDetails.includes.map((item, idx) => (
                                  <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item}</span>
                                ))}
                              </p>
                            </div>
                          )}

                          {tour.contact?.phone && (
                            <a href={`tel:${tour.contact.phone}`} className="text-xs text-blue-600 hover:underline block mb-2">
                              📞 {tour.contact.phone}
                            </a>
                          )}

                          <button
                            onClick={() => handleBookNow({
                              businessId: tour._id,
                              businessName: tour.name,
                              bookingType: 'tour',
                              tourType: tour.tourDetails?.tourType || 'Tour',
                              basePrice: tour.pricePerDay || 0,
                              location: trip.location,
                            })}
                            className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                          >
                            ✨ Book Now
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* DAY SELECTOR */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex gap-2 md:gap-3 flex-wrap">
            <button
              onClick={() => setSelectedDay(null)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${selectedDay === null
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg border-2 border-orange-600"
                : "bg-white text-white hover:bg-orange-50 border-2 border-gray-300 hover:border-orange-400"
                }`}
            >
              All Days
            </button>

            {trip.itinerary.map(d => (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${selectedDay === d.day
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-gray-500 shadow-lg border-2 border-orange-600"
                  : "bg-white text-white hover:bg-orange-50 border-2 border-gray-300 hover:border-orange-400"
                  }`}
              >
                Day {d.day}
              </button>
            ))}
          </div>
        </div>

        {/* MAP & ITINERARY SPLIT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* MAP SECTION */}
          <div
            className={`bg-white rounded-2xl shadow-lg p-4 h-[600px] flex flex-col transition-all duration-300 ${showRunningLateModal
              ? "pointer-events-none opacity-0 invisible"
              : "opacity-100 visible"
              }`}
          >

            <div className="flex items-center gap-2 mb-3">
              <Navigation className="text-blue-600" size={20} />
              <h2 className="text-xl font-bold text-gray-800">Trip Map</h2>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border-2 border-gray-100">
              <MapContainer center={[20.59, 78.96]} zoom={5} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <AutoFit points={mapPoints} />

                {mapPoints.map((p, i) => (
                  <Marker key={i} position={[p.geo.lat, p.geo.lng]}>
                    <Tooltip>{p.activity}</Tooltip>
                    <Popup>
                      <div className="p-2">
                        <strong className="text-blue-600">{p.activity}</strong>
                        <div className="text-sm text-gray-600 mt-1">
                          Day {p.day} • {p.period}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {mapPoints.length > 1 && (
                  <Polyline
                    positions={mapPoints.map(p => [p.geo.lat, p.geo.lng])}
                    color="#2563eb"
                    weight={3}
                    opacity={0.7}
                  />
                )}
              </MapContainer>
            </div>
          </div>

          {/* ITINERARY SECTION */}
          <div className="bg-white rounded-2xl shadow-lg p-4 h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="text-purple-600" size={20} />
              <h2 className="text-xl font-bold text-gray-800">Itinerary</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
              {trip.itinerary.map(day => (
                <div key={day.day} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-lg">
                      Day {day.day}
                    </span>
                    {isToday(day.day) && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                        TODAY
                      </span>
                    )}
                  </h3>

                  {/* RUNNING LATE BUTTONS (Today Only) */}
                  {isToday(day.day) && (
                    <div className="mb-4 bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border-2 border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-orange-600" size={18} />
                        <h4 className="font-bold text-gray-800">Running Late?</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Adjust your schedule if you're behind</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleRunningLate(15, day.day)}
                          disabled={runningLateLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Clock size={16} />
                          15 min
                        </button>
                        <button
                          onClick={() => handleRunningLate(30, day.day)}
                          disabled={runningLateLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Clock size={16} />
                          30 min
                        </button>
                        <button
                          onClick={() => handleRunningLate(60, day.day)}
                          disabled={runningLateLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Clock size={16} />
                          60 min
                        </button>
                      </div>
                      {runningLateLoading && (
                        <div className="mt-3 flex items-center gap-2 text-orange-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-600 border-t-transparent"></div>
                          <span className="text-sm font-semibold">Adjusting schedule...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* WEATHER CARD */}
                  {trip.weatherData && trip.weatherData.length > 0 && (() => {
                    const dayWeather = trip.weatherData.find(w => w.day === day.day);
                    if (!dayWeather) return null;

                    return (
                      <div className="mb-4 bg-gradient-to-br from-sky-50 to-blue-50 p-3 rounded-xl border-2 border-sky-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                              {getWeatherIcon(dayWeather.condition)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{dayWeather.condition}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Thermometer size={12} />
                                  {dayWeather.temperature}
                                </span>
                                {dayWeather.rainProbability > 20 && (
                                  <span className="flex items-center gap-1">
                                    <Droplets size={12} className="text-blue-500" />
                                    {dayWeather.rainProbability}% rain
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            {getClassificationBadge(dayWeather.classification)}
                          </div>
                        </div>
                        {dayWeather.alerts && dayWeather.alerts.length > 0 && (
                          <div className="mt-2 text-xs text-red-600 flex items-start gap-1">
                            <AlertTriangle size={12} className="mt-0.5" />
                            <span>{dayWeather.alerts.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {["morning", "afternoon", "evening"].map(period => (
                    <div key={period} className="mb-4">
                      <h4 className="flex items-center gap-2 font-semibold text-gray-700 mb-2 capitalize">
                        {getPeriodIcon(period)}
                        {period}
                      </h4>

                      <div className="space-y-2">
                        {day[period].map((a, i) => (
                          <div
                            key={i}
                            className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                          >
                            <p className="font-semibold text-gray-800 mb-1">{a.activity}</p>

                            <p className="text-sm text-gray-600 mb-2">
                              {a.description}
                            </p>

                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                              {a.startTime && (
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {a.startTime}
                                </span>
                              )}

                              {a.duration && (
                                <span className="flex items-center gap-1">
                                  ⏱ {a.duration}
                                </span>
                              )}

                              {a.priority && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold capitalize">
                                  {a.priority}
                                </span>
                              )}

                              {a.status && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold capitalize">
                                  {a.status}
                                </span>
                              )}
                            </div>

                            {a.placeUrl && (
                              <a
                                href={a.placeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-sm text-blue-600 hover:underline"
                              >
                                📍 View on Map
                              </a>
                            )}


                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() =>
                                  setActiveEdit({
                                    day: day.day,
                                    period,
                                    activity: a,
                                  })
                                }
                                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                              >
                                <Replace size={14} />
                                Replace
                              </button>

                              <button
                                onClick={() =>
                                  loadAdditionalSuggestions(day.day, period, a, i)
                                }
                                className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                                title="Get additional nearby activities to add"
                              >
                                <Sparkles size={14} />
                                Add More
                              </button>

                              <button
                                onClick={() => smartAdjust(day.day, period, i)}
                                className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                                title="Get better alternatives for this time slot"
                              >
                                <Wand2 size={14} />
                                Better Options
                              </button>

                              <button
                                onClick={() => deleteActivity(day.day, period, i)}
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                title="Delete this activity"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>

                            {loadingExtras && activeSuggestion?.day === day.day && activeSuggestion?.period === period && activeSuggestion?.activityIndex === i && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <div className="animate-spin h-3 w-3 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                                Finding nearby ideas...
                              </div>
                            )}

                            {extraSuggestions.length > 0 && activeSuggestion?.day === day.day && activeSuggestion?.period === period && activeSuggestion?.activityIndex === i && (
                              <div className="mt-3 border-2 border-purple-200 rounded-lg p-3 bg-purple-50">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-sm font-semibold flex items-center gap-1 text-purple-700">
                                    <Sparkles size={16} />
                                    You might also like
                                  </p>
                                  <button
                                    onClick={() => {
                                      setExtraSuggestions([]);
                                      setActiveSuggestion(null);
                                    }}
                                    className="text-purple-400 hover:text-purple-600 transition-colors"
                                    title="Close suggestions"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  {extraSuggestions.map((s, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-start gap-2 bg-white p-2 rounded-lg"
                                    >
                                      <span className="text-sm flex-1">
                                        <strong className="text-gray-800">{s.activity}</strong>
                                        <span className="text-gray-600"> • {s.reason}</span>
                                      </span>

                                      <button
                                        onClick={() =>
                                          addActivity(day.day, period, s)
                                        }
                                        className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition-colors whitespace-nowrap"
                                      >
                                        <Plus size={12} />
                                        Add
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {loadingSmart && activeSmartSuggestion?.day === day.day && activeSmartSuggestion?.period === period && activeSmartSuggestion?.activityIndex === i && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <div className="animate-spin h-3 w-3 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                                AI is finding smart alternatives...
                              </div>
                            )}

                            {smartSuggestions.length > 0 && activeSmartSuggestion?.day === day.day && activeSmartSuggestion?.period === period && activeSmartSuggestion?.activityIndex === i && (
                              <div className="mt-3 border-2 border-orange-200 rounded-lg p-3 bg-orange-50">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-sm font-semibold flex items-center gap-1 text-orange-700">
                                    <Wand2 size={16} />
                                    Better Alternatives for {period}
                                  </p>
                                  <button
                                    onClick={() => {
                                      setSmartSuggestions([]);
                                      setActiveSmartSuggestion(null);
                                    }}
                                    className="text-orange-400 hover:text-orange-600 transition-colors"
                                    title="Close suggestions"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  {smartSuggestions.map((s, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-start gap-2 bg-white p-2 rounded-lg"
                                    >
                                      <span className="text-sm flex-1">
                                        <strong className="text-gray-800">{s.activity}</strong>
                                        {s.type && <span className="text-orange-600 text-xs ml-1">[{s.type}]</span>}
                                        <span className="text-gray-600"> • {s.reason}</span>
                                      </span>

                                      <button
                                        onClick={() =>
                                          addActivity(day.day, period, s)
                                        }
                                        className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition-colors whitespace-nowrap"
                                      >
                                        <Plus size={12} />
                                        Add
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* TRAVEL CONNECTOR UI */}
                            {a.travelToNext && i < day[period].length - 1 && (
                              <div className="flex flex-col items-center my-2 select-none relative z-10 w-full" style={{ minHeight: "40px" }}>
                                <div className="w-1 h-3 bg-blue-200 rounded-full mb-1"></div>
                                <div className="bg-white border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                                  <span className="text-sm">{a.travelToNext.icon}</span>
                                  <span>{a.travelToNext.mode}</span>
                                  <span className="text-gray-400 mx-0.5">•</span>
                                  <span>{a.travelToNext.time}</span>
                                  <span className="text-gray-400 mx-0.5">•</span>
                                  <span className="text-gray-500 font-medium">{a.travelToNext.distance}</span>
                                </div>
                                <div className="w-1 h-3 bg-blue-200 rounded-full mt-1"></div>
                              </div>
                            )}

                            {a.travelToNext && i === day[period].length - 1 && (() => {
                              // Determine if there is a next period on this day
                              const hasNextPeriod = (period === 'morning' && (day.afternoon.length > 0 || day.evening.length > 0)) ||
                                (period === 'afternoon' && day.evening.length > 0);

                              if (!hasNextPeriod) return null;

                              return (
                                <div className="flex flex-col items-center my-2 select-none relative z-10 w-full" style={{ minHeight: "40px" }}>
                                  <div className="w-1 h-3 bg-indigo-200 rounded-full mb-1"></div>
                                  <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                                    <span className="text-sm">{a.travelToNext.icon}</span>
                                    <span>{a.travelToNext.mode}</span>
                                    <span className="text-gray-400 mx-0.5">•</span>
                                    <span>{a.travelToNext.time}</span>
                                    <span className="text-gray-400 mx-0.5">•</span>
                                    <span className="text-gray-500 font-medium">{a.travelToNext.distance}</span>
                                  </div>
                                  <div className="w-1 h-3 bg-indigo-200 rounded-full mt-1"></div>
                                </div>
                              )
                            })()}

                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* -------- REPLACE MODAL -------- */}
      {activeEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Replace Activity
              </h2>
              <button
                onClick={() => setActiveEdit(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="font-semibold text-blue-900">{activeEdit.activity.activity}</p>
              <p className="text-sm text-blue-700">Day {activeEdit.day} • {activeEdit.period}</p>
            </div>

            {loadingAI ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">AI is finding the best alternatives...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => replaceActivity("similar nearby")}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:shadow-lg"
                >
                  🎯 Similar Nearby
                </button>
                <button
                  onClick={() => replaceActivity("more food focused")}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:shadow-lg"
                >
                  🍽️ More Food Focused
                </button>
                <button
                  onClick={() => replaceActivity("less crowded")}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 hover:shadow-lg"
                >
                  🌿 Less Crowded
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveEdit(null)}
              className="mt-4 w-full text-center text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes zoom-in {
          from {
            transform: scale(0.95);
          }
          to {
            transform: scale(1);
          }
        }
        .animate-in {
          animation: fade-in 0.3s ease-out, zoom-in 0.3s ease-out;
        }
      `}</style>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedBooking(null);
        }}
        onSubmit={handleBookingSubmit}
        booking={selectedBooking}
      />

      {/* Running Late Changes Modal - Centered */}
      {showRunningLateModal && runningLateResult && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowRunningLateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="text-white" size={28} />
                  <h2 className="text-2xl font-bold text-white">Schedule Adjusted</h2>
                </div>
                <button
                  onClick={() => setShowRunningLateModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* AI Explanation */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border-2 border-purple-200 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">AI Explanation:</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {runningLateResult.changes.ai_explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl text-center border-2 border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {runningLateResult.changes.moved_count}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">Moved</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl text-center border-2 border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {runningLateResult.changes.compressed_count}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">Shortened</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl text-center border-2 border-red-200">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {runningLateResult.changes.removed_count}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">Removed</div>
                </div>
              </div>

              {/* Changed Activities List */}
              {runningLateResult.changes.adjusted_activities.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Replace size={18} />
                    Changes Made:
                  </h3>
                  <div className="space-y-2">
                    {runningLateResult.changes.adjusted_activities.map((change, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-l-4 ${change.change_type === 'moved'
                          ? 'bg-blue-50 border-blue-500'
                          : change.change_type === 'compressed'
                            ? 'bg-orange-50 border-orange-500'
                            : 'bg-red-50 border-red-500'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 mb-1">
                              {change.activity_name || 'Activity'}
                            </div>
                            {change.change_type === 'moved' && (
                              <div className="text-sm text-gray-600">
                                <Clock size={14} className="inline mr-1" />
                                {change.old_start_time} → {change.new_start_time}
                              </div>
                            )}
                            {change.change_type === 'compressed' && (
                              <div className="text-sm text-gray-600">
                                Duration: {change.old_duration} min → {change.new_duration} min
                              </div>
                            )}
                            {change.change_type === 'removed' && (
                              <div className="text-sm text-gray-600">
                                {change.reason}
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded uppercase flex-shrink-0 ${change.change_type === 'moved'
                              ? 'bg-blue-200 text-blue-800'
                              : change.change_type === 'compressed'
                                ? 'bg-orange-200 text-orange-800'
                                : 'bg-red-200 text-red-800'
                              }`}
                          >
                            {change.change_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleUndoRunningLate}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Undo size={18} />
                  Undo
                </button>
                <button
                  onClick={() => setShowRunningLateModal(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes zoom-in {
          from {
            transform: scale(0.95);
          }
          to {
            transform: scale(1);
          }
        }
        .animate-in {
          animation: fade-in 0.3s ease-out, zoom-in 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default ViewTrip;
