import React, { useState, useEffect } from "react";
import api from "../utils/api";
import "../styles/ManageBookings.css";
import PaymentModal from "../components/PaymentModal";

function UserBookings() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0,
    });

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [filter, bookings]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await api.get("/bookings/my-bookings");

            if (res.data.success) {
                const allBookings = res.data.data || [];
                setBookings(allBookings);

                // Calculate stats
                const newStats = {
                    total: allBookings.length,
                    pending: allBookings.filter(b => b.status === "pending").length,
                    confirmed: allBookings.filter(b => b.status === "confirmed").length,
                    cancelled: allBookings.filter(b => b.status === "cancelled").length,
                    completed: allBookings.filter(b => b.status === "completed").length,
                };
                setStats(newStats);
            }
        } catch (err) {
            console.error("Error fetching my bookings:", err);
            alert(err.response?.data?.message || "Failed to fetch bookings");
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        if (filter === "all") {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter(b => b.status === filter));
        }
    };

    const handlePaymentSuccess = async (bookingId) => {
        try {
            const res = await api.patch(`/bookings/${bookingId}/pay`);
            if (res.data.success) {
                // Update local list without refreshing
                const updatedBookings = bookings.map(b =>
                    b._id === bookingId ? { ...b, status: 'completed', paymentStatus: 'paid' } : b
                );
                setBookings(updatedBookings);
                applyFilter(); // re-apply filter to push it out of "confirmed" if they are viewing the Confirmed tab
                setSelectedBooking(null);

                // Fetch stats again silently to keep count accurate
                fetchBookings();
            }
        } catch (err) {
            console.error("Payment sync failed:", err);
            alert("Payment was somewhat successful, but could not sync with the server. Please check your bookings tab again.");
            setSelectedBooking(null);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "pending":
                return "status-pending";
            case "confirmed":
                return "status-confirmed";
            case "cancelled":
                return "status-cancelled";
            case "completed":
                return "status-completed";
            default:
                return "";
        }
    };

    if (loading) {
        return (
            <div className="manage-bookings-loading">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Loading your upcoming trips...</p>
            </div>
        );
    }

    return (
        <div className="manage-bookings-container">
            <div className="manage-bookings-header">
                <h2>
                    <i className="fa-solid fa-calendar-check"></i> My Trips & Bookings
                </h2>
                <p className="subtitle">View the status of your travel requests</p>
            </div>

            {/* Stats Overview */}
            <div className="booking-stats">
                <div className="stat-card">
                    <i className="fa-solid fa-list"></i>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total</span>
                    </div>
                </div>
                <div className="stat-card pending">
                    <i className="fa-solid fa-clock"></i>
                    <div className="stat-info">
                        <span className="stat-value">{stats.pending}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
                <div className="stat-card confirmed">
                    <i className="fa-solid fa-check-circle"></i>
                    <div className="stat-info">
                        <span className="stat-value">{stats.confirmed}</span>
                        <span className="stat-label">Confirmed</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={filter === "all" ? "active" : ""}
                    onClick={() => setFilter("all")}
                >
                    All ({stats.total})
                </button>
                <button
                    className={filter === "pending" ? "active" : ""}
                    onClick={() => setFilter("pending")}
                >
                    Pending ({stats.pending})
                </button>
                <button
                    className={filter === "confirmed" ? "active" : ""}
                    onClick={() => setFilter("confirmed")}
                >
                    Confirmed ({stats.confirmed})
                </button>
                <button
                    className={filter === "cancelled" ? "active" : ""}
                    onClick={() => setFilter("cancelled")}
                >
                    Cancelled ({stats.cancelled})
                </button>
            </div>

            {/* Bookings List */}
            <div className="bookings-list">
                {filteredBookings.length === 0 ? (
                    <div className="no-bookings">
                        <i className="fa-solid fa-inbox"></i>
                        <p>No bookings found</p>
                    </div>
                ) : (
                    filteredBookings.map((booking) => (
                        <div key={booking._id} className="booking-card">
                            <div className="booking-header">
                                <div className="business-info">
                                    <h3>{booking.businessId?.name || "Unknown Business"}</h3>
                                    <span className="business-type">
                                        <i className={`fa-solid fa-${booking.bookingType === 'hotel' ? 'hotel' : booking.bookingType === 'rental' ? 'car' : 'route'}`}></i>
                                        {booking.bookingType}
                                    </span>
                                </div>
                                <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>

                            <div className="booking-details">
                                <div className="detail-row">
                                    <i className="fa-solid fa-calendar"></i>
                                    <div>
                                        <strong>Dates:</strong> {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                                        <br />
                                    </div>
                                </div>

                                {booking.bookingType === "hotel" && (
                                    <div className="detail-row">
                                        <i className="fa-solid fa-bed"></i>
                                        <div>
                                            <strong>Room:</strong> {booking.roomType || "N/A"}
                                            <br />
                                            <small>{booking.guests || 0} guests</small>
                                        </div>
                                    </div>
                                )}

                                {booking.bookingType === "rental" && (
                                    <div className="detail-row">
                                        <i className="fa-solid fa-location-dot"></i>
                                        <div>
                                            <strong>Pickup:</strong> {booking.pickupLocation || "N/A"}
                                            <br />
                                            <small>Return: {booking.returnLocation || "N/A"}</small>
                                        </div>
                                    </div>
                                )}

                                {booking.bookingType === "tour" && booking.participants && (
                                    <div className="detail-row">
                                        <i className="fa-solid fa-users"></i>
                                        <div>
                                            <strong>Participants:</strong> {booking.participants}
                                            <br />
                                            <small>Day {booking.tourDay || "N/A"}</small>
                                        </div>
                                    </div>
                                )}

                                <div className="detail-row">
                                    <i className="fa-solid fa-dollar-sign"></i>
                                    <div>
                                        <strong>Total Price:</strong> ₹{booking.totalPrice?.toLocaleString() || 0}
                                    </div>
                                </div>
                            </div>

                            {booking.status === "cancelled" && booking.cancellationReason && (
                                <div className="detail-row" style={{ color: 'red', marginTop: '10px' }}>
                                    <i className="fa-solid fa-triangle-exclamation"></i>
                                    <div>
                                        <strong>Rejection Reason:</strong> {booking.cancellationReason}
                                    </div>
                                </div>
                            )}

                            <div className="booking-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <small>
                                    <i className="fa-solid fa-clock"></i> Requested on {formatDate(booking.createdAt)}
                                </small>

                                {booking.status === "confirmed" && (
                                    <button
                                        className="pay-now-btn"
                                        onClick={() => setSelectedBooking(booking)}
                                        style={{
                                            backgroundColor: '#22c55e',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: '0 4px 6px rgba(34, 197, 94, 0.2)',
                                            transition: 'transform 0.2s',
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <i className="fa-solid fa-credit-card"></i> Pay Now
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <PaymentModal
                isOpen={!!selectedBooking}
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}

export default UserBookings;
