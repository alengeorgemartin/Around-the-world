import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Hotels.css";
import {
    Search,
    MapPin,
    Star,
    Heart,
    ChevronLeft,
    Check,
    Wifi,
    Coffee,
    Wind,
    Tv,
    Car,
    Utensils
} from "lucide-react";

// --- Helper Functions ---
const getIconForAmenity = (amenityStr) => {
    const lower = amenityStr.toLowerCase();
    if (lower.includes("wifi") || lower.includes("internet")) return <Wifi size={20} />;
    if (lower.includes("breakfast") || lower.includes("coffee")) return <Coffee size={20} />;
    if (lower.includes("ac") || lower.includes("air condition")) return <Wind size={20} />;
    if (lower.includes("tv")) return <Tv size={20} />;
    if (lower.includes("parking")) return <Car size={20} />;
    if (lower.includes("restaurant") || lower.includes("dining")) return <Utensils size={20} />;
    return <Check size={20} />;
};

const Hotels = () => {
    const navigate = useNavigate();
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [likes, setLikes] = useState({});

    // --- Search Bar State ---
    const [searchQuery, setSearchQuery] = useState({
        destination: "",
        checkIn: "",
        checkOut: "",
        guests: "2 guests"
    });

    // Fetch hotels from backend
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                setLoading(true);
                // Currently fetching Munnar statically as in original implementation
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

    const toggleLike = (e, id) => {
        e.stopPropagation();
        setLikes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Search Submission ---
    const handleSearch = async () => {
        const queryDestination = searchQuery.destination.trim();
        if (!queryDestination) {
            // Default back to Munnar if empty
            const res = await api.get('/businesses/Munnar');
            if (res.data.success) {
                setHotels(res.data.data.hotels || []);
            }
            return;
        }

        try {
            setLoading(true);
            const res = await api.get(`/businesses/${queryDestination}`);
            if (res.data.success) {
                setHotels(res.data.data.hotels || []);
            } else {
                setHotels([]);
            }
        } catch (error) {
            console.error('Error searching hotels:', error);
            setHotels([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="hotels-page-wrapper">
            {/* HERO & SEARCH BAR */}
            <div className="hotels-hero">
                <h1 className="hero-title">Find your next stay</h1>
                <p className="hero-subtitle">Search low prices on hotels, homes and much more...</p>

                <div className="search-bar-container">
                    <div className="search-field">
                        <span className="search-label">Where</span>
                        <input
                            type="text"
                            className="search-input-real"
                            placeholder="Search destinations"
                            value={searchQuery.destination}
                            onChange={(e) => setSearchQuery({ ...searchQuery, destination: e.target.value })}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div className="search-field">
                        <span className="search-label">Check in</span>
                        <input
                            type="date"
                            className="search-input-real"
                            value={searchQuery.checkIn}
                            onChange={(e) => setSearchQuery({ ...searchQuery, checkIn: e.target.value })}
                        />
                    </div>
                    <div className="search-field">
                        <span className="search-label">Check out</span>
                        <input
                            type="date"
                            className="search-input-real"
                            value={searchQuery.checkOut}
                            onChange={(e) => setSearchQuery({ ...searchQuery, checkOut: e.target.value })}
                        />
                    </div>
                    <div className="search-field">
                        <span className="search-label">Who</span>
                        <select
                            className="search-input-real"
                            value={searchQuery.guests}
                            onChange={(e) => setSearchQuery({ ...searchQuery, guests: e.target.value })}
                        >
                            <option>1 guest</option>
                            <option>2 guests</option>
                            <option>3 guests</option>
                            <option>4+ guests</option>
                        </select>
                    </div>
                    <button className="search-button" onClick={handleSearch}>
                        <Search fill="white" size={20} />
                    </button>
                </div>
            </div>

            <div className="container">
                {/* Filter Tabs */}
                <div className="category-bar">
                    {categories.map((cat) => (
                        <div
                            key={cat}
                            className={`category ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            <span style={{ textTransform: 'capitalize' }}>
                                {cat === 'All' ? 'All Stays' : cat}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Hotels Grid */}
                <div className="hotels-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: '#717171' }}>Loading amazing stays...</p>
                        </div>
                    ) : filteredHotels.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: '#717171' }}>No stays found</p>
                        </div>
                    ) : (
                        filteredHotels.map((hotel) => (
                            <div className="hotel-card" key={hotel._id} onClick={() => setSelectedHotel(hotel)}>
                                <div className="hotel-image-container">
                                    <img
                                        src={hotel.photos?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80`}
                                        alt={hotel.name}
                                    />
                                    <span className="hotel-badge-floating" style={{ textTransform: 'capitalize' }}>
                                        {hotel.priceRange}
                                    </span>
                                    <button
                                        className={`heart-button ${likes[hotel._id] ? 'liked' : ''}`}
                                        onClick={(e) => toggleLike(e, hotel._id)}
                                    >
                                        <Heart
                                            size={24}
                                            fill={likes[hotel._id] ? "#ff385c" : "rgba(0,0,0,0.5)"}
                                            color={likes[hotel._id] ? "#ff385c" : "white"}
                                            strokeWidth={2}
                                        />
                                    </button>
                                </div>

                                <div className="hotel-content">
                                    <div className="hotel-header-row">
                                        <h3 className="hotel-title">{hotel.name}</h3>
                                        <div className="hotel-rating-modern">
                                            <Star size={14} />
                                            <span>{hotel.stats?.averageRating || "New"}</span>
                                        </div>
                                    </div>

                                    <div className="hotel-location-text">
                                        {hotel.location?.city}, {hotel.location?.state}
                                    </div>

                                    <div className="hotel-amenities-text">
                                        {hotel.hotelDetails?.rooms?.length || 0} room types · {hotel.hotelDetails?.amenities?.[0] || 'Good view'}
                                    </div>

                                    <div className="hotel-price-modern">
                                        {hotel.hotelDetails?.rooms && hotel.hotelDetails.rooms.length > 0 ? (
                                            <>
                                                <span className="price-val">₹{Math.min(...hotel.hotelDetails.rooms.map(r => r.pricePerNight))}</span>
                                                <span className="price-label-modern"> night</span>
                                            </>
                                        ) : (
                                            <span className="price-label-modern">View for prices</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* DETAIL MODAL - Modern Popup */}
            {selectedHotel && (
                <div className="modal-overlay" onClick={() => setSelectedHotel(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-modern" onClick={() => setSelectedHotel(null)}>
                            <ChevronLeft size={24} />
                        </button>

                        <img
                            src={selectedHotel.photos?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80`}
                            alt={selectedHotel.name}
                            className="modal-image-hero"
                        />

                        <div className="modal-body-wrapper">
                            <div className="modal-title-row">
                                <h2>{selectedHotel.name}</h2>
                                <div className="modal-location">
                                    {selectedHotel.location?.city}, {selectedHotel.location?.state} · {selectedHotel.stats?.reviewCount || 0} reviews
                                </div>
                            </div>

                            <div className="modal-divider" />

                            <div className="modal-host-row">
                                <div className="modal-host-avatar">
                                    <MapPin size={24} />
                                </div>
                                <div className="modal-host-text">
                                    <h4>Premium Listing</h4>
                                    <p>Verified Partner Property</p>
                                </div>
                            </div>

                            <div className="modal-divider" />

                            <p className="modal-description">{selectedHotel.description}</p>

                            <div className="modal-divider" />

                            <div className="modal-amenities">
                                <h3>What this place offers</h3>
                                <div className="modal-amenities-grid">
                                    {selectedHotel.hotelDetails?.amenities?.map((amenity, idx) => (
                                        <div key={idx} className="amenity-row">
                                            {getIconForAmenity(amenity)}
                                            <span>{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Bottom Bar for Reservation */}
                        <div className="modal-bottom-bar">
                            <div className="modal-price-block">
                                {selectedHotel.hotelDetails?.rooms && selectedHotel.hotelDetails.rooms.length > 0 ? (
                                    <>
                                        <div>
                                            <span className="modal-price-val">₹{Math.min(...selectedHotel.hotelDetails.rooms.map(r => r.pricePerNight))}</span>
                                            <span style={{ color: '#1a1a1a', fontWeight: '400' }}> night</span>
                                        </div>
                                        <span className="modal-price-sub">Total before taxes</span>
                                    </>
                                ) : (
                                    <span className="modal-price-val">Contact property</span>
                                )}
                            </div>
                            <button className="reserve-btn">
                                Reserve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Hotels;
