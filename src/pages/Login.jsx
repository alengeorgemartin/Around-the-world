import { useState, useEffect } from "react";
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

  return (
    <div className="log-wrapper">
      <div className="log-modal" id="modal">
        <div className="log-left">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Slide ${idx + 1}`}
              className={idx === currentImage ? "active" : ""}
            />
          ))}

          <button className="log-arrow log-left-arrow" onClick={prevImage} type="button">&#10094;</button>
          <button className="log-arrow log-right-arrow" onClick={nextImage} type="button">&#10095;</button>

          <div className="log-dots">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={idx === currentImage ? "active" : ""}
                onClick={() => setCurrentImage(idx)}
              ></span>
            ))}
          </div>
        </div>

        <div className="log-right">
          <div className="log-close" id="closeBtn" onClick={() => navigate('/')}>&times;</div>

          <h2 className="log-title">Welcome Back</h2>
          <p className="log-subtitle">Sign in to your account ✈️</p>

          <div className="log-account-toggle">
            <button
              className={`${accountType === 'personal' ? 'active-personal' : ''}`}
              onClick={() => setAccountType('personal')}
              type="button"
            >
              Personal Account
            </button>
            <button
              className={`${accountType === 'business' ? 'active-business' : ''}`}
              onClick={() => setAccountType('business')}
              type="button"
            >
              Business Account
            </button>
          </div>

          {error && (
            <div className="log-error">⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Email */}
            <label className="log-label">Email Address</label>
            <input
              className="log-input"
              type="email"
              id="emailInput"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            {/* Password */}
            <label className="log-label">Password</label>
            <div className="log-password-wrapper">
              <input
                className="log-input"
                type={showPassword ? 'text' : 'password'}
                id="passwordInput"
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ marginBottom: 0 }}
              />
              <span
                className="log-eye"
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>

            <button type="submit" className="log-continue" id="continueBtn" disabled={isContinueDisabled}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="log-divider"><span>Or Login/Sign up</span></div>

          <div className="log-social">
            <button id="log-googleBtn" type="button" onClick={() => alert("Google login clicked")}>
              <svg width="22" height="22" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              Google
            </button>
            <button id="log-emailBtn" type="button" onClick={() => navigate('/login-email')}>
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

          <div className="log-footer">
            <span>
              New here?{" "}
              <span
                className="log-login-link"
                onClick={() => navigate("/register")}
              >
                Create Account
              </span>
            </span>
          </div>
          <div className="log-terms">
            By proceeding, you agree to our Terms of Use and confirm you have read our Privacy and Cookie Statement.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
