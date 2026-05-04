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
