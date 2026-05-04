import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import PhotoCarousel from "../components/PhotoCarousel";
import "../styles/Packages.css";

const Packages = () => {
    const navigate = useNavigate();
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const packagesPerSlide = 3;

    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    // Booking form state
    const [pickupDate, setPickupDate] = useState('');
    const [participants, setParticipants] = useState(1);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState(null);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                const res = await api.get('/business/type/tour');
                if (res.data.success) {
                    const mappedPackages = res.data.data.map((b) => ({
                        id: b._id,
                        title: b.name,
                        location: `${b.location.city}${b.location.state ? ', ' + b.location.state : ''}`,
                        duration: b.tourDetails?.duration || "1 Day",
                        price: `₹${b.pricePerDay || 0}`,
                        originalPrice: `₹${Math.floor((b.pricePerDay || 0) * 1.2)}`,
                        rawPrice: b.pricePerDay || 0,
                        photos: b.photos && b.photos.length > 0 ? b.photos : null,
                        image: b.photos?.[0] || '1534751516642-a1af1ef26a56',
                        rating: b.stats?.averageRating || 4.5,
                        reviews: b.stats?.reviewCount || 10,
                        category: b.tourDetails?.tourType || "Heritage",
                        highlights: b.tourDetails?.includes?.slice(0, 5) || ["Sightseeing", "Guide", "Transport"],
                        includes: b.tourDetails?.includes || ["Guide", "Transport"],
                        description: b.description,
                        customerReviews: []
                    }));
                    setPackages(mappedPackages);
                }
            } catch (error) {
                console.error("Error fetching packages:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    const handleBooking = async () => {
        try {
            setBookingLoading(true);
            setBookingMessage(null);
            
            if (!pickupDate || !participants || !fullName || !email || !phone) {
                setBookingMessage({ type: 'error', text: 'Please fill in all fields' });
                return;
            }

            const checkInDate = new Date(pickupDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (checkInDate < today) {
                setBookingMessage({ type: 'error', text: 'Starting date cannot be in the past' });
                return;
            }

            const totalPrice = selectedPackage.rawPrice * parseInt(participants);

            const res = await api.post('/bookings/create', {
                businessId: selectedPackage.id,
                bookingType: 'tour',
                checkIn: pickupDate,
                checkOut: pickupDate,
                participants: parseInt(participants),
                basePrice: selectedPackage.rawPrice,
                totalPrice: totalPrice,
                contactInfo: { phone, email },
                specialRequests: `Booking by ${fullName}`
            });

            if (res.data.success) {
                setBookingMessage({ type: 'success', text: 'Booking successfully created!' });
                setTimeout(() => {
                    setSelectedPackage(null);
                    setBookingMessage(null);
                    setPickupDate('');
                    setParticipants(1);
                    setFullName('');
                    setEmail('');
                    setPhone('');
                }, 2000);
            }
        } catch (error) {
            setBookingMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create booking' });
        } finally {
            setBookingLoading(false);
        }
    };

    const [filter, setFilter] = useState("All");
    const categories = ["All", "Heritage", "Nature", "Adventure", "Beach"];

    const filteredPackages = filter === "All"
        ? packages
        : packages.filter(pkg => pkg.category === filter);

    // Calculate total slides
    const totalSlides = Math.ceil(filteredPackages.length / packagesPerSlide);
    
    // Get packages for current slide
    const startIdx = currentSlide * packagesPerSlide;
    const currentPackages = filteredPackages.slice(startIdx, startIdx + packagesPerSlide);

    // Handle next slide
    const handleNextSlide = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    // Handle previous slide
    const handlePrevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    // Reset slide when filter changes
    const handleFilterChange = (cat) => {
        setFilter(cat);
        setCurrentSlide(0);
    };

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
                            onClick={() => handleFilterChange(cat)}
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

                {/* Packages Carousel */}
                <div className="packages-carousel-container">
                    <button 
                        className={`carousel-btn carousel-btn-prev ${currentSlide === 0 ? 'disabled' : ''}`}
                        onClick={handlePrevSlide}
                        disabled={currentSlide === 0}
                    >
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>

                    <div className="packages-grid packages-carousel">
                        {currentPackages.map((pkg) => (
                        <div className="package-card" key={pkg.id}>
                            <div className="package-image-container">
                                <PhotoCarousel
                                    photos={pkg.photos}
                                    fallback={pkg.image.includes('http') ? pkg.image : `https://images.unsplash.com/photo-${pkg.image}?auto=format&fit=crop&w=600&q=80`}
                                    alt={pkg.title}
                                    height="220px"
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

                    <button 
                        className={`carousel-btn carousel-btn-next ${currentSlide === totalSlides - 1 ? 'disabled' : ''}`}
                        onClick={handleNextSlide}
                        disabled={currentSlide === totalSlides - 1}
                    >
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>

                {/* Slide Indicators */}
                <div className="carousel-indicators">
                    {Array.from({ length: totalSlides }).map((_, idx) => (
                        <button
                            key={idx}
                            className={`indicator-dot ${currentSlide === idx ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(idx)}
                        ></button>
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

                        <PhotoCarousel
                            photos={selectedPackage.photos}
                            fallback={selectedPackage.image.includes('http') ? selectedPackage.image : `https://images.unsplash.com/photo-${selectedPackage.image}?auto=format&fit=crop&w=800&q=80`}
                            alt={selectedPackage.title}
                            height="280px"
                            borderRadius="12px 12px 0 0"
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

                            <div className="modal-section">
                                <h3><i className="fa-solid fa-star"></i> Customer Reviews</h3>
                                <div className="reviews-list">
                                    {selectedPackage.customerReviews && selectedPackage.customerReviews.map((review, idx) => (
                                        <div key={idx} className="review-card">
                                            <div className="review-header">
                                                <div>
                                                    <h4>{review.name}</h4>
                                                    <span className="review-date">{review.date}</span>
                                                </div>
                                                <div className="review-rating">
                                                    {[...Array(review.rating)].map((_, i) => (
                                                        <i key={i} className="fa-solid fa-star"></i>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="review-text">{review.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-section" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <h3 style={{ marginBottom: '15px' }}><i className="fa-solid fa-calendar-check"></i> Book Your Tour</h3>
                                <div className="rd-form-row">
                                    <div className="rd-form-group">
                                        <label>Starting Date</label>
                                        <input type="date" className="rd-input" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                                    </div>
                                    <div className="rd-form-group">
                                        <label>Number of Persons</label>
                                        <input type="number" min="1" className="rd-input" value={participants} onChange={(e) => setParticipants(e.target.value)} />
                                    </div>
                                </div>
                                <div className="rd-form-group">
                                    <label>Full name</label>
                                    <div className="rd-input-with-icon">
                                        <i className="far fa-user"></i>
                                        <input type="text" placeholder="Your full name" className="rd-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                    </div>
                                </div>
                                <div className="rd-form-group">
                                    <label>Email ID</label>
                                    <div className="rd-input-with-icon">
                                        <i className="far fa-envelope"></i>
                                        <input type="email" placeholder="Your Email" className="rd-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                </div>
                                <div className="rd-form-group">
                                    <label>Phone number</label>
                                    <div className="rd-input-with-icon">
                                        <i className="fas fa-phone-alt"></i>
                                        <input type="tel" placeholder="Your phone no" className="rd-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                    </div>
                                </div>
                                {bookingMessage && (
                                    <div className={`form-message ${bookingMessage.type === 'error' ? 'error-msg' : 'success-msg'}`} style={{ color: bookingMessage.type === 'error' ? 'red' : 'green', padding: '10px 0', fontSize: '14px', fontWeight: 'bold' }}>
                                        {bookingMessage.text}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <div className="modal-pricing">
                                    <span className="modal-original-price">₹{Math.floor(selectedPackage.rawPrice * 1.2 * participants)}</span>
                                    <span className="modal-current-price">₹{selectedPackage.rawPrice * participants}</span>
                                    <span className="modal-price-label">total</span>
                                </div>
                                <button className="book-now-btn" onClick={handleBooking} disabled={bookingLoading}>
                                    <i className="fa-solid fa-ticket"></i>
                                    {bookingLoading ? 'Processing...' : 'Book Now'}
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
