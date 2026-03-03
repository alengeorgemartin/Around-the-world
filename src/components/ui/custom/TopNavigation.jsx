import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, UserCircle } from 'lucide-react';
import '../../../styles/TopNavigation.css';

const TopNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

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
        setShowProfileMenu(false);
        navigate('/');
    };

    const navTabs = [
        { label: 'Home', path: '/' },
        { label: 'Trip Planner', path: '/create-trip' },
        { label: 'myTrip', path: '/my-trips' },
        { label: 'more', path: '#' },
    ];

    const isActiveTab = (path) => {
        if (path === '/') return location.pathname === '/';
        if (path === '/create-trip') return location.pathname === '/create-trip';
        if (path === '/my-trips') return location.pathname === '/my-trips';
        return false;
    };

    return (
        <div className="top-navigation">
            <div className="nav-tabs">
                {navTabs.map((tab, index) => (
                    <div
                        key={index}
                        className={`nav-tab ${isActiveTab(tab.path) ? 'active' : ''}`}
                        onClick={() => tab.path !== '#' && navigate(tab.path)}
                        style={{ cursor: tab.path !== '#' ? 'pointer' : 'default' }}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>
            <div className="nav-actions">
                <button className="lang-btn">
                    <i className="fa-solid fa-globe"></i> Eng
                </button>
                {user ? (
                    <div className="profile-menu-container">
                        <button
                            className="profile-btn"
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            title={user.name}
                        >
                            <User size={20} />
                            <span className="profile-name">{user.name}</span>
                        </button>
                        {showProfileMenu && (
                            <div className="profile-dropdown">
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        navigate("/profile");
                                    }}
                                >
                                    <UserCircle size={18} />
                                    <span>View Profile</span>
                                </button>
                                <button
                                    className="dropdown-item logout"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button className="signin-btn" onClick={() => navigate("/login")}>
                        Sign in
                    </button>
                )}
            </div>
        </div>
    );
};

export default TopNavigation;
