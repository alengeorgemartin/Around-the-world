import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/RegisterBusiness.css";

const VEHICLE_TYPES = ["Car", "SUV", "Bike", "Scooter", "Van", "Bus"];

const initialForm = {
    name: "",
    description: "",
    vehicleType: "Car",
    model: "",
    capacity: 4,
    features: "",
    pricePerDay: "",
    address: "",
    city: "Munnar",
    state: "Kerala",
    phone: "",
    email: "",
    website: "",
    photoUrl: "",
};

export default function RegisterBusiness() {
    const navigate = useNavigate();
    const [form, setForm] = useState(initialForm);
    const [cars, setCars] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState(1); // 1: business info, 2: add cars, 3: done

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const addCar = () => {
        if (!form.model || !form.pricePerDay) {
            setError("Please fill in Vehicle Model and Price per Day before adding.");
            return;
        }
        setError("");
        setCars([...cars, {
            id: Date.now(),
            name: form.name || form.model,
            vehicleType: form.vehicleType,
            model: form.model,
            capacity: Number(form.capacity),
            features: form.features.split(",").map(f => f.trim()).filter(Boolean),
            pricePerDay: Number(form.pricePerDay),
            address: form.address,
            city: form.city,
            state: form.state,
            phone: form.phone,
            email: form.email,
            website: form.website,
            photoUrl: form.photoUrl,
        }]);
        // Reset car-specific fields
        setForm(f => ({ ...f, model: "", features: "", pricePerDay: "", photoUrl: "", capacity: 4, vehicleType: "Car" }));
    };

    const removeCar = (id) => setCars(cars.filter(c => c.id !== id));

    const handleSubmit = async () => {
        if (cars.length === 0) {
            setError("Please add at least one vehicle before submitting.");
            return;
        }
        if (!form.address || !form.city || !form.phone) {
            setError("Please fill in address and contact details.");
            return;
        }
        setError("");
        setSubmitting(true);
        const results = [];

        for (const car of cars) {
            try {
                const payload = {
                    businessType: "rental",
                    name: car.name,
                    description: form.description || `${car.vehicleType} rental — ${car.model}`,
                    location: {
                        address: car.address,
                        city: car.city,
                        state: car.state,
                        country: "India",
                    },
                    priceRange: car.pricePerDay < 1500 ? "budget" : car.pricePerDay < 4000 ? "moderate" : "luxury",
                    pricePerDay: car.pricePerDay,
                    rentalDetails: {
                        vehicleType: car.vehicleType,
                        model: car.model,
                        capacity: car.capacity,
                        features: car.features,
                    },
                    contact: {
                        phone: car.phone,
                        email: car.email,
                        website: car.website,
                    },
                    photos: car.photoUrl ? [car.photoUrl] : [],
                };
                const res = await api.post("/businesses/register", payload);
                if (res.data.success) results.push(car.model);
            } catch (err) {
                console.error("Error registering:", car.model, err);
            }
        }
        setSubmitting(false);
        if (results.length > 0) {
            setSuccess(true);
            setStep(3);
        } else {
            setError("Submission failed. Make sure you are logged in and try again.");
        }
    };

    if (step === 3 || success) {
        return (
            <div className="rb-page">
                <div className="rb-success-card">
                    <div className="rb-success-icon">✅</div>
                    <h2>Vehicles Submitted!</h2>
                    <p>Your car listings have been submitted for admin approval. You'll be notified once they go live.</p>
                    <button className="rb-btn-primary" onClick={() => navigate("/rentals")}>Back to Rentals</button>
                </div>
            </div>
        );
    }

    return (
        <div className="rb-page">
            <div className="rb-container">
                {/* Header */}
                <div className="rb-header">
                    <button className="rb-back" onClick={() => navigate(-1)}>← Back</button>
                    <div className="rb-title-group">
                        <span className="rb-badge">INDUZ CARZ</span>
                        <h1>List Your Vehicles</h1>
                        <p>Add your rental cars to the platform and start earning</p>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="rb-steps">
                    <div className={`rb-step ${step >= 1 ? "active" : ""}`}><span>1</span> Business Info</div>
                    <div className="rb-step-line"></div>
                    <div className={`rb-step ${step >= 2 ? "active" : ""}`}><span>2</span> Add Vehicles</div>
                    <div className="rb-step-line"></div>
                    <div className={`rb-step ${step >= 3 ? "active" : ""}`}><span>3</span> Done</div>
                </div>

                {error && <div className="rb-error">{error}</div>}

                {/* STEP 1 */}
                {step === 1 && (
                    <div className="rb-card">
                        <h2 className="rb-section-title">Business Details</h2>
                        <div className="rb-form-grid">
                            <div className="rb-form-group rb-full">
                                <label>Business / Brand Name *</label>
                                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Munnar Speed Rentals" className="rb-input" />
                            </div>
                            <div className="rb-form-group rb-full">
                                <label>Description</label>
                                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Tell customers about your rental service..." className="rb-input rb-textarea" rows={3} />
                            </div>
                            <div className="rb-form-group rb-full">
                                <label>Address *</label>
                                <input name="address" value={form.address} onChange={handleChange} placeholder="Street address" className="rb-input" />
                            </div>
                            <div className="rb-form-group">
                                <label>City *</label>
                                <input name="city" value={form.city} onChange={handleChange} className="rb-input" />
                            </div>
                            <div className="rb-form-group">
                                <label>State</label>
                                <input name="state" value={form.state} onChange={handleChange} className="rb-input" />
                            </div>
                            <div className="rb-form-group">
                                <label>Phone *</label>
                                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" className="rb-input" />
                            </div>
                            <div className="rb-form-group">
                                <label>Email</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="contact@yourcompany.com" className="rb-input" />
                            </div>
                            <div className="rb-form-group rb-full">
                                <label>Website (optional)</label>
                                <input name="website" value={form.website} onChange={handleChange} placeholder="https://yourwebsite.com" className="rb-input" />
                            </div>
                        </div>
                        <button
                            className="rb-btn-primary"
                            onClick={() => {
                                if (!form.name || !form.address || !form.phone) {
                                    setError("Please fill in Business Name, Address, and Phone.");
                                    return;
                                }
                                setError("");
                                setStep(2);
                            }}
                        >
                            Next: Add Vehicles →
                        </button>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div>
                        {/* Add Car Form */}
                        <div className="rb-card">
                            <h2 className="rb-section-title">Add a Vehicle</h2>
                            <div className="rb-form-grid">
                                <div className="rb-form-group">
                                    <label>Vehicle Type</label>
                                    <select name="vehicleType" value={form.vehicleType} onChange={handleChange} className="rb-input">
                                        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="rb-form-group">
                                    <label>Model / Make *</label>
                                    <input name="model" value={form.model} onChange={handleChange} placeholder="e.g. Toyota Corolla" className="rb-input" />
                                </div>
                                <div className="rb-form-group">
                                    <label>Display Name</label>
                                    <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Corolla Premium" className="rb-input" />
                                </div>
                                <div className="rb-form-group">
                                    <label>Seating Capacity</label>
                                    <input name="capacity" type="number" min="1" max="50" value={form.capacity} onChange={handleChange} className="rb-input" />
                                </div>
                                <div className="rb-form-group">
                                    <label>Price Per Day (₹) *</label>
                                    <input name="pricePerDay" type="number" value={form.pricePerDay} onChange={handleChange} placeholder="2500" className="rb-input" />
                                </div>
                                <div className="rb-form-group rb-full">
                                    <label>Features (comma separated)</label>
                                    <input name="features" value={form.features} onChange={handleChange} placeholder="AC, GPS, Bluetooth, Sunroof" className="rb-input" />
                                </div>
                                <div className="rb-form-group rb-full">
                                    <label>Car Photo URL (optional)</label>
                                    <input name="photoUrl" value={form.photoUrl} onChange={handleChange} placeholder="https://... or /images/car1-vw.png" className="rb-input" />
                                </div>
                                {form.photoUrl && (
                                    <div className="rb-form-group rb-full">
                                        <div className="rb-preview-img-wrap">
                                            <img src={form.photoUrl} alt="preview" className="rb-preview-img" onError={e => e.target.style.display = 'none'} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button className="rb-btn-add" onClick={addCar}>
                                + Add This Vehicle
                            </button>
                        </div>

                        {/* Cars List */}
                        {cars.length > 0 && (
                            <div className="rb-card rb-cars-list">
                                <h2 className="rb-section-title">Added Vehicles ({cars.length})</h2>
                                <div className="rb-cars-grid">
                                    {cars.map(car => (
                                        <div key={car.id} className="rb-car-item">
                                            <div className="rb-car-img-wrap">
                                                {car.photoUrl
                                                    ? <img src={car.photoUrl} alt={car.model} onError={e => e.target.src = '/images/car4-camaro.png'} />
                                                    : <div className="rb-car-img-placeholder"><i className="fas fa-car"></i></div>
                                                }
                                            </div>
                                            <div className="rb-car-info">
                                                <strong>{car.name || car.model}</strong>
                                                <span>{car.vehicleType} · {car.capacity} seats</span>
                                                <span className="rb-car-price">₹{Number(car.pricePerDay).toLocaleString()}/day</span>
                                            </div>
                                            <button className="rb-remove-btn" onClick={() => removeCar(car.id)}>✕</button>
                                        </div>
                                    ))}
                                </div>

                                <div className="rb-submit-row">
                                    <button className="rb-btn-secondary" onClick={() => setStep(1)}>← Back</button>
                                    <button className="rb-btn-primary" onClick={handleSubmit} disabled={submitting}>
                                        {submitting ? "Submitting..." : `Submit ${cars.length} Vehicle${cars.length > 1 ? "s" : ""} for Approval`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {cars.length === 0 && (
                            <div className="rb-empty-hint">
                                <i className="fas fa-car"></i>
                                <p>No vehicles added yet. Fill in the form above and click "Add This Vehicle".</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
