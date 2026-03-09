import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import '../styles/DestinationDetails.css';

const DestinationDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // The state is passed from the Home page when clicking 'Read More'
    const dest = location.state;

    // If accessed directly without state, redirect to home
    if (!dest) {
        return <Navigate to="/" />;
    }

    return (
        <div className="destination-details-page">
            {/* Hero Image Section */}
            <div className="dest-hero-container">
                <img src={dest.image} alt={dest.name} className="dest-hero-image" />
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <i className="fa-solid fa-arrow-left"></i> Back
                </button>
                <div className="dest-hero-overlay">
                    <h1 className="dest-hero-title">{dest.name}</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="container dest-content-wrapper">
                <div className="dest-main-info">
                    {/* Header Info */}
                    <div className="dest-header-row">
                        <div>
                            <h2 className="dest-title">{dest.name} Package</h2>
                            <div className="dest-meta">
                                <span className="dest-rating">
                                    <i className="fa-solid fa-star"></i> {dest.rating}
                                </span>
                                <span className="dest-reviews">{dest.reviews}</span>
                            </div>
                        </div>
                        <div className="dest-price-box">
                            <span className="price-label">Starting from</span>
                            <span className="price-val">{dest.rate}</span>
                        </div>
                    </div>

                    <div className="dest-divider"></div>

                    {/* Description Section */}
                    <div className="dest-section">
                        <h3 className="section-title">
                            <i className="fa-solid fa-book"></i> About this Destination
                        </h3>
                        <p className="dest-description">{dest.fullDesc}</p>
                    </div>

                    {/* Features Section */}
                    <div className="dest-section">
                        <h3 className="section-title">
                            <i className="fa-solid fa-star"></i> What's Included
                        </h3>
                        <div className="dest-features-grid">
                            {dest.features.map((feature, idx) => (
                                <div key={idx} className="feature-item">
                                    <i className="fa-solid fa-check-circle"></i>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Images Gallery */}
                    <div className="dest-section">
                        <h3 className="section-title">
                            <i className="fa-solid fa-images"></i> Gallery
                        </h3>
                        <div className="dest-gallery">
                            {dest.images && dest.images.length > 0 ? (
                                <>
                                    {/* Main Large Image */}
                                    <img 
                                        src={dest.images[0]} 
                                        alt={`${dest.name} - Main`}
                                        className="gallery-img main-gallery-img"
                                    />
                                    {/* Remaining Images */}
                                    {dest.images.slice(1).map((imgSrc, idx) => (
                                        <img
                                            key={idx + 1}
                                            src={imgSrc}
                                            alt={`${dest.name} - ${idx + 2}`}
                                            className="gallery-img"
                                        />
                                    ))}
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Sidebar Booking Card */}
                <div className="dest-sidebar">
                    <div className="booking-card">
                        <div className="booking-header">
                            <h3>{dest.rate}</h3>
                            <p>Best price guarantee</p>
                        </div>
                        <div className="booking-form">
                            <div className="form-group">
                                <label>Dates</label>
                                <input type="date" className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Travelers</label>
                                <select className="form-input">
                                    <option>1 Adult</option>
                                    <option>2 Adults</option>
                                    <option>2 Adults, 1 Child</option>
                                    <option>Group (4+)</option>
                                </select>
                            </div>
                            <button className="book-btn">Book Package Options</button>
                        </div>
                        <div className="booking-footer">
                            <p className="note">You won't be charged yet</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DestinationDetails;
