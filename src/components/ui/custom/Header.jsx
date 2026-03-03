import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, MapPin, Briefcase, User, Shield, LogOut, Menu, X,
  Plane, Settings
} from 'lucide-react';
import '../../../styles/Header.css';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [location]);

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
              <span>{item.label}</span>
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
