<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useState } from "react";
>>>>>>> 5e87ed998656cb352f41b99d64d5316ed6d361eb
import { useNavigate } from "react-router-dom";
import { setAuth } from "../utils/auth";
import api from "../utils/api";
import { Mail, Lock, LogIn, UserPlus, Plane } from "lucide-react";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      setAuth(res.data.token, res.data.user);

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  const images = [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900",
  ];
  const [currentImage, setCurrentImage] = useState(0);

  // Auto-scroll images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const [accountType, setAccountType] = useState('personal');
  const [showPassword, setShowPassword] = useState(false);

  // derived state for button validation
  const isContinueDisabled = !form.email || form.password.length < 1 || isLoading;

  const inputStyle = {
    border: '1px solid #bfbfbf',
    padding: '10px 12px',
    borderRadius: '0',
    outline: 'none',
    color: '#333',
    background: '#fff',
    fontSize: '14px',
    marginBottom: '16px',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ height: '100vh', background: '#dedede', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal" id="modal">
        <div className="left">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Slide ${idx + 1}`}
              className={idx === currentImage ? "active" : ""}
            />
          ))}

          <button className="arrow left-arrow" onClick={prevImage} type="button">&#10094;</button>
          <button className="arrow right-arrow" onClick={nextImage} type="button">&#10095;</button>

          <div className="dots">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={idx === currentImage ? "active" : ""}
                onClick={() => setCurrentImage(idx)}
              ></span>
            ))}
          </div>
        </div>

        <div className="right">
          <div className="close" id="closeBtn" onClick={() => navigate('/')}>&times;</div>

          <div className="account-toggle">
            <button
              className={`toggle ${accountType === 'personal' ? 'active-personal' : ''}`}
              onClick={() => setAccountType('personal')}
              type="button"
            >
              Personal Account
            </button>
            <button
              className={`toggle ${accountType === 'business' ? 'active-business' : ''}`}
              onClick={() => setAccountType('business')}
              type="button"
            >
              Business Account
            </button>
          </div>

          {error && (
            <div style={{ color: 'red', fontSize: '13px', marginBottom: '10px' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Email */}
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '6px' }}>Email Address</label>
            <input
              type="email"
              id="emailInput"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              style={inputStyle}
            />

            {/* Password */}
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative', marginBottom: '22px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="passwordInput"
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ ...inputStyle, marginBottom: 0, paddingRight: '40px' }}
              />
              <span
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', cursor: 'pointer',
                  fontSize: '16px', opacity: 0.6, userSelect: 'none'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>

            <button type="submit" className="continue" id="continueBtn" disabled={isContinueDisabled}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="divider"><span>Or Login/Sign up</span></div>

          <div className="social">
            <button id="googleBtn" type="button" onClick={() => alert("Google login clicked")}>
              <svg width="22" height="22" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              Google
            </button>
            <button id="emailBtn" type="button" onClick={() => navigate('/login-email')}>
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
                <rect x="4" y="10" width="40" height="28" rx="4" fill="#4285F4" />
                <rect x="4" y="10" width="40" height="28" rx="4" fill="url(#emailGrad)" />
                <path d="M4 14L24 27L44 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="emailGrad" x1="4" y1="10" x2="44" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="100%" stopColor="#EA4335" />
                  </linearGradient>
                </defs>
              </svg>
              Email
            </button>
          </div>

          <div className="footer">
            <span>
              New here?{" "}
              <span
                onClick={() => navigate("/register")}
                style={{ color: "#3b82f6", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                Create Account
              </span>
            </span>
            <br />
            By proceeding, you agree to our Terms of Use and confirm you have read our Privacy and Cookie Statement.
          </div>
=======
  return (
    <div className="login-container">
      <div className="login-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <Plane size={40} className="logo-icon" />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to continue your travel journey</p>
        </div>

        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
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
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <button
              type="button"
              className="register-link"
              onClick={() => navigate("/register")}
            >
              <UserPlus size={16} />
              Create Account
            </button>
          </p>
>>>>>>> 5e87ed998656cb352f41b99d64d5316ed6d361eb
        </div>
      </div>
    </div>
  );
};

export default Login;
