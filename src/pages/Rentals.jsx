import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import PhotoCarousel from "../components/PhotoCarousel";
import "../styles/Rentals.css";

// Extra static car packages using uploaded images
const EXTRA_CARS = [
    { id: 'e1', name: 'VW Night Edition', vehicleType: 'Luxury Sedan', pricePerDay: 3200, capacity: 5, photo: '/images/car1-vw.png', desc: 'Dominate the dark roads in this sleek Volkswagen Night Edition — perfect for executive drives.' },
    { id: 'e2', name: 'Concept Racer X', vehicleType: 'Sports Car', pricePerDay: 5500, capacity: 2, photo: '/images/car3-concept.png', desc: 'A futuristic concept-class sports car with razor-sharp aerodynamics and pure adrenaline.' },
    { id: 'e3', name: 'Camaro SS Black', vehicleType: 'Muscle Car', pricePerDay: 4800, capacity: 4, photo: '/images/car4-camaro.png', desc: 'Feel the rumble of the legendary Camaro SS — American muscle at its finest.' },
    { id: 'e4', name: 'Nissan GT-R Stealth', vehicleType: 'Sports Car', pricePerDay: 6000, capacity: 4, photo: '/images/car5-nissan.png', desc: 'The iconic GT-R in midnight stealth mode — zero to hundred before you blink.' },
];

const Rentals = () => {
    const navigate = useNavigate();
    const fleetRef = useRef(null);
    const [selectedRental, setSelectedRental] = useState(null);
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Booking form state
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [pickupLocation, setPickupLocation] = useState('Munnar');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState(null);

    const getDiffDays = () => {
        if (!pickupDate || !returnDate) return 1;
        const checkInDate = new Date(pickupDate);
        const checkOutDate = new Date(returnDate);
        if (checkOutDate < checkInDate) return 1;
        const diffTime = Math.abs(checkOutDate - checkInDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    };

    const handleBooking = async () => {
        try {
            setBookingLoading(true);
            setBookingMessage(null);
            
            if (!pickupDate || !returnDate || !fullName || !email || !phone || !pickupLocation) {
                setBookingMessage({ type: 'error', text: 'Please fill in all fields' });
                return;
            }

            const checkInDate = new Date(pickupDate);
            const checkOutDate = new Date(returnDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (checkInDate < today) {
                setBookingMessage({ type: 'error', text: 'Pickup date cannot be in the past' });
                return;
            }
            if (checkOutDate < checkInDate) {
                setBookingMessage({ type: 'error', text: 'Return date cannot be earlier than pickup date' });
                return;
            }

            const diffDays = getDiffDays();
            const totalPrice = selectedRental.pricePerDay * diffDays;

            const res = await api.post('/bookings/create', {
                businessId: selectedRental._id,
                bookingType: 'rental',
                checkIn: pickupDate,
                checkOut: returnDate,
                basePrice: selectedRental.pricePerDay,
                totalPrice: totalPrice,
                pickupLocation: pickupLocation,
                returnLocation: pickupLocation,
                contactInfo: { phone, email },
                specialRequests: `Booking by ${fullName}`
            });

            if (res.data.success) {
                setBookingMessage({ type: 'success', text: 'Booking successfully created!' });
                setTimeout(() => {
                    setSelectedRental(null);
                    setBookingMessage(null);
                    setPickupDate('');
                    setReturnDate('');
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

    const filteredRentals = rentals.filter(rental => {
        const matchesFilter = filter === "All" || rental.priceRange === filter;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            rental.name?.toLowerCase().includes(q) ||
            rental.rentalDetails?.vehicleType?.toLowerCase().includes(q) ||
            rental.location?.city?.toLowerCase().includes(q) ||
            rental.rentalDetails?.model?.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const filteredExtraCars = EXTRA_CARS.filter(car => {
        const q = searchQuery.toLowerCase();
        return !q ||
            car.name?.toLowerCase().includes(q) ||
            car.vehicleType?.toLowerCase().includes(q);
    });

    if (selectedRental) {
        return (
            <div className="rentals-page-wrapper" style={{ background: '#fcfcfc', minHeight: '100vh', padding: '40px 0' }}>
                <div className="rental-details-container">
                    <div className="rd-header">
                        <button className="rd-back-btn" onClick={() => setSelectedRental(null)}>
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                    </div>

                    <div className="rd-content-grid">
                        {/* Left Column */}
                        <div className="rd-left-col">
                            <PhotoCarousel
                                photos={selectedRental.photos}
                                fallback={`https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80`}
                                alt={selectedRental.name}
                                height="340px"
                                borderRadius="12px"
                            />

                            <h1 className="rd-car-name">{selectedRental.name}</h1>
                            <div className="rd-price">
                                <span>${selectedRental.pricePerDay}</span>/day
                            </div>

                            <div className="rd-specs-row">
                                <div className="rd-spec-box">
                                    <i className="fas fa-user-plus"></i>
                                    <div className="rd-val">{selectedRental.rentalDetails?.capacity}</div>
                                    <div className="rd-lbl">Seats</div>
                                </div>
                                <div className="rd-spec-box">
                                    <i className="fas fa-gas-pump"></i>
                                    <div className="rd-val">Gasoline</div>
                                    <div className="rd-lbl">Fuel</div>
                                </div>
                                <div className="rd-spec-box">
                                    <i className="fas fa-motorcycle"></i>
                                    <div className="rd-val">30 MPG</div>
                                    <div className="rd-lbl">Mileage</div>
                                </div>
                                <div className="rd-spec-box">
                                    <i className="fas fa-shield-alt"></i>
                                    <div className="rd-val">Automatic</div>
                                    <div className="rd-lbl">Transmission</div>
                                </div>
                            </div>

                            <div className="rd-about-box">
                                <h3>About the car</h3>
                                <p>{selectedRental.description || `Experience luxury in the ${selectedRental.name}. With its automatic transmission and seating for ${selectedRental.rentalDetails?.capacity}, every journey is exceptional.`}</p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="rd-right-col">
                            <div className="rd-reserve-card">
                                <h2>Reserve <span className="rd-text-orange">Your Drive</span></h2>
                                <p className="rd-subtitle">Fast-Secure-Easy</p>

                                <div className="rd-form-row">
                                    <div className="rd-form-group">
                                        <label>Pickup Date</label>
                                        <input type="date" className="rd-input" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                                    </div>
                                    <div className="rd-form-group">
                                        <label>Return Date</label>
                                        <input type="date" className="rd-input" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                                    </div>
                                </div>

                                <div className="rd-form-group">
                                    <label>Pickup Location</label>
                                    <div className="rd-input-with-icon">
                                        <i className="fas fa-map-marker-alt"></i>
                                        <input type="text" placeholder="Enter pickup location" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="rd-input" />
                                    </div>
                                </div>

                                <div className="rd-form-group">
                                    <label>Full name</label>
                                    <div className="rd-input-with-icon">
                                        <i className="far fa-user"></i>
                                        <input type="text" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rd-input" />
                                    </div>
                                </div>

                                <div className="rd-form-group">
                                    <label>Email</label>
                                    <div className="rd-input-with-icon">
                                        <i className="far fa-envelope"></i>
                                        <input type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rd-input" />
                                    </div>
                                </div>

                                <div className="rd-form-group">
                                    <label>Phone number</label>
                                    <div className="rd-input-with-icon">
                                        <i className="fas fa-phone-alt"></i>
                                        <input type="tel" placeholder="Your phone no" value={phone} onChange={(e) => setPhone(e.target.value)} className="rd-input" />
                                    </div>
                                </div>

                                {bookingMessage && (
                                    <div className={`form-message ${bookingMessage.type === 'error' ? 'error-msg' : 'success-msg'}`} style={{ color: bookingMessage.type === 'error' ? 'red' : 'green', padding: '10px 0', fontSize: '14px', fontWeight: 'bold' }}>
                                        {bookingMessage.text}
                                    </div>
                                )}

                                <div className="rd-price-breakdown-box">
                                    <div className="rd-breakdown-row">
                                        <span>Rate\Day</span>
                                        <span>${selectedRental.pricePerDay}</span>
                                    </div>
                                    <hr className="rd-breakdown-hr" />
                                    <div className="rd-breakdown-row rd-total">
                                        <span>Total ({getDiffDays()} days)</span>
                                        <span>${selectedRental.pricePerDay * getDiffDays()}</span>
                                    </div>
                                </div>

                                <button 
                                    className="rd-confirm-btn" 
                                    onClick={handleBooking}
                                    disabled={bookingLoading}
                                >
                                    {bookingLoading ? 'Processing...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rentals-page-wrapper">



            {/* BIG HERO IMAGE */}
            <div className="hero-dark-image">
                <div className="hero-overlay-content">
                    <div className="hero-badge">INDUZ CARZ</div>
                    <div className="hero-title">Next-gen fleet. Instant drive</div>
                    <div className="hero-subtitle">Rent Your Dream Car</div>
                    <div className="hero-search-wrapper">
                        <div className="hero-search-input-group">
                            <i className="fas fa-map-marker-alt" style={{ color: '#ffa500' }}></i>
                            <input
                                type="text"
                                placeholder="Search by vehicle name, type..."
                                className="hero-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="hero-search-btn" onClick={() => {}}>Search Vehicles</button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="main-content-wrapper">

                {/* HEADERS */}
                <div className="section-header-center">
                    <div className="pill-badge"># Premium Fleet Selection</div>
                    <h2 className="luxury-title-orange">Luxury Car Collection</h2>
                    <p className="luxury-desc-sub">Discover premium vehicles with exceptional performance and comfort for your next journey</p>
                </div>

                {/* CAR GRID EXACTLY LIKE IMAGE (Dark cards) */}
                <div id="fleet-section" ref={fleetRef} className="car-grid-dark">
                    {loading ? (
                        <div className="loading-state">Loading premium vehicles...</div>
                    ) : filteredRentals.length === 0 ? (
                        <div className="empty-state">No vehicles match your criteria.</div>
                    ) : (
                        filteredRentals.map((rental) => (
                            <div className="car-card-dark" key={rental._id} onClick={() => setSelectedRental(rental)}>
                                <div className="card-image-top">
                                    <PhotoCarousel
                                        photos={rental.photos}
                                        fallback={'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80'}
                                        alt={rental.name}
                                        height="200px"
                                    />
                                    <div className="price-tag-overlay">${rental.pricePerDay || 2000}</div>
                                </div>
                                <div className="card-content-bottom">
                                    <h3 className="car-name">{rental.name}</h3>
                                    <span className="car-cat-badge">{rental.rentalDetails?.vehicleType || 'Compact Sedan'}</span>

                                    <div className="specs-icons-row">
                                        <div className="spec-icon-box">
                                            <div className="icon-circle"><i className="fas fa-user"></i><sup>+</sup></div>
                                            <div className="val">{rental.rentalDetails?.capacity || 5}</div>
                                            <div className="lbl">Seats</div>
                                        </div>
                                        <div className="spec-icon-box">
                                            <div className="icon-circle"><i className="fas fa-gas-pump"></i></div>
                                            <div className="val">Gasoline</div>
                                            <div className="lbl">Fuel</div>
                                        </div>
                                        <div className="spec-icon-box">
                                            <div className="icon-circle"><i className="fas fa-tachometer-alt"></i></div>
                                            <div className="val">30 MPG</div>
                                            <div className="lbl">Mileage</div>
                                        </div>
                                        <div className="spec-icon-box">
                                            <div className="icon-circle"><i className="fas fa-cog"></i></div>
                                            <div className="val">Automatic</div>
                                            <div className="lbl">Trans</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* EXTRA STATIC CAR PACKAGES */}
                    {filteredExtraCars.map((car) => (
                        <div className="car-card-dark" key={car.id} onClick={() => setSelectedRental({
                            _id: car.id, name: car.name, photos: [car.photo],
                            pricePerDay: car.pricePerDay, description: car.desc,
                            rentalDetails: { vehicleType: car.vehicleType, capacity: car.capacity }
                        })}>
                            <div className="card-image-top">
                                <img src={car.photo} alt={car.name} />
                                <div className="price-tag-overlay">₹{car.pricePerDay.toLocaleString()}</div>
                            </div>
                            <div className="card-content-bottom">
                                <h3 className="car-name">{car.name}</h3>
                                <span className="car-cat-badge">{car.vehicleType}</span>
                                <div className="specs-icons-row">
                                    <div className="spec-icon-box">
                                        <div className="icon-circle"><i className="fas fa-user"></i><sup>+</sup></div>
                                        <div className="val">{car.capacity}</div>
                                        <div className="lbl">Seats</div>
                                    </div>
                                    <div className="spec-icon-box">
                                        <div className="icon-circle"><i className="fas fa-gas-pump"></i></div>
                                        <div className="val">Gasoline</div>
                                        <div className="lbl">Fuel</div>
                                    </div>
                                    <div className="spec-icon-box">
                                        <div className="icon-circle"><i className="fas fa-tachometer-alt"></i></div>
                                        <div className="val">30 MPG</div>
                                        <div className="lbl">Mileage</div>
                                    </div>
                                    <div className="spec-icon-box">
                                        <div className="icon-circle"><i className="fas fa-cog"></i></div>
                                        <div className="val">Auto</div>
                                        <div className="lbl">Trans</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TESTIMONIALS SECTION */}
                <div className="section-header-center" style={{ marginTop: '80px' }}>
                    <div className="pill-badge"><i className="far fa-id-badge"></i> Customer Experience</div>
                    <h2 className="luxury-title-orange" style={{ fontSize: '48px', margin: '20px 0' }}>Premium Drive Experience</h2>
                    <div className="triangle-divider"><svg viewBox="0 0 100 20" width="300" height="20"><path d="M0,10 L45,10 L50,0 L55,10 L100,10" fill="none" stroke="#ffa500" strokeWidth="1" /></svg></div>
                    <p className="luxury-desc-sub" style={{ fontWeight: 600, color: '#000', marginTop: '10px' }}>Hear from our valued customers about their journey with our premium fleet</p>
                </div>

                <div className="testimonials-row">
                    <div className="testimonial-card">
                        <div className="stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
                        <p className="review-text">"The Honda Civic Series was impeccable! Smooth ride and excellent service with ample space. Will definitely rent again"</p>
                        <div className="car-tag-pill"><i className="fas fa-car-side"></i> Honda Civic</div>
                        <div className="user-info-row">
                            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="user" />
                            <strong>Sarah Johnson</strong>
                        </div>
                    </div>

                    <div className="testimonial-card">
                        <div className="stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="far fa-star"></i></div>
                        <p className="review-text">"Perfect family Toyota Highlander with ample space. Clean, well-maintained, and great value for money."</p>
                        <div className="car-tag-pill"><i className="fas fa-car-side"></i> Toyota Highlander</div>
                        <div className="user-info-row">
                            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="user" />
                            <strong>Michael Chen</strong>
                        </div>
                    </div>

                    <div className="testimonial-card">
                        <div className="stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="far fa-star"></i></div>
                        <p className="review-text">"Convertible Ford Mustang made our coastal drive unforgettable!"</p>
                        <div className="car-tag-pill"><i className="fas fa-car-side"></i> Ford Mustang</div>
                        <div className="user-info-row">
                            <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="user" />
                            <strong>Emma Rodriguez</strong>
                        </div>
                    </div>
                </div>

                {/* STATS STRIP SECTION */}
                <div className="stats-strip-light">
                    <div className="stat-block">
                        <div className="stat-num">10K+</div>
                        <div className="stat-label">Happy Customers</div>
                    </div>
                    <div className="stat-block">
                        <div className="stat-num">250+</div>
                        <div className="stat-label">Luxury Vehicle</div>
                    </div>
                    <div className="stat-block">
                        <div className="stat-num">24/7</div>
                        <div className="stat-label">Support</div>
                    </div>
                    <div className="stat-block">
                        <div className="stat-num">50+</div>
                        <div className="stat-label">Locations</div>
                    </div>
                </div>

                {/* BOTTOM CTA */}
                <div className="bottom-cta-area">
                    <h2 className="luxury-title-orange">Ready for Your Premium Experience?</h2>
                    <p>Join thousands of satisfied customers who have experienced our premium fleet and exceptional service.</p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className="orange-book-btn" onClick={() => fleetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Book Your Vehicle</button>
                        <button
                            className="orange-book-btn"
                            onClick={() => navigate('/register-vehicle')}
                        >
                            List Your Vehicle
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Rentals;
