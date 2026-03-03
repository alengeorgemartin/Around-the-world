import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/UserTrips.css";

const UserTrips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await api.get("/my-trips");
        setTrips(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleViewTrip = (tripId) => {
    navigate(`/trip/${tripId}`);
  };

  const handleDeleteTrip = async (tripId, tripLocation) => {
    if (!window.confirm(`Delete trip to ${tripLocation}?`)) return;

    try {
      await api.delete(`/trip/${tripId}`);
      setTrips(trips.filter(trip => trip._id !== tripId));
      showNotification(`Trip to ${tripLocation} deleted successfully!`);
    } catch (err) {
      console.error("Error deleting trip:", err);
      alert("Failed to delete trip");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your trips...</p>
      </div>
    );
  }

  return (
    <div className="trips-page">
      {/* Notification */}
      {notification && (
        <div className="notification">
          <i className="fa-solid fa-circle-check"></i>
          {notification}
        </div>
      )}

      <div className="container">
        <h1 className="big-title">My Trips</h1>

        {/* Empty State */}
        {trips.length === 0 && (
          <div className="empty-state">
            <i className="fa-solid fa-suitcase"></i>
            <h3>No trips yet</h3>
            <p>Start planning your dream adventure</p>
            <button onClick={() => navigate("/create-trip")} className="create-btn">
              <i className="fa-solid fa-plus"></i> Create Your First Trip
            </button>
          </div>
        )}

        {/* Trips Grid */}
        {trips.length > 0 && (
          <>
            <div className="trips-header">
              <div>
                <h2>{trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}</h2>
                <p className="subtitle">Your travel collection</p>
              </div>
              <button onClick={() => navigate("/create-trip")} className="new-trip-btn">
                <i className="fa-solid fa-plus"></i> New Trip
              </button>
            </div>

            <div className="card-row">
              {trips.map((trip) => (
                <div className="trip-card" key={trip._id}>
                  <div className="trip-header">
                    <div className="trip-icon">
                      <i className="fa-solid fa-location-dot"></i>
                    </div>
                    <span className="trip-days">{trip.days} {trip.days === 1 ? 'Day' : 'Days'}</span>
                  </div>

                  <h3 className="trip-title">{trip.location}</h3>

                  {trip.startDate && (
                    <p className="trip-date">
                      <i className="fa-regular fa-calendar"></i>
                      {new Date(trip.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  )}

                  <div className="trip-details">
                    <div className="detail-item">
                      <i className="fa-solid fa-dollar-sign"></i>
                      <span>{trip.budget}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fa-solid fa-users"></i>
                      <span>{trip.travelWith}</span>
                    </div>
                  </div>

                  {trip.preferences && trip.preferences.length > 0 && (
                    <div className="trip-tags">
                      {trip.preferences.slice(0, 2).map((pref, idx) => (
                        <span key={idx} className="tag">{pref}</span>
                      ))}
                      {trip.preferences.length > 2 && (
                        <span className="tag tag-more">+{trip.preferences.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div className="trip-actions">
                    <button onClick={() => handleViewTrip(trip._id)} className="view-btn">
                      <i className="fa-solid fa-eye"></i> View Trip
                    </button>
                    <button onClick={() => handleDeleteTrip(trip._id, trip.location)} className="delete-btn">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserTrips;
