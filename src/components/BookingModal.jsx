import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, MapPin, DollarSign, Check } from 'lucide-react';
import '../styles/BookingModal.css';

const BookingModal = ({ isOpen, onClose, onSubmit, booking }) => {
    const [formData, setFormData] = useState({
        checkIn: '',
        checkOut: '',
        guests: 2,
        participants: 1,
        pickupLocation: '',
        returnLocation: '',
        specialRequests: '',
        contactPhone: '',
        contactEmail: '',
    });

    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        if (booking && isOpen) {
            setFormData(prev => ({
                ...prev,
                checkIn: booking.suggestedCheckIn || '',
                checkOut: booking.suggestedCheckOut || '',
                pickupLocation: booking.location || '',
                returnLocation: booking.location || '',
            }));
        }
    }, [booking, isOpen]);

    if (!isOpen || !booking) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!agreedToTerms) {
            alert('Please agree to the terms and conditions');
            return;
        }
        onSubmit({
            ...booking,
            ...formData,
            contactInfo: {
                phone: formData.contactPhone,
                email: formData.contactEmail,
            },
        });
    };

    const calculateNights = () => {
        if (!formData.checkIn || !formData.checkOut) return 0;
        const start = new Date(formData.checkIn);
        const end = new Date(formData.checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const calculateTotal = () => {
        const nights = calculateNights();
        if (nights === 0) return booking.basePrice || 0;
        return booking.basePrice * nights;
    };

    return (
        <div className="booking-modal-overlay" onClick={onClose}>
            <div className="booking-modal-content" onClick={e => e.stopPropagation()}>
                <div className="booking-modal-header">
                    <h2>Complete Your Booking</h2>
                    <button className="booking-modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="booking-business-info">
                    <h3>{booking.businessName}</h3>
                    <p className="booking-type-badge">{booking.bookingType?.toUpperCase()}</p>
                    {booking.roomType && <p className="booking-room-type">Room: {booking.roomType}</p>}
                    {booking.vehicleType && <p className="booking-vehicle-type">Vehicle: {booking.vehicleType}</p>}
                </div>

                <form onSubmit={handleSubmit} className="booking-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label><Calendar size={18} /> Check-in</label>
                            <input
                                type="date"
                                value={formData.checkIn}
                                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="form-group">
                            <label><Calendar size={18} /> Check-out</label>
                            <input
                                type="date"
                                value={formData.checkOut}
                                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                                required
                                min={formData.checkIn || new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    {booking.bookingType === 'hotel' && (
                        <div className="form-group">
                            <label><Users size={18} /> Number of Guests</label>
                            <input
                                type="number"
                                value={formData.guests}
                                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                                min="1"
                                max="10"
                                required
                            />
                        </div>
                    )}

                    {booking.bookingType === 'rental' && (
                        <>
                            <div className="form-group">
                                <label><MapPin size={18} /> Pickup Location</label>
                                <input
                                    type="text"
                                    value={formData.pickupLocation}
                                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                                    placeholder="Where should we pick you up?"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label><MapPin size={18} /> Return Location</label>
                                <input
                                    type="text"
                                    value={formData.returnLocation}
                                    onChange={(e) => setFormData({ ...formData, returnLocation: e.target.value })}
                                    placeholder="Where will you return the vehicle?"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {booking.bookingType === 'tour' && (
                        <div className="form-group">
                            <label><Users size={18} /> Number of Participants</label>
                            <input
                                type="number"
                                value={formData.participants}
                                onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) })}
                                min="1"
                                max="20"
                                required
                            />
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Phone</label>
                            <input
                                type="tel"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                placeholder="+91 XXXXX XXXXX"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Contact Email</label>
                            <input
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Special Requests (Optional)</label>
                        <textarea
                            value={formData.specialRequests}
                            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                            placeholder="Any special requirements or preferences..."
                            rows="3"
                        />
                    </div>

                    <div className="booking-price-summary">
                        <div className="price-row">
                            <span>Base Price ({booking.bookingType === 'hotel' ? 'per night' : 'per day'})</span>
                            <span>₹{booking.basePrice}</span>
                        </div>
                        {calculateNights() > 0 && (
                            <div className="price-row">
                                <span>{calculateNights()} {booking.bookingType === 'hotel' ? 'nights' : 'days'}</span>
                                <span>×</span>
                            </div>
                        )}
                        <div className="price-row price-total">
                            <span>Total Amount</span>
                            <span className="total-price">₹{calculateTotal()}</span>
                        </div>
                    </div>

                    <label className="terms-checkbox">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                        />
                        <span>I agree to the terms and conditions</span>
                    </label>

                    <div className="booking-modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-confirm" disabled={!agreedToTerms}>
                            <Check size={18} />
                            Confirm Booking
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;
