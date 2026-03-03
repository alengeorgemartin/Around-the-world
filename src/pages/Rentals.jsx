import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Rentals.css";

const Rentals = () => {
    const navigate = useNavigate();
    const [selectedRental, setSelectedRental] = useState(null);
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch rentals from backend
    useEffect(() => {
        const fetchRentals = async () => {
            try {
                setLoading(true);
                const res = await api.get('/businesses/Munnar');
                if (res.data.success) {
                    setRentals(res.data.data.rentals || []);
                }
            } catch (error) {
                console.error('Error fetching rentals:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRentals();
    }, []);

    const [filter, setFilter] = useState("All");
    const categories = ["All", "budget", "moderate", "luxury"];

    const filteredRentals = filter === "All"
        ? rentals
        : rentals.filter(rental => rental.priceRange === filter);

    return (
        <>
            <div className="container">
                <h1 className="big-title">Vehicle Rentals</h1>
                <p className="rentals-subtitle">Find the perfect ride for your journey</p>

                {/* Filter Tabs */}
                <div className="category-bar">
                    {categories.map((cat) => (
                        <div
                            key={cat}
                            className={`category ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            <i className={`fa-solid ${cat === 'All' ? 'fa-th-large' :
                                cat === 'SUV' ? 'fa-truck' :
                                    cat === 'Sedan' ? 'fa-car' :
                                        cat === 'MUV' ? 'fa-van-shuttle' :
                                            cat === 'Hatchback' ? 'fa-car-side' :
                                                'fa-gem'
                                }`}></i>
                            {cat}
                        </div>
                    ))}
                </div>

                {/* Rentals Grid */}
                <div className="rentals-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                            <p>Loading rentals...</p>
                        </div>
                    ) : filteredRentals.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                            <p>No rentals found</p>
                        </div>
                    ) : (
                        filteredRentals.map((rental) => (
                            <div className="rental-card" key={rental._id}>
                                <div className="rental-image-container">
                                    <img
                                        src={rental.photos?.[0] || `https://images.unsplash.com/photo-1549317661-eb55f55e51fa?auto=format&fit=crop&w=600&q=80`}
                                        alt={rental.name}
                                    />
                                    <span className="rental-badge">{rental.priceRange}</span>
                                </div>

                                <div className="rental-content">
                                    <h3 className="rental-title">{rental.name}</h3>

                                    <div className="rental-specs">
                                        <span><i className="fa-solid fa-users"></i> {rental.rentalDetails?.capacity || 0} Seats</span>
                                        <span><i className="fa-solid fa-car"></i> {rental.rentalDetails?.vehicleType}</span>
                                        <span><i className="fa-solid fa-tag"></i> {rental.rentalDetails?.model}</span>
                                    </div>

                                    <div className="rental-rating">
                                        <i className="fa-solid fa-star"></i>
                                        <span className="rating-value">{rental.stats?.averageRating || 0}</span>
                                        <span className="rating-count">({rental.stats?.reviewCount || 0} reviews)</span>
                                    </div>

                                    <div className="rental-features">
                                        {rental.rentalDetails?.features?.slice(0, 3).map((feature, idx) => (
                                            <span key={idx} className="feature-badge">
                                                <i className="fa-solid fa-check"></i> {feature}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="rental-price-row">
                                        <div className="rental-pricing">
                                            <span className="current-price">₹{rental.pricePerDay}</span>
                                            <span className="price-label">per day</span>
                                        </div>
                                        <button
                                            className="view-details-btn"
                                            onClick={() => setSelectedRental(rental)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedRental && (
                <div className="modal-overlay" onClick={() => setSelectedRental(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedRental(null)}>
                            <i className="fa-solid fa-times"></i>
                        </button>

                        <img
                            src={`https://images.unsplash.com/photo-${selectedRental.image}?auto=format&fit=crop&w=800&q=80`}
                            alt={selectedRental.name}
                            className="modal-image"
                        />

                        <div className="modal-body">
                            <span className="modal-badge">{selectedRental.priceRange}</span>
                            <h2>{selectedRental.name}</h2>

                            <div className="modal-meta">
                                <span><i className="fa-solid fa-location-dot"></i> {selectedRental.location?.city}, {selectedRental.location?.state}</span>
                                <span><i className="fa-solid fa-users"></i> {selectedRental.rentalDetails?.capacity} Seats</span>
                                <span><i className="fa-solid fa-star"></i> {selectedRental.stats?.averageRating || 0} ({selectedRental.stats?.reviewCount || 0})</span>
                            </div>

                            <p className="modal-description">{selectedRental.description}</p>

                            <div className="modal-section">
                                <h3><i className="fa-solid fa-cog"></i> Specifications</h3>
                                <div className="specs-grid">
                                    <div className="spec-item">
                                        <i className="fa-solid fa-car"></i>
                                        <span>{selectedRental.rentalDetails?.vehicleType}</span>
                                    </div>
                                    <div className="spec-item">
                                        <i className="fa-solid fa-tag"></i>
                                        <span>{selectedRental.rentalDetails?.model}</span>
                                    </div>
                                    <div className="spec-item">
                                        <i className="fa-solid fa-users"></i>
                                        <span>{selectedRental.rentalDetails?.capacity} Seater</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3><i className="fa-solid fa-list-check"></i> Features</h3>
                                <div className="features-grid">
                                    {selectedRental.rentalDetails?.features?.map((feature, idx) => (
                                        <div key={idx} className="feature-item">
                                            <i className="fa-solid fa-check-circle"></i>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <div className="modal-pricing">
                                    <span className="modal-current-price">₹{selectedRental.pricePerDay}</span>
                                    <span className="modal-price-label">per day</span>
                                </div>
                                <button className="book-now-btn">
                                    <i className="fa-solid fa-car"></i>
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Rentals;
