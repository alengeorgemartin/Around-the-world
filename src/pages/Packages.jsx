import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Packages.css";

const Packages = () => {
    const navigate = useNavigate();
    const [selectedPackage, setSelectedPackage] = useState(null);

    const packages = [
        {
            id: 1,
            title: "Rajasthan Royal Heritage",
            location: "Jaipur, Udaipur, Jodhpur",
            duration: "7 Days / 6 Nights",
            price: "₹35,999",
            originalPrice: "₹45,999",
            image: "1534751516642-a1af1ef26a56",
            rating: 4.8,
            reviews: 234,
            category: "Heritage",
            highlights: [
                "City Palace & Amber Fort",
                "Lake Pichola Boat Ride",
                "Mehrangarh Fort Tour",
                "Traditional Rajasthani Cuisine",
                "Desert Safari Experience"
            ],
            includes: ["Hotel", "Transport", "Breakfast", "Guide"],
            description: "Explore the royal palaces, majestic forts, and vibrant culture of Rajasthan. Experience the grandeur of India's most colorful state."
        },
        {
            id: 2,
            title: "Kerala Backwaters Escape",
            location: "Alleppey, Munnar, Kochi",
            duration: "5 Days / 4 Nights",
            price: "₹28,499",
            originalPrice: "₹36,999",
            image: "1583417319070-4a69db38a482",
            rating: 4.9,
            reviews: 456,
            category: "Nature",
            highlights: [
                "Houseboat Stay in Backwaters",
                "Tea Plantation Visit",
                "Ayurvedic Spa Treatment",
                "Fort Kochi Heritage Tour",
                "Kathakali Dance Show"
            ],
            includes: ["Hotel", "Houseboat", "Meals", "Transfers"],
            description: "Discover God's Own Country with serene backwaters, lush tea gardens, and pristine beaches. Perfect for relaxation and rejuvenation."
        },
        {
            id: 3,
            title: "Himachal Adventure Trek",
            location: "Manali, Kasol, Dharamshala",
            duration: "6 Days / 5 Nights",
            price: "₹22,999",
            originalPrice: "₹29,999",
            image: "1506905925346-21bda4d32df4",
            rating: 4.7,
            reviews: 189,
            category: "Adventure",
            highlights: [
                "Solang Valley Activities",
                "Trekking to Kheerganga",
                "River Rafting in Beas",
                "Paragliding Experience",
                "Monastery Visits"
            ],
            includes: ["Hotel", "Adventure Activities", "Breakfast", "Transport"],
            description: "Thrill seekers paradise! Trek through snow-capped mountains, experience adventure sports, and explore serene valleys."
        },
        {
            id: 4,
            title: "Goa Beach Carnival",
            location: "North & South Goa",
            duration: "4 Days / 3 Nights",
            price: "₹18,999",
            originalPrice: "₹24,999",
            image: "1559827260-82a064f0411e",
            rating: 4.6,
            reviews: 678,
            category: "Beach",
            highlights: [
                "Water Sports Package",
                "Beach Shacks & Nightlife",
                "Dudhsagar Waterfall Trip",
                "Spice Plantation Tour",
                "Sunset Cruise"
            ],
            includes: ["Hotel", "Breakfast", "Water Sports", "Transfers"],
            description: "Sun, sand, and sea! Enjoy vibrant beaches, water sports, nightlife, and Portuguese architecture in India's party capital."
        },
        {
            id: 5,
            title: "Taj Mahal & Agra Heritage",
            location: "Delhi, Agra, Jaipur",
            duration: "4 Days / 3 Nights",
            price: "₹24,999",
            originalPrice: "₹32,999",
            image: "1564507595350-a6e6ed0855b",
            rating: 4.8,
            reviews: 543,
            category: "Heritage",
            highlights: [
                "Taj Mahal at Sunrise",
                "Agra Fort & Fatehpur Sikri",
                "Jaipur City Palace",
                "Hawa Mahal Photo Stop",
                "Cultural Dinner Show"
            ],
            includes: ["Hotel", "Transport", "Breakfast", "Entry Fees"],
            description: "Experience the Golden Triangle of India. Visit the iconic Taj Mahal and explore the rich Mughal and Rajput heritage."
        },
        {
            id: 6,
            title: "Ladakh High Altitude Adventure",
            location: "Leh, Nubra, Pangong",
            duration: "8 Days / 7 Nights",
            price: "₹42,999",
            originalPrice: "₹54,999",
            image: "1506905925346-21bda4d32df4",
            rating: 4.9,
            reviews: 321,
            category: "Adventure",
            highlights: [
                "Khardung La Pass Drive",
                "Pangong Lake Camping",
                "Nubra Valley Camel Safari",
                "Magnetic Hill Experience",
                "Buddhist Monasteries"
            ],
            includes: ["Hotel", "Camp", "All Meals", "Oxygen Support"],
            description: "Journey to the land of high passes. Experience breathtaking landscapes, serene lakes, and ancient Buddhist culture."
        }
    ];

    const [filter, setFilter] = useState("All");
    const categories = ["All", "Heritage", "Nature", "Adventure", "Beach"];

    const filteredPackages = filter === "All"
        ? packages
        : packages.filter(pkg => pkg.category === filter);

    return (
        <>
            <div className="container">
                <h1 className="big-title">Travel Packages</h1>
                <p className="packages-subtitle">Handpicked tours designed for unforgettable experiences</p>

                {/* Filter Tabs */}
                <div className="category-bar">
                    {categories.map((cat) => (
                        <div
                            key={cat}
                            className={`category ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            <i className={`fa-solid ${cat === 'All' ? 'fa-th-large' :
                                cat === 'Heritage' ? 'fa-landmark' :
                                    cat === 'Nature' ? 'fa-tree' :
                                        cat === 'Adventure' ? 'fa-mountain' :
                                            'fa-umbrella-beach'
                                }`}></i>
                            {cat}
                        </div>
                    ))}
                </div>

                {/* Packages Grid */}
                <div className="packages-grid">
                    {filteredPackages.map((pkg) => (
                        <div className="package-card" key={pkg.id}>
                            <div className="package-image-container">
                                <img
                                    src={`https://images.unsplash.com/photo-${pkg.image}?auto=format&fit=crop&w=600&q=80`}
                                    alt={pkg.title}
                                />
                                <span className="package-badge">{pkg.category}</span>
                                <div className="package-discount">
                                    Save ₹{parseInt(pkg.originalPrice.replace(/[₹,]/g, '')) - parseInt(pkg.price.replace(/[₹,]/g, ''))}
                                </div>
                            </div>

                            <div className="package-content">
                                <h3 className="package-title">{pkg.title}</h3>

                                <div className="package-meta">
                                    <span><i className="fa-solid fa-location-dot"></i> {pkg.location}</span>
                                    <span><i className="fa-solid fa-clock"></i> {pkg.duration}</span>
                                </div>

                                <div className="package-rating">
                                    <i className="fa-solid fa-star"></i>
                                    <span className="rating-value">{pkg.rating}</span>
                                    <span className="rating-count">({pkg.reviews} reviews)</span>
                                </div>

                                <div className="package-includes">
                                    {pkg.includes.map((item, idx) => (
                                        <span key={idx} className="include-badge">
                                            <i className="fa-solid fa-check"></i> {item}
                                        </span>
                                    ))}
                                </div>

                                <div className="package-price-row">
                                    <div className="package-pricing">
                                        <span className="original-price">{pkg.originalPrice}</span>
                                        <span className="current-price">{pkg.price}</span>
                                        <span className="price-label">per person</span>
                                    </div>
                                    <button
                                        className="view-details-btn"
                                        onClick={() => setSelectedPackage(pkg)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedPackage && (
                <div className="modal-overlay" onClick={() => setSelectedPackage(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedPackage(null)}>
                            <i className="fa-solid fa-times"></i>
                        </button>

                        <img
                            src={`https://images.unsplash.com/photo-${selectedPackage.image}?auto=format&fit=crop&w=800&q=80`}
                            alt={selectedPackage.title}
                            className="modal-image"
                        />

                        <div className="modal-body">
                            <span className="modal-badge">{selectedPackage.category}</span>
                            <h2>{selectedPackage.title}</h2>

                            <div className="modal-meta">
                                <span><i className="fa-solid fa-location-dot"></i> {selectedPackage.location}</span>
                                <span><i className="fa-solid fa-clock"></i> {selectedPackage.duration}</span>
                                <span><i className="fa-solid fa-star"></i> {selectedPackage.rating} ({selectedPackage.reviews})</span>
                            </div>

                            <p className="modal-description">{selectedPackage.description}</p>

                            <div className="modal-section">
                                <h3><i className="fa-solid fa-list"></i> Highlights</h3>
                                <ul className="highlights-list">
                                    {selectedPackage.highlights.map((highlight, idx) => (
                                        <li key={idx}>
                                            <i className="fa-solid fa-check-circle"></i>
                                            {highlight}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="modal-section">
                                <h3><i className="fa-solid fa-box"></i> Package Includes</h3>
                                <div className="includes-grid">
                                    {selectedPackage.includes.map((item, idx) => (
                                        <div key={idx} className="include-item">
                                            <i className="fa-solid fa-check"></i>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <div className="modal-pricing">
                                    <span className="modal-original-price">{selectedPackage.originalPrice}</span>
                                    <span className="modal-current-price">{selectedPackage.price}</span>
                                    <span className="modal-price-label">per person</span>
                                </div>
                                <button className="book-now-btn">
                                    <i className="fa-solid fa-ticket"></i>
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

export default Packages;
