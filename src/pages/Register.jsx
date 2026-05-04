import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const images = [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900",
  ];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const payload = { ...form };

    try {
      await api.post("/auth/register", payload);
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isContinueDisabled = !form.email || form.password.length < 6 || isLoading;

  return (
    <div className="reg-wrapper">
      <div className="reg-modal">

        {/* LEFT — image slideshow */}
        <div className="reg-left">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Slide ${idx + 1}`}
              className={idx === currentImage ? "active" : ""}
            />
          ))}
          <button className="reg-arrow reg-left-arrow" onClick={prevImage} type="button">&#10094;</button>
          <button className="reg-arrow reg-right-arrow" onClick={nextImage} type="button">&#10095;</button>
          <div className="reg-dots">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={idx === currentImage ? "active" : ""}
                onClick={() => setCurrentImage(idx)}
              />
            ))}
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="reg-right">
          <div className="reg-close" onClick={() => navigate("/")}>&#x00D7;</div>

          <h2 className="reg-title">Create Account</h2>
          <p className="reg-subtitle">Start planning your dream trips ✈️</p>



          {error && <div className="reg-error">⚠️ {error}</div>}
          {success && <div className="reg-success">✓ {success}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            {/* Full Name */}
            <label className="reg-label">Full Name</label>
            <input
              className="reg-input"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />

            {/* Email Address */}
            <label className="reg-label">Email Address</label>
            <input
              className="reg-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            {/* Password */}
            <label className="reg-label">Password</label>
            <div className="reg-password-wrapper">
              <input
                className="reg-input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                style={{ marginBottom: 0 }}
              />
              <span
                className="reg-eye"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>

            <button
              type="submit"
              className="reg-continue"
              disabled={isContinueDisabled}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>



          {/* Footer — switch to login */}
          <div className="reg-footer">
            Already have an account?{" "}
            <span className="reg-login-link" onClick={() => navigate("/login")}>Sign In</span>
          </div>

          <div className="reg-terms">
            By proceeding, you agree to our Terms of Use and confirm you have read our Privacy and Cookie Statement.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
