<<<<<<< HEAD
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
=======
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { Mail, Lock, User, UserPlus, Plane, LogIn } from "lucide-react";
>>>>>>> 5e87ed998656cb352f41b99d64d5316ed6d361eb
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();

<<<<<<< HEAD
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [accountType, setAccountType] = useState("personal");
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
=======
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
>>>>>>> 5e87ed998656cb352f41b99d64d5316ed6d361eb
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

<<<<<<< HEAD
    const role = accountType === "business" ? "business" : "user";
    const payload = { ...form, role };

    try {
      await api.post("/auth/register", payload);
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
=======
    try {
      await api.post("/auth/register", form);
      setSuccess("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
>>>>>>> 5e87ed998656cb352f41b99d64d5316ed6d361eb
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
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

          {/* Personal / Business toggle */}
          <div className="reg-account-toggle">
            <button
              type="button"
              className={accountType === "personal" ? "active-personal" : ""}
              onClick={() => setAccountType("personal")}
            >
              Personal Account
            </button>
            <button
              type="button"
              className={accountType === "business" ? "active-business" : ""}
              onClick={() => setAccountType("business")}
            >
              Business Account
            </button>
          </div>

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

          {/* Divider */}
          <div className="reg-divider"><span>Or Sign up with</span></div>

          {/* Social Buttons */}
          <div className="reg-social">
            <button id="reg-googleBtn" type="button" onClick={() => alert("Google sign-up clicked")}>
              <svg width="22" height="22" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              Google
            </button>
            <button id="reg-emailBtn" type="button" onClick={() => navigate("/login-email")}>
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
                <rect x="4" y="10" width="40" height="28" rx="4" fill="url(#regEmailGrad)" />
                <path d="M4 14L24 27L44 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="regEmailGrad" x1="4" y1="10" x2="44" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="100%" stopColor="#EA4335" />
                  </linearGradient>
                </defs>
              </svg>
              Email
            </button>
          </div>

          {/* Footer — switch to login */}
          <div className="reg-footer">
            Already have an account?{" "}
            <span className="reg-login-link" onClick={() => navigate("/login")}>Sign In</span>
          </div>

          <div className="reg-terms">
            By proceeding, you agree to our Terms of Use and confirm you have read our Privacy and Cookie Statement.
          </div>
        </div>

=======
  return (
    <div className="register-container">
      <div className="register-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="register-card">
        <div className="register-header">
          <div className="logo-container">
            <Plane size={40} className="logo-icon" />
          </div>
          <h1>Create Account</h1>
          <p>Join us and start planning your dream trips</p>
        </div>

        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="success-alert">
            <span className="success-icon">✓</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <User size={20} className="input-icon" />
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your name"
                onChange={handleChange}
                value={form.name}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                onChange={handleChange}
                value={form.email}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                onChange={handleChange}
                value={form.password}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <button
              type="button"
              className="login-link"
              onClick={() => navigate("/login")}
            >
              <LogIn size={16} />
              Sign In
            </button>
          </p>
        </div>
>>>>>>> 5e87ed998656cb352f41b99d64d5316ed6d361eb
      </div>
    </div>
  );
};

export default Register;
