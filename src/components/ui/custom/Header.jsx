import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, MapPin, Briefcase, User, Shield, LogOut, Menu, X,
  Plane, Settings, Bell
} from 'lucide-react';
import api from '../../../utils/api';
import '../../../styles/Header.css';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchPendingBookings();
    }
  }, [location]);

  const fetchPendingBookings = async () => {
    try {
      // Fetch both user bookings and business bookings to show a combined badge count
      let totalPending = 0;

      const userRes = await api.get('/bookings/my-bookings');
      if (userRes.data && userRes.data.success) {
        const pendingUser = userRes.data.data.filter(b => b.status === "pending").length;
        totalPending += pendingUser;
      }

      const parsedUser = JSON.parse(localStorage.getItem('user'));
      if (parsedUser && (parsedUser.role === 'admin' || parsedUser.role === 'business')) {
        const bizRes = await api.get('/bookings/business/my-bookings');
        if (bizRes.data && bizRes.data.success && bizRes.data.allBookings) {
          const pendingBiz = bizRes.data.allBookings.filter(b => b.status === "pending").length;
          totalPending += pendingBiz;
        }
      }

      console.log('Total pending bookings calculated:', totalPending);
      setPendingBookingsCount(totalPending);
    } catch (error) {
      console.error("Error fetching pending bookings for badge", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Dynamic navigation items based on authentication
  const navItems = user
    ? [
      { path: '/', label: 'Home', icon: Home },
      { path: '/create-trip', label: 'Plan Trip', icon: Plane },
      { path: '/profile', label: 'Profile', icon: User },
    ]
    : [
      { path: '/', label: 'Home', icon: Home },
      { path: '/create-trip', label: 'Plan Trip', icon: Plane },
      { path: '/login', label: 'Sign In', icon: User },
    ];

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo" onClick={() => navigate('/')}>
          <div className="logo-icon">
            <Plane size={28} />
          </div>
          <span className="logo-text">AI Travel Planner</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navItems.map((item, index) => (
            <button
              key={`${item.path}-${index}`}
              className={`nav-link ${isActive(item.path)}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={18} />
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {item.label}
                {item.label === 'Profile' && pendingBookingsCount > 0 && (
                  <span className="notification-badge" style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    lineHeight: '1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                    height: '20px'
                  }}>
                    {pendingBookingsCount}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav">
          {navItems.map((item, index) => (
            <button
              key={`${item.path}-${index}`}
              className={`mobile-nav-link ${isActive(item.path)}`}
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

export default Header;
