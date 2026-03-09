import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Rentals.css";
import {
    Search,
    MapPin,
    Star,
    Heart,
    ChevronLeft,
    Check,
    Users,
    Car,
    Settings,
    Briefcase,
    Zap,
    SlidersHorizontal
} from "lucide-react";

// --- Helper Functions ---
const getIconForFeature = (featureStr) => {
    const lower = featureStr.toLowerCase();
    if (lower.includes("seat")) return <Users size={20} />;
    if (lower.includes("auto") || lower.includes("manual")) return <Settings size={20} />;
    if (lower.includes("bag") || lower.includes("luggage")) return <Briefcase size={20} />;
    if (lower.includes("electric") || lower.includes("ev")) return <Zap size={20} />;
    return <Check size={20} />;
};

const Rentals = () => {
    const navigate = useNavigate();
    const [selectedRental, setSelectedRental] = useState(null);
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [likes, setLikes] = useState({});

    // --- Search Bar State ---
    const [searchQuery, setSearchQuery] = useState({
        destination: "",
        pickUp: "",
        dropOff: "",
        vehicleType: "Any Type"
    });

    const [estimatedKm, setEstimatedKm] = useState(50); // Default 50 km

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

    const [maxPrice, setMaxPrice] = useState(10000); // Default to a high value

    const [filter, setFilter] = useState("All");
    const [showFilters, setShowFilters] = useState(false);

    // Define exact price brackets for filtering
    const categories = [
        { label: "All Vehicles", value: "All" },
        { label: "Under ₹2,000", value: "under_2000" },
        { label: "₹2,000 - ₹5,000", value: "2000_5000" },
        { label: "Above ₹5,000", value: "above_5000" }
    ];

    const availableFeatures = ["AC", "Manual", "Automatic", "Bluetooth", "Electric/Hybrid"];
    const [selectedFeatures, setSelectedFeatures] = useState([]);

    const toggleFeature = (feature) => {
        if (selectedFeatures.includes(feature)) {
            setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
        } else {
            setSelectedFeatures([...selectedFeatures, feature]);
        }
    };

    // --- Dynamic Filtering Logic ---
    const filteredRentals = rentals.filter(rental => {
        // 1. Price Category Filter (from the chips by exact amount)
        if (filter !== "All") {
            const price = rental.pricePerDay;
            if (filter === "under_2000" && price >= 2000) return false;
            if (filter === "2000_5000" && (price < 2000 || price > 5000)) return false;
            if (filter === "above_5000" && price <= 5000) return false;
        }

        // 2. Price Slider Filter (from modal)
        if (rental.pricePerDay > maxPrice) {
            return false;
        }

        // 3. Feature Filters (from modal)
        if (selectedFeatures.length > 0) {
            const rFeatures = rental.rentalDetails?.features || [];
            // Optional: check if rental has ALL selected features
            const hasAllFeatures = selectedFeatures.every(sf => {
                return rFeatures.some(rf => rf.toLowerCase().includes(sf.toLowerCase()));
            });
            if (!hasAllFeatures) return false;
        }

        // 2. Vehicle Type Filter (from search bar)
        if (searchQuery.vehicleType !== "Any Type") {
            const vType = rental.rentalDetails?.vehicleType?.toLowerCase() || "";
            const sType = searchQuery.vehicleType.toLowerCase();

            if (sType.includes("car") || sType.includes("suv")) {
                if (!vType.includes("car") && !vType.includes("suv") && !vType.includes("sedan") && !vType.includes("hatchback")) return false;
            } else if (sType.includes("bike") || sType.includes("scooter")) {
                if (!vType.includes("bike") && !vType.includes("scooter") && !vType.includes("motorcycle")) return false;
            } else if (sType.includes("auto") || sType.includes("taxi")) {
                if (!vType.includes("auto") && !vType.includes("taxi") && !vType.includes("rickshaw") && !vType.includes("cab")) return false;
            }
        }

        return true;
    });

    const toggleLike = (e, id) => {
        e.stopPropagation();
        setLikes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Search Submission ---
    const handleSearch = async () => {
        const queryDestination = searchQuery.destination.trim();
        if (!queryDestination) {
            const res = await api.get('/businesses/Munnar');
            if (res.data.success) {
                setRentals(res.data.data.rentals || []);
            }
            return;
        }

        try {
            setLoading(true);
            const res = await api.get(`/businesses/${queryDestination}`);
            if (res.data.success) {
                setRentals(res.data.data.rentals || []);
            } else {
                setRentals([]);
            }
        } catch (error) {
            console.error('Error searching rentals:', error);
            setRentals([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };


    const handleReserve = () => {
        if (!selectedRental) return;
        alert(`Reservation initiated for ${selectedRental.name}. Proceeding to checkout flow.`);
        // In a real flow, this might navigate to a checkout page with query params
    };

    return (
        <div className="rentals-page-wrapper">
            {/* HERO & SEARCH BAR */}
            <div className="rentals-hero">
                <h1 className="hero-title">Find your perfect ride</h1>
                <p className="hero-subtitle">Search great deals on cars, bikes, and more...</p>

                <div className="search-bar-container">
                    <div className="search-field">
                        <span className="search-label">Pick-up Location</span>
                        <input
                            type="text"
                            className="search-input-real"
                            placeholder="City, airport, or address"
                            value={searchQuery.destination}
                            onChange={(e) => setSearchQuery({ ...searchQuery, destination: e.target.value })}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div className="search-field">
                        <span className="search-label">Pick-up Date</span>
                        <input
                            type="date"
                            className="search-input-real"
                            value={searchQuery.pickUp}
                            onChange={(e) => setSearchQuery({ ...searchQuery, pickUp: e.target.value })}
                        />
                    </div>
                    <div className="search-field">
                        <span className="search-label">Return Date</span>
                        <input
                            type="date"
                            className="search-input-real"
                            value={searchQuery.dropOff}
                            onChange={(e) => setSearchQuery({ ...searchQuery, dropOff: e.target.value })}
                        />
                    </div>
                    <div className="search-field">
                        <span className="search-label">Vehicle</span>
                        <select
                            className="search-input-real"
                            value={searchQuery.vehicleType}
                            onChange={(e) => setSearchQuery({ ...searchQuery, vehicleType: e.target.value })}
                        >
                            <option>Any Type</option>
                            <option>Cars / SUVs</option>
                            <option>Bikes / Scooters</option>
                            <option>Auto / Taxis</option>
                        </select>
                    </div>
                    <button className="search-button" onClick={handleSearch}>
                        <Search fill="white" size={20} />
                    </button>
                </div>
            </div>

            <div className="container">
                {/* Filter Tabs + Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '40px' }}>
                    <div className="category-bar" style={{ marginBottom: 0 }}>
                        {categories.map((cat) => (
                            <div
                                key={cat.value}
                                className={`category ${filter === cat.value ? 'active' : ''}`}
                                onClick={() => setFilter(cat.value)}
                            >
                                <span>{cat.label}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowFilters(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'white',
                            border: '1px solid #e0e7ff',
                            padding: '10px 24px',
                            borderRadius: '30px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            color: '#1a1a1a',
                            height: '42px'
                        }}
                    >
                        <SlidersHorizontal size={16} /> Filters
                    </button>
                </div>

                {/* Rentals Grid */}
                <div className="rentals-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: '#717171' }}>Loading awesome rides...</p>
                        </div>
                    ) : filteredRentals.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: '#717171' }}>No rides found</p>
                        </div>
                    ) : (
                        filteredRentals.map((rental) => (
                            <div className="rental-card" key={rental._id} onClick={() => setSelectedRental(rental)}>
                                <div className="rental-image-container">
                                    <img
                                        src={rental.photos?.[0] || `https://images.unsplash.com/photo-1549317661-eb55f55e51fa?auto=format&fit=crop&w=600&q=80`}
                                        alt={rental.name}
                                    />
                                    <span className="rental-badge-floating" style={{ textTransform: 'capitalize' }}>
                                        {rental.priceRange}
                                    </span>
                                    <button
                                        className={`heart-button ${likes[rental._id] ? 'liked' : ''}`}
                                        onClick={(e) => toggleLike(e, rental._id)}
                                    >
                                        <Heart
                                            size={24}
                                            fill={likes[rental._id] ? "#ff385c" : "rgba(0,0,0,0.5)"}
                                            color={likes[rental._id] ? "#ff385c" : "white"}
                                            strokeWidth={2}
                                        />
                                    </button>
                                </div>

                                <div className="rental-content">
                                    <div className="rental-header-row">
                                        <h3 className="rental-title">{rental.name}</h3>
                                        <div className="rental-rating-modern">
                                            <Star size={14} />
                                            <span>{rental.stats?.averageRating || "New"}</span>
                                        </div>
                                    </div>

                                    <div className="rental-location-text">
                                        {rental.location?.city}, {rental.location?.state}
                                    </div>

                                    <div className="rental-specs-text">
                                        {rental.rentalDetails?.capacity || 4} Seats · {rental.rentalDetails?.vehicleType || 'Car'} · {rental.rentalDetails?.model || 'Standard'}
                                    </div>

                                    <div className="rental-price-modern">
                                        <span className="price-val">₹{rental.pricePerDay}</span>
                                        <span className="price-label-modern"> / km</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* DETAIL MODAL - Modern Popup */}
            {selectedRental && (
                <div className="modal-overlay" onClick={() => setSelectedRental(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-modern" onClick={() => setSelectedRental(null)}>
                            <ChevronLeft size={24} />
                        </button>

                        <img
                            src={selectedRental.photos?.[0] || `https://images.unsplash.com/photo-1549317661-eb55f55e51fa?auto=format&fit=crop&w=800&q=80`}
                            alt={selectedRental.name}
                            className="modal-image-hero"
                        />

                        <div className="modal-body-wrapper">
                            <div className="modal-title-row">
                                <h2>{selectedRental.name}</h2>
                                <div className="modal-location">
                                    {selectedRental.location?.city}, {selectedRental.location?.state} · {selectedRental.stats?.reviewCount || 0} reviews
                                </div>
                            </div>

                            <div className="modal-divider" />

                            <div className="modal-host-row">
                                <div className="modal-host-avatar">
                                    <Car size={24} />
                                </div>
                                <div className="modal-host-text">
                                    <h4>Top Quality Ride</h4>
                                    <p>Verified Rental Partner</p>
                                </div>
                            </div>

                            <div className="modal-divider" />

                            <p className="modal-description">{selectedRental.description}</p>

                            <div className="modal-divider" />

                            <div className="modal-amenities">
                                <h3>Vehicle Specs & Features</h3>
                                <div className="modal-amenities-grid">
                                    <div className="amenity-row">
                                        <Users size={20} />
                                        <span>{selectedRental.rentalDetails?.capacity} Seats</span>
                                    </div>
                                    <div className="amenity-row">
                                        <Car size={20} />
                                        <span>{selectedRental.rentalDetails?.vehicleType}</span>
                                    </div>
                                    <div className="amenity-row">
                                        <Settings size={20} />
                                        <span>{selectedRental.rentalDetails?.model}</span>
                                    </div>
                                    {selectedRental.rentalDetails?.features?.map((feature, idx) => (
                                        <div key={idx} className="amenity-row">
                                            {getIconForFeature(feature)}
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Bottom Bar for Reservation */}
                        <div className="modal-bottom-bar">
                            <div className="modal-price-block">
                                <div>
                                    <span className="modal-price-val">₹{selectedRental.pricePerDay}</span>
                                    <span style={{ color: '#1a1a1a', fontWeight: '400' }}> / km</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        value={estimatedKm}
                                        onChange={e => setEstimatedKm(Number(e.target.value) || 1)}
                                        style={{ width: '60px', padding: '4px 8px', borderRadius: '8px', border: '1px solid #ccc' }}
                                    />
                                    <span style={{ fontSize: '14px', color: '#717171' }}>
                                        km total: <span style={{ fontWeight: '700', color: '#1a1a1a' }}>₹{selectedRental.pricePerDay * estimatedKm}</span>
                                    </span>
                                </div>
                            </div>
                            <button className="reserve-btn" onClick={handleReserve}>
                                Reserve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FILTERS MODAL */}
            {showFilters && (
                <div className="modal-overlay" onClick={() => setShowFilters(false)} style={{ zIndex: 10000 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', height: 'auto', padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Filters</h2>
                            <button className="modal-close-modern" style={{ position: 'static', background: '#f5f5f5', boxShadow: 'none' }} onClick={() => setShowFilters(false)}>
                                <Check size={20} />
                            </button>
                        </div>

                        <div className="modal-divider" style={{ margin: '0 0 24px 0' }} />

                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Price range (Per km)</h3>
                            <div className="price-slider-container" style={{ margin: 0, padding: 0, border: 'none', boxShadow: 'none' }}>
                                <div className="slider-header-row" style={{ textAlign: 'left', marginBottom: '12px', fontSize: '16px' }}>
                                    <span style={{ color: '#717171' }}>Maximum:</span> <span style={{ fontWeight: 700, color: '#1a1a1a' }}>₹{maxPrice}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10000"
                                    step="10"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                                    className="modern-range-slider"
                                />
                            </div>
                        </div>

                        <div className="modal-divider" style={{ margin: '0 0 24px 0' }} />

                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Amenities & Specs</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {availableFeatures.map(feature => (
                                    <label key={feature} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedFeatures.includes(feature)}
                                            onChange={() => toggleFeature(feature)}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#667eea' }}
                                        />
                                        {feature}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="modal-divider" style={{ margin: '24px 0' }} />

                        <button
                            className="reserve-btn"
                            style={{ width: '100%' }}
                            onClick={() => setShowFilters(false)}
                        >
                            Show {filteredRentals.length} vehicles
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rentals;
