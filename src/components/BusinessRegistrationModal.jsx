import React, { useState } from 'react';
import { X, Hotel, Car, Map, MapPin } from 'lucide-react';
import '../styles/BusinessModal.css';

const BusinessRegistrationModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        businessType: 'hotel',
        name: '',
        description: '',
        location: {
            address: '',
            city: '',
            state: '',
        },
        priceRange: 'moderate',
        pricePerNight: '',
        pricePerDay: '',
        contact: {
            phone: '',
            email: '',
        },
        // Type-specific fields
        hotelDetails: {
            starRating: 3,
            amenities: [],
            rooms: [{
                type: '',
                pricePerNight: '',
                capacity: 2,
                bedType: '',
                amenitiesStr: '',
                available: true
            }],
        },
        rentalDetails: {
            vehicleType: '',
            model: '',
            capacity: 2,
        },
        tourDetails: {
            tourType: '',
            duration: '',
            groupSize: '',
        },
    });

    const [amenities, setAmenities] = useState('');
    const [roomTypes, setRoomTypes] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Process data based on business type
        const processedData = { ...formData };

        if (formData.businessType === 'hotel') {
            // Process hotel-level amenities
            processedData.hotelDetails.amenities = amenities.split(',').map(a => a.trim()).filter(Boolean);

            // Process each room's amenities and ensure required fields
            processedData.hotelDetails.rooms = formData.hotelDetails.rooms.map(room => ({
                type: room.type,
                pricePerNight: Number(room.pricePerNight),
                capacity: Number(room.capacity) || 2,
                bedType: room.bedType || '',
                amenities: room.amenitiesStr ? room.amenitiesStr.split(',').map(a => a.trim()).filter(Boolean) : [],
                available: true,
                description: ''
            }));

            // Remove amenitiesStr from rooms as it's just for UI
            processedData.hotelDetails.rooms.forEach(room => delete room.amenitiesStr);
        }

        onSubmit(processedData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Register Your Business</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="business-form">
                    {/* Business Type */}
                    <div className="form-section">
                        <label className="form-label">Business Type *</label>
                        <div className="business-type-selector">
                            <button
                                type="button"
                                className={`type-btn ${formData.businessType === 'hotel' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, businessType: 'hotel' })}
                            >
                                <Hotel size={24} />
                                Hotel
                            </button>
                            <button
                                type="button"
                                className={`type-btn ${formData.businessType === 'rental' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, businessType: 'rental' })}
                            >
                                <Car size={24} />
                                Vehicle Rental
                            </button>
                            <button
                                type="button"
                                className={`type-btn ${formData.businessType === 'tour' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, businessType: 'tour' })}
                            >
                                <Map size={24} />
                                Tour Package
                            </button>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="form-section">
                        <h3>Basic Information</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Business Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Seaside Paradise Resort"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Description *</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    maxLength={500}
                                    rows={3}
                                    placeholder="Describe your business..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="form-section">
                        <h3><MapPin size={18} /> Location</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Address *</label>
                                <input
                                    type="text"
                                    name="location.address"
                                    value={formData.location.address}
                                    onChange={handleChange}
                                    required
                                    placeholder="Street address"
                                />
                            </div>
                            <div className="form-group">
                                <label>City *</label>
                                <input
                                    type="text"
                                    name="location.city"
                                    value={formData.location.city}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Goa"
                                />
                            </div>
                            <div className="form-group">
                                <label>State *</label>
                                <input
                                    type="text"
                                    name="location.state"
                                    value={formData.location.state}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Goa"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="form-section">
                        <h3>Pricing</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Price Range *</label>
                                <select name="priceRange" value={formData.priceRange} onChange={handleChange} required>
                                    <option value="budget">Budget</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="luxury">Luxury</option>
                                </select>
                            </div>
                            {formData.businessType === 'hotel' && (
                                <div className="form-group">
                                    <label>Price per Night (₹) *</label>
                                    <input
                                        type="number"
                                        name="pricePerNight"
                                        value={formData.pricePerNight}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., 3500"
                                    />
                                </div>
                            )}
                            {(formData.businessType === 'rental' || formData.businessType === 'tour') && (
                                <div className="form-group">
                                    <label>Price per Day (₹) *</label>
                                    <input
                                        type="number"
                                        name="pricePerDay"
                                        value={formData.pricePerDay}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., 800"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Type-Specific Fields */}
                    {formData.businessType === 'hotel' && (
                        <div className="form-section">
                            <h3>Hotel Details</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Star Rating</label>
                                    <select
                                        name="hotelDetails.starRating"
                                        value={formData.hotelDetails.starRating}
                                        onChange={handleChange}
                                    >
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <option key={n} value={n}>{n} Star</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Hotel Amenities (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={amenities}
                                        onChange={(e) => setAmenities(e.target.value)}
                                        placeholder="WiFi, Pool, Spa, Parking"
                                    />
                                </div>
                            </div>

                            {/* Room Types Section */}
                            <div className="rooms-section">
                                <h4 className="rooms-header">Room Types & Pricing</h4>
                                <p className="rooms-description">Add all available room types with their individual pricing</p>

                                {formData.hotelDetails.rooms.map((room, index) => (
                                    <div key={index} className="room-entry">
                                        <div className="room-entry-header">
                                            <span className="room-number">Room Type {index + 1}</span>
                                            {formData.hotelDetails.rooms.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-remove-room"
                                                    onClick={() => {
                                                        const newRooms = formData.hotelDetails.rooms.filter((_, i) => i !== index);
                                                        setFormData({
                                                            ...formData,
                                                            hotelDetails: { ...formData.hotelDetails, rooms: newRooms }
                                                        });
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Room Type Name *</label>
                                                <input
                                                    type="text"
                                                    value={room.type}
                                                    onChange={(e) => {
                                                        const newRooms = [...formData.hotelDetails.rooms];
                                                        newRooms[index].type = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            hotelDetails: { ...formData.hotelDetails, rooms: newRooms }
                                                        });
                                                    }}
                                                    required
                                                    placeholder="e.g., Standard AC, Deluxe Non-AC, Suite"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Price per Night (₹) *</label>
                                                <input
                                                    type="number"
                                                    value={room.pricePerNight}
                                                    onChange={(e) => {
                                                        const newRooms = [...formData.hotelDetails.rooms];
                                                        newRooms[index].pricePerNight = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            hotelDetails: { ...formData.hotelDetails, rooms: newRooms }
                                                        });
                                                    }}
                                                    required
                                                    placeholder="e.g., 2500"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Capacity (guests)</label>
                                                <input
                                                    type="number"
                                                    value={room.capacity}
                                                    onChange={(e) => {
                                                        const newRooms = [...formData.hotelDetails.rooms];
                                                        newRooms[index].capacity = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            hotelDetails: { ...formData.hotelDetails, rooms: newRooms }
                                                        });
                                                    }}
                                                    min="1"
                                                    placeholder="e.g., 2"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Bed Type</label>
                                                <select
                                                    value={room.bedType || ''}
                                                    onChange={(e) => {
                                                        const newRooms = [...formData.hotelDetails.rooms];
                                                        newRooms[index].bedType = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            hotelDetails: { ...formData.hotelDetails, rooms: newRooms }
                                                        });
                                                    }}
                                                >
                                                    <option value="">Select bed type</option>
                                                    <option value="Single">Single</option>
                                                    <option value="Double">Double</option>
                                                    <option value="King">King</option>
                                                    <option value="Twin">Twin</option>
                                                </select>
                                            </div>

                                            <div className="form-group full-width">
                                                <label>Room Amenities (comma-separated)</label>
                                                <input
                                                    type="text"
                                                    value={room.amenitiesStr || ''}
                                                    onChange={(e) => {
                                                        const newRooms = [...formData.hotelDetails.rooms];
                                                        newRooms[index].amenitiesStr = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            hotelDetails: { ...formData.hotelDetails, rooms: newRooms }
                                                        });
                                                    }}
                                                    placeholder="AC, WiFi, TV, Mini Bar, Balcony"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    className="btn-add-room"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            hotelDetails: {
                                                ...formData.hotelDetails,
                                                rooms: [
                                                    ...formData.hotelDetails.rooms,
                                                    {
                                                        type: '',
                                                        pricePerNight: '',
                                                        capacity: 2,
                                                        bedType: '',
                                                        amenitiesStr: '',
                                                        available: true
                                                    }
                                                ]
                                            }
                                        });
                                    }}
                                >
                                    + Add Another Room Type
                                </button>
                            </div>
                        </div>
                    )}

                    {formData.businessType === 'rental' && (
                        <div className="form-section">
                            <h3>Rental Details</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Vehicle Type *</label>
                                    <select
                                        name="rentalDetails.vehicleType"
                                        value={formData.rentalDetails.vehicleType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select type</option>
                                        <option value="Car">Car</option>
                                        <option value="SUV">SUV</option>
                                        <option value="Bike">Bike</option>
                                        <option value="Scooter">Scooter</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Model</label>
                                    <input
                                        type="text"
                                        name="rentalDetails.model"
                                        value={formData.rentalDetails.model}
                                        onChange={handleChange}
                                        placeholder="e.g., Honda Activa"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Capacity (persons)</label>
                                    <input
                                        type="number"
                                        name="rentalDetails.capacity"
                                        value={formData.rentalDetails.capacity}
                                        onChange={handleChange}
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {formData.businessType === 'tour' && (
                        <div className="form-section">
                            <h3>Tour Details</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Tour Type *</label>
                                    <select
                                        name="tourDetails.tourType"
                                        value={formData.tourDetails.tourType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select type</option>
                                        <option value="Adventure">Adventure</option>
                                        <option value="Cultural">Cultural</option>
                                        <option value="Nature">Nature</option>
                                        <option value="Food">Food</option>
                                        <option value="Historical">Historical</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Duration</label>
                                    <input
                                        type="text"
                                        name="tourDetails.duration"
                                        value={formData.tourDetails.duration}
                                        onChange={handleChange}
                                        placeholder="e.g., Half Day, Full Day"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Group Size</label>
                                    <input
                                        type="text"
                                        name="tourDetails.groupSize"
                                        value={formData.tourDetails.groupSize}
                                        onChange={handleChange}
                                        placeholder="e.g., Solo friendly, Groups"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact Information */}
                    <div className="form-section">
                        <h3>Contact Information</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Phone *</label>
                                <input
                                    type="tel"
                                    name="contact.phone"
                                    value={formData.contact.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="+91-XXXXXXXXXX"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="contact.email"
                                    value={formData.contact.email}
                                    onChange={handleChange}
                                    placeholder="contact@business.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit">
                            Register Business
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusinessRegistrationModal;
