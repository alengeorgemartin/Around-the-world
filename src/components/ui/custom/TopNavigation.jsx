import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, UserCircle, CalendarCheck } from 'lucide-react';
import api from '../../../utils/api';
import '../../../styles/TopNavigation.css';

const TopNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
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

            setPendingBookingsCount(totalPending);
        } catch (error) {
            console.error("Error fetching pending bookings for badge", error);
        }
    };

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
                            style={{ position: 'relative' }}
                        >
                            <User size={20} />
                            <span className="profile-name">{user.name}</span>
                            {pendingBookingsCount > 0 && (
                                <span className="notification-badge" style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    right: '-5px',
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
                                    height: '20px',
                                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
                                }}>
                                    {pendingBookingsCount}
                                </span>
                            )}
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
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        // Pass state so the Profile component knows to open the bookings tab
                                        navigate("/profile", { state: { activeTab: 'bookings' } });
                                    }}
                                >
                                    <CalendarCheck size={18} />
                                    <span>Bookings</span>
                                    {pendingBookingsCount > 0 && (
                                        <span style={{
                                            marginLeft: 'auto',
                                            background: '#ef4444',
                                            color: '#fff',
                                            borderRadius: '50%',
                                            width: '18px',
                                            height: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '10px',
                                            fontWeight: 'bold'
                                        }}>
                                            {pendingBookingsCount}
                                        </span>
                                    )}
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
