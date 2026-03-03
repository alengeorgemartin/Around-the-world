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
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e"
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
  const [mobileNumber, setMobileNumber] = useState('');

  const handleMobileChange = (e) => {
    setMobileNumber(e.target.value);
    handleChange(e); // Keep form sync for later auth uses
  };

  // derived state for button validation
  const isContinueDisabled = mobileNumber.length < 10 || isLoading;

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
            <label>Mobile Number</label>
            <div className="input-wrapper">
              <div className="code">+91</div>
              <input
                type="text"
                id="mobileInput"
                placeholder="Enter Mobile Number"
                name="email" /* temporarily binding to 'email' logic for backend */
                value={mobileNumber}
                onChange={handleMobileChange}
              />
            </div>

            {/* hidden generic password field to satisfy potential backend validation momentarily */}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              style={{ display: 'none' }}
            />

            <button type="submit" className="continue" id="continueBtn" disabled={isContinueDisabled}>
              {isLoading ? "Signing in..." : "Continue"}
            </button>
          </form>

          <div className="divider"><span>Or Login/Sign up</span></div>

          <div className="social">
            <button id="googleBtn" type="button" onClick={() => alert("Google login clicked")}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" width="16" height="16" />
              Google
            </button>
            <button id="emailBtn" type="button" onClick={() => navigate('/login-email')}>
              <div style={{ display: 'inline-flex', width: 16, height: 16, position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              Email
            </button>
          </div>

          <div className="footer">
            By proceeding, you agree to our Terms of Use and confirm you have read our Privacy and Cookie Statement.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
