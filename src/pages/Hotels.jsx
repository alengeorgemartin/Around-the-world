import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Hotels.css";

const Hotels = () => {
    const navigate = useNavigate();
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch hotels from backend
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                setLoading(true);
                // Fetch from Munnar (or make it dynamic later)
                const res = await api.get('/businesses/Munnar');
                if (res.data.success) {
                    setHotels(res.data.data.hotels || []);
                }
            } catch (error) {
                console.error('Error fetching hotels:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);

    const [filter, setFilter] = useState("All");
    const categories = ["All", "budget", "moderate", "luxury"];

    const filteredHotels = filter === "All"
        ? hotels
        : hotels.filter(hotel => hotel.priceRange === filter);

    return (
        <>
            <div className="container">
                <h1 className="big-title">Premium Hotels</h1>
                <p className="hotels-subtitle">Book your perfect stay at the finest hotels</p>

                {/* Filter Tabs */}
                <div className="category-bar">
                    {categories.map((cat) => (
                        <div
                            key={cat}
                            className={`category ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            <i className={`fa-solid ${cat === 'All' ? 'fa-th-large' :
                                cat === 'Luxury' ? 'fa-gem' :
                                    cat === 'Resort' ? 'fa-umbrella-beach' :
                                        cat === 'Business' ? 'fa-briefcase' :
                                            'fa-water'
                                }`}></i>
                            {cat}
                        </div>
                    ))}
                </div>

                {/* Hotels Grid */}
                <div className="hotels-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                            <p>Loading hotels...</p>
                        </div>
                    ) : filteredHotels.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                            <p>No hotels found</p>
                        </div>
                    ) : (
                        filteredHotels.map((hotel) => (
                            <div className="hotel-card" key={hotel._id}>
                                <div className="hotel-image-container">
                                    <img
                                        src={hotel.photos?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80`}
                                        alt={hotel.name}
                                    />
                                    <span className="hotel-badge">{hotel.priceRange}</span>
                                    {hotel.hotelDetails?.rooms && hotel.hotelDetails.rooms.length > 0 && (
                                        <div className="hotel-discount">
                                            {hotel.hotelDetails.rooms.length} room types
                                        </div>
                                    )}
                                </div>

                                <div className="hotel-content">
                                    <h3 className="hotel-title">{hotel.name}</h3>

                                    <div className="hotel-location">
                                        <i className="fa-solid fa-location-dot"></i>
                                        {hotel.location.city}, {hotel.location.state}
                                    </div>

                                    <div className="hotel-rating">
                                        <i className="fa-solid fa-star"></i>
                                        <span className="rating-value">{hotel.stats?.averageRating || 0}</span>
                                        <span className="rating-count">({hotel.stats?.reviewCount || 0} reviews)</span>
                                    </div>

                                    <div className="hotel-amenities">
                                        {hotel.hotelDetails?.amenities?.slice(0, 4).map((amenity, idx) => (
                                            <span key={idx} className="amenity-badge">
                                                <i className="fa-solid fa-check"></i> {amenity}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="hotel-rooms">
                                        <i className="fa-solid fa-door-open"></i>
                                        {hotel.hotelDetails?.rooms?.length || 0} room type(s)
                                    </div>

                                    <div className="hotel-price-row">
                                        <div className="hotel-pricing">
                                            {hotel.hotelDetails?.rooms && hotel.hotelDetails.rooms.length > 0 && (
                                                <>
                                                    <span className="current-price">₹{Math.min(...hotel.hotelDetails.rooms.map(r => r.pricePerNight))}</span>
                                                    <span className="price-label">per night</span>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            className="view-details-btn"
                                            onClick={() => setSelectedHotel(hotel)}
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
            {selectedHotel && (
                <div className="modal-overlay" onClick={() => setSelectedHotel(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedHotel(null)}>
                            <i className="fa-solid fa-times"></i>
                        </button>

                        <img
                            src={selectedHotel.photos?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80`}
                            alt={selectedHotel.name}
                            className="modal-image"
                        />

                        <div className="modal-body">
                            <span className="modal-badge">{selectedHotel.priceRange}</span>
                            <h2>{selectedHotel.name}</h2>

                            <div className="modal-meta">
                                <span><i className="fa-solid fa-location-dot"></i> {selectedHotel.location.city}, {selectedHotel.location.state}</span>
                                <span><i className="fa-solid fa-star"></i> {selectedHotel.stats?.averageRating || 0} ({selectedHotel.stats?.reviewCount || 0})</span>
                                <span><i className="fa-solid fa-door-open"></i> {selectedHotel.hotelDetails?.rooms?.length || 0} room types</span>
                            </div>

                            <p className="modal-description">{selectedHotel.description}</p>

                            <div className="modal-section">
                                <h3><i className="fa-solid fa-concierge-bell"></i> Amenities</h3>
                                <div className="amenities-grid">
                                    {selectedHotel.hotelDetails?.amenities?.map((amenity, idx) => (
                                        <div key={idx} className="amenity-item">
                                            <i className="fa-solid fa-check-circle"></i>
                                            {amenity}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <div className="modal-pricing">
                                    {selectedHotel.hotelDetails?.rooms && selectedHotel.hotelDetails.rooms.length > 0 && (
                                        <>
                                            <span className="modal-current-price">₹{Math.min(...selectedHotel.hotelDetails.rooms.map(r => r.pricePerNight))}</span>
                                            <span className="modal-price-label">per night</span>
                                        </>
                                    )}
                                </div>
                                <button className="book-now-btn">
                                    <i className="fa-solid fa-hotel"></i>
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

export default Hotels;
