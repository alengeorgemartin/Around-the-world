import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, User, Mail, Calendar, MapPin, Heart, Plane, Camera, Award,
  Target, TrendingUp, Star, Globe, Compass, Mountain, Edit2, Check, X,
  Plus, Flag, Sparkles, Trophy, Building2, Hotel, Car, Map, CalendarCheck
} from 'lucide-react';
import '../styles/Profile.css';
import BusinessRegistrationModal from '../components/BusinessRegistrationModal';
import ManageBookings from './ManageBookings';
import UserBookings from './UserBookings';
import api from '../utils/api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    tripsPlanned: 0,
    citiesVisited: 0,
    countriesExplored: 0,
    photosShared: 0
  });
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
  const [editingPreference, setEditingPreference] = useState(null);
  const [bucketList, setBucketList] = useState([
    { id: 1, destination: 'Machu Picchu, Peru', completed: false },
    { id: 2, destination: 'Northern Lights, Iceland', completed: true },
    { id: 3, destination: 'Great Barrier Reef, Australia', completed: false },
    { id: 4, destination: 'Safari in Kenya', completed: false }
  ]);
  const [newBucketItem, setNewBucketItem] = useState('');
  const [preferences, setPreferences] = useState(['Adventure', 'Culture', 'Food', 'Nature', 'Beach', 'Mountains', 'Cities', 'Wildlife']);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [tempPreferences, setTempPreferences] = useState([]);
  const statsAnimated = useRef(false);

  // My Businesses State
  const [businesses, setBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);

  // Package Creation State
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [userPackages, setUserPackages] = useState([]);
  const [newPackage, setNewPackage] = useState({
    title: '',
    location: '',
    duration: '',
    price: '',
    originalPrice: '',
    category: 'Adventure',
    description: '',
    highlights: [],
    includes: [],
    image: null,
    images: []
  });
  const [highlightInput, setHighlightInput] = useState('');
  const [includeInput, setIncludeInput] = useState('');

  const allPreferenceOptions = [
    'Adventure', 'Culture', 'Food', 'Nature', 'Beach', 'Mountains',
    'Cities', 'Wildlife', 'Shopping', 'Photography', 'Hiking', 'Nightlife',
    'Relaxation', 'Heritage', 'Sports', 'Art & Museums'
  ];

  // Conflicting preferences - can't be selected together
  const CONFLICTING_PREFERENCES = {
    'Adventure': ['Relaxation'],
    'Relaxation': ['Adventure', 'Nightlife', 'Sports'],
    'Nightlife': ['Relaxation', 'Nature'],
    'Nature': ['Nightlife', 'Cities'],
    'Cities': ['Nature'],
    'Shopping': ['Hiking', 'Wildlife'],
    'Hiking': ['Shopping'],
    'Wildlife': ['Shopping'],
  };

  // Travel Achievements
  const achievements = [
    { id: 1, name: 'Globetrotter', icon: '🌍', description: 'Visited 5 countries', unlocked: true },
    { id: 2, name: 'City Explorer', icon: '🏙️', description: 'Explored 20 cities', unlocked: true },
    { id: 3, name: 'Photo Master', icon: '📸', description: 'Shared 100 photos', unlocked: true },
    { id: 4, name: 'Adventure Seeker', icon: '⛰️', description: 'Complete 10 adventures', unlocked: false },
    { id: 5, name: 'Culture Enthusiast', icon: '🎭', description: 'Visit 15 museums', unlocked: false }
  ];

  // Travel Goals with progress
  const [travelGoals, setTravelGoals] = useState([
    { id: 1, goal: 'Visit 10 countries', current: 8, target: 10, category: 'Countries' },
    { id: 2, goal: 'Plan 20 trips', current: 12, target: 20, category: 'Trips' },
    { id: 3, goal: 'Share 200 photos', current: 156, target: 200, category: 'Photos' }
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Animate stats counter
      if (!statsAnimated.current) {
        statsAnimated.current = true;
        animateStats({
          tripsPlanned: 12,
          citiesVisited: 28,
          countriesExplored: 8,
          photosShared: 156
        });
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Update active tab if navigated with state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clean up the location state so it doesn't get stuck on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Fetch user's packages from localStorage
  useEffect(() => {
    const savedPackages = localStorage.getItem('userPackages');
    if (savedPackages) {
      setUserPackages(JSON.parse(savedPackages));
    }
  }, []);

  // Fetch user's businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoadingBusinesses(true);
      try {
        const response = await api.get('/business/my-businesses');
        setBusinesses(response.data.data || []);
      } catch (error) {
        console.error('Error fetching businesses:', error);
      } finally {
        setLoadingBusinesses(false);
      }
    };

    if (user) {
      fetchBusinesses();
    }
  }, [user]);

  // Animated counter for stats
  const animateStats = (targetStats) => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setStats({
        tripsPlanned: Math.floor(targetStats.tripsPlanned * progress),
        citiesVisited: Math.floor(targetStats.citiesVisited * progress),
        countriesExplored: Math.floor(targetStats.countriesExplored * progress),
        photosShared: Math.floor(targetStats.photosShared * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setStats(targetStats);
      }
    }, stepDuration);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleBucketItem = (id) => {
    setBucketList(bucketList.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const addBucketItem = () => {
    if (newBucketItem.trim()) {
      setBucketList([...bucketList, {
        id: Date.now(),
        destination: newBucketItem,
        completed: false
      }]);
      setNewBucketItem('');
    }
  };

  const removeBucketItem = (id) => {
    setBucketList(bucketList.filter(item => item.id !== id));
  };

  const handleEditPreferences = () => {
    setTempPreferences([...preferences]);
    setEditingPreferences(true);
  };

  const togglePreference = (pref) => {
    if (!editingPreferences) return;

    setTempPreferences(prev => {
      if (prev.includes(pref)) {
        // Remove preference
        return prev.filter(p => p !== pref);
      } else {
        // Add preference, but remove conflicting ones
        const conflicts = CONFLICTING_PREFERENCES[pref] || [];
        const filtered = prev.filter(p => !conflicts.includes(p));
        return [...filtered, pref];
      }
    });
  };

  const handleSavePreferences = () => {
    setPreferences(tempPreferences);
    setEditingPreferences(false);
    // Here you can also save to API if needed
    alert('Preferences saved successfully!');
  };

  const handleCancelEdit = () => {
    setTempPreferences([]);
    setEditingPreferences(false);
  };

  // Business registration handler
  const handleBusinessSubmit = async (formData) => {
    try {
      const response = await api.post('/business/register', formData);

      if (response.data.success) {
        alert('Business registered successfully! Pending admin approval.');
        setShowBusinessModal(false);
        // Refresh businesses list
        const refreshResponse = await api.get('/business/my-businesses');
        setBusinesses(refreshResponse.data.data || []);
      }
    } catch (error) {
      console.error('Error registering business:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
      alert(errorMessage);
    }
  };

  // Package creation handlers
  const addHighlight = () => {
    if (highlightInput.trim()) {
      setNewPackage({
        ...newPackage,
        highlights: [...newPackage.highlights, highlightInput]
      });
      setHighlightInput('');
    }
  };

  const removeHighlight = (index) => {
    setNewPackage({
      ...newPackage,
      highlights: newPackage.highlights.filter((_, i) => i !== index)
    });
  };

  const addInclude = () => {
    if (includeInput.trim()) {
      setNewPackage({
        ...newPackage,
        includes: [...newPackage.includes, includeInput]
      });
      setIncludeInput('');
    }
  };

  const removeInclude = (index) => {
    setNewPackage({
      ...newPackage,
      includes: newPackage.includes.filter((_, i) => i !== index)
    });
  };

  const handleImageUpload = (e, isMain = false) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (isMain) {
            setNewPackage({
              ...newPackage,
              image: event.target.result
            });
          } else {
            setNewPackage({
              ...newPackage,
              images: [...newPackage.images, event.target.result]
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleCreatePackage = () => {
    if (!newPackage.title || !newPackage.location || !newPackage.duration || !newPackage.price) {
      alert('Please fill in all required fields (title, location, duration, price)');
      return;
    }

    const packageToAdd = {
      id: Date.now(),
      ...newPackage,
      rating: 4.5,
      reviews: 0,
      category: newPackage.category,
      isUserCreated: true
    };

    const updatedPackages = [...userPackages, packageToAdd];
    setUserPackages(updatedPackages);
    localStorage.setItem('userPackages', JSON.stringify(updatedPackages));

    alert('Package created successfully! It will now appear on the Packages page.');
    setShowPackageModal(false);
    resetPackageForm();
  };

  const resetPackageForm = () => {
    setNewPackage({
      title: '',
      location: '',
      duration: '',
      price: '',
      originalPrice: '',
      category: 'Adventure',
      description: '',
      highlights: [],
      includes: [],
      image: null,
      images: []
    });
    setHighlightInput('');
    setIncludeInput('');
  };

  const deleteUserPackage = (packageId) => {
    const updatedPackages = userPackages.filter(pkg => pkg.id !== packageId);
    setUserPackages(updatedPackages);
    localStorage.setItem('userPackages', JSON.stringify(updatedPackages));
    alert('Package deleted successfully!');
  };

  if (!user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      {/* Modern Header */}
      <div className="profile-header-section">
        <div className="profile-user-card">
          <div className="avatar-large">
            <User size={50} />
          </div>
          <div className="user-details-header">
            <h1>{user.name}</h1>
            <p className="user-email">
              <Mail size={16} />
              {user.email}
            </p>
            <span className="user-role-badge">{user.role || 'Traveler'}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon trips">
              <Plane size={28} />
            </div>
            <div className="stat-content">
              <h3>{stats.tripsPlanned}</h3>
              <p>Trips Planned</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon cities">
              <MapPin size={28} />
            </div>
            <div className="stat-content">
              <h3>{stats.citiesVisited}</h3>
              <p>Cities Visited</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon countries">
              <Globe size={28} />
            </div>
            <div className="stat-content">
              <h3>{stats.countriesExplored}</h3>
              <p>Countries</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon photos">
              <Camera size={28} />
            </div>
            <div className="stat-content">
              <h3>{stats.photosShared}</h3>
              <p>Photos Shared</p>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        {['overview', 'preferences', 'businesses', 'packages', 'bookings', 'favorites'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && <Compass size={18} />}
            {tab === 'preferences' && <Heart size={18} />}
            {tab === 'businesses' && <Building2 size={18} />}
            {tab === 'packages' && <Map size={18} />}
            {tab === 'bookings' && <CalendarCheck size={18} />}
            {tab === 'favorites' && <Star size={18} />}
            {tab === 'bookings' ? (user?.role === 'business' || user?.role === 'admin' ? 'Manage Bookings' : 'My Bookings') : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Achievements */}
            <div className="section-card">
              <h2 className="section-title">
                <Trophy size={24} />
                Travel Achievements
              </h2>
              <div className="achievements-grid">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <h3>{achievement.name}</h3>
                    <p>{achievement.description}</p>
                    {achievement.unlocked && <Check className="check-mark" size={20} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Travel Goals */}
            <div className="section-card">
              <h2 className="section-title">
                <Target size={24} />
                Travel Goals
              </h2>
              <div className="goals-list">
                {travelGoals.map(goal => (
                  <div key={goal.id} className="goal-item">
                    <div className="goal-header">
                      <h3>{goal.goal}</h3>
                      <span className="goal-progress">{goal.current}/{goal.target}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(goal.current / goal.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bucket List */}
            <div className="section-card">
              <h2 className="section-title">
                <Flag size={24} />
                Travel Bucket List
              </h2>
              <div className="bucket-list">
                {bucketList.map(item => (
                  <div key={item.id} className="bucket-item">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleBucketItem(item.id)}
                    />
                    <span className={item.completed ? 'completed' : ''}>{item.destination}</span>
                    <button className="remove-btn" onClick={() => removeBucketItem(item.id)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <div className="add-bucket-item">
                  <input
                    type="text"
                    placeholder="Add new destination..."
                    value={newBucketItem}
                    onChange={(e) => setNewBucketItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addBucketItem()}
                  />
                  <button onClick={addBucketItem}>
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="preferences-content">
            <div className="section-card">
              <div className="section-header-with-actions">
                <h2 className="section-title">
                  <Heart size={24} />
                  Travel Preferences
                </h2>
                {!editingPreferences ? (
                  <button className="edit-preferences-btn" onClick={handleEditPreferences}>
                    <Edit2 size={18} />
                    Edit Preferences
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-pref-btn" onClick={handleSavePreferences}>
                      <Check size={18} />
                      Save
                    </button>
                    <button className="cancel-pref-btn" onClick={handleCancelEdit}>
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="preferences-grid-selectable">
                {allPreferenceOptions.map(pref => {
                  const displayPrefs = editingPreferences ? tempPreferences : preferences;
                  const isSelected = displayPrefs.includes(pref);

                  // Check if this preference conflicts with any selected preferences
                  const conflicts = CONFLICTING_PREFERENCES[pref] || [];
                  const hasConflict = displayPrefs.some(p => conflicts.includes(p));
                  const isDisabled = !isSelected && hasConflict && editingPreferences;

                  return (
                    <div
                      key={pref}
                      className={`preference-chip-selectable ${isSelected ? 'selected' : ''} ${editingPreferences ? 'editable' : ''} ${isDisabled ? 'disabled' : ''}`}
                      onClick={() => !isDisabled && togglePreference(pref)}
                      title={isDisabled ? `Conflicts with selected preferences` : ''}
                    >
                      {pref}
                      {isSelected && <Check size={16} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* My Businesses Tab */}
        {activeTab === 'businesses' && (
          <div className="businesses-content">
            <div className="section-card">
              <div className="section-header-with-actions">
                <h2 className="section-title">
                  <Building2 size={24} />
                  My Businesses
                </h2>
                <button
                  className="register-business-btn text-white"
                  onClick={() => setShowBusinessModal(true)}
                >
                  <Plus size={18} />
                  Register Business
                </button>
              </div>

              {loadingBusinesses ? (
                <p className="loading-message">Loading businesses...</p>
              ) : businesses.length === 0 ? (
                <div className="empty-state text-white">
                  <Building2 size={48} className="empty-icon" />
                  <h3>No Businesses Registered</h3>
                  <p>Register your hotel, vehicle rental, or tour package to reach more travelers!</p>
                  <button
                    className="cta-register-btn text-white"
                    onClick={() => setShowBusinessModal(true)}
                  >
                    <Plus size={20} />
                    Register Your First Business
                  </button>
                </div>
              ) : (
                <div className="businesses-grid">
                  {businesses.map(business => (
                    <div key={business._id} className="business-card">
                      <div className="business-header">
                        <div className="business-type-icon">
                          {business.businessType === 'hotel' && <Hotel size={24} />}
                          {business.businessType === 'rental' && <Car size={24} />}
                          {business.businessType === 'tour' && <Map size={24} />}
                        </div>
                        <div className="business-status-badge">
                          {business.status === 'pending' && (
                            <span className="badge pending">⏳ Pending Approval</span>
                          )}
                          {business.status === 'approved' && (
                            <span className="badge approved">✓ Approved</span>
                          )}
                          {business.status === 'rejected' && (
                            <span className="badge rejected">✗ Rejected</span>
                          )}
                        </div>
                      </div>

                      <h3>{business.name}</h3>
                      <p className="business-type">
                        {business.businessType.charAt(0).toUpperCase() + business.businessType.slice(1)}
                      </p>
                      <p className="business-location">
                        <MapPin size={14} />
                        {business.location.city}, {business.location.state}
                      </p>
                      <p className="business-price">
                        {business.priceRange.charAt(0).toUpperCase() + business.priceRange.slice(1)} range
                        {business.pricePerNight && ` • ₹${business.pricePerNight}/night`}
                        {business.pricePerDay && ` • ₹${business.pricePerDay}/day`}
                      </p>

                      <div className="business-actions">
                        <button className="btn-edit" onClick={() => alert('Edit coming soon!')}>
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button className="btn-delete" onClick={() => alert('Delete coming soon!')}>
                          <X size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manage Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-content">
            {(user?.role === 'business' || user?.role === 'admin') ? (
              <ManageBookings />
            ) : (
              <UserBookings />
            )}
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="packages-content">
            <div className="section-card">
              <div className="section-header-with-actions">
                <h2 className="section-title">
                  <Map size={24} />
                  My Travel Packages
                </h2>
                <button
                  className="register-business-btn text-white"
                  onClick={() => {
                    resetPackageForm();
                    setShowPackageModal(true);
                  }}
                >
                  <Plus size={18} />
                  Create New Package
                </button>
              </div>

              {userPackages.length === 0 ? (
                <div className="empty-state text-white">
                  <Map size={48} className="empty-icon" />
                  <h3>No Packages Created</h3>
                  <p>Create your own travel packages to share with other travelers!</p>
                  <button
                    className="cta-register-btn text-white"
                    onClick={() => {
                      resetPackageForm();
                      setShowPackageModal(true);
                    }}
                  >
                    <Plus size={20} />
                    Create Your First Package
                  </button>
                </div>
              ) : (
                <div className="user-packages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px', marginTop: '25px' }}>
                  {userPackages.map(pkg => (
                    <div key={pkg.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', transition: 'transform 0.3s ease' }}>
                      {pkg.image && (
                        <img src={pkg.image} alt={pkg.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                      )}
                      <div style={{ padding: '20px' }}>
                        <h3 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{pkg.title}</h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}><MapPin size={16} style={{ display: 'inline', marginRight: '5px' }} />{pkg.location}</p>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Duration: {pkg.duration}</p>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: '#667eea', marginBottom: '15px' }}>{pkg.price}</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => {
                            setNewPackage(pkg);
                            setShowPackageModal(true);
                          }} style={{ flex: 1, padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                            Edit
                          </button>
                          <button onClick={() => deleteUserPackage(pkg.id)} style={{ flex: 1, padding: '10px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="favorites-content">
            <div className="section-card">
              <h2 className="section-title">
                <Star size={24} />
                Favorite Destinations
              </h2>
              <p className="empty-message">No favorite destinations yet. Start exploring!</p>
            </div>
          </div>
        )}
      </div>

      {/* Business Registration Modal */}
      <BusinessRegistrationModal
        isOpen={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        onSubmit={handleBusinessSubmit}
      />

      {/* Package Creation Modal */}
      {showPackageModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowPackageModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto', padding: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Create Travel Package</h2>
              <button onClick={() => setShowPackageModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#999' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Package Title *</label>
                <input type="text" value={newPackage.title} onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })} placeholder="e.g., Himalayan Trekking Adventure" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>

              {/* Location */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Location *</label>
                <input type="text" value={newPackage.location} onChange={(e) => setNewPackage({ ...newPackage, location: e.target.value })} placeholder="e.g., Manali, Dharamshala, Himachal Pradesh" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Duration*</label>
                <input type="text" value={newPackage.duration} onChange={(e) => setNewPackage({ ...newPackage, duration: e.target.value })} placeholder="e.g., 5 Days / 4 Nights" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>

              {/* Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Price (₹) *</label>
                  <input type="text" value={newPackage.price} onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })} placeholder="e.g., ₹25,999" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Original Price (₹)</label>
                  <input type="text" value={newPackage.originalPrice} onChange={(e) => setNewPackage({ ...newPackage, originalPrice: e.target.value })} placeholder="e.g., ₹32,999" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Category */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Category</label>
                <select value={newPackage.category} onChange={(e) => setNewPackage({ ...newPackage, category: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option>Adventure</option>
                  <option>Heritage</option>
                  <option>Nature</option>
                  <option>Beach</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Description</label>
                <textarea value={newPackage.description} onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })} placeholder="Describe your package..." style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', minHeight: '100px', boxSizing: 'border-box' }} />
              </div>

              {/* Main Image Upload */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Main Image</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} style={{ width: '100%', padding: '10px', border: '1px dashed #ddd', borderRadius: '8px' }} />
                {newPackage.image && <img src={newPackage.image} alt="Preview" style={{ width: '100%', marginTop: '10px', borderRadius: '8px', maxHeight: '150px', objectFit: 'cover' }} />}
              </div>

              {/* Gallery Images Upload */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Gallery Images</label>
                <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, false)} style={{ width: '100%', padding: '10px', border: '1px dashed #ddd', borderRadius: '8px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  {newPackage.images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img src={img} alt={`Gallery ${idx}`} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                      <button onClick={() => setNewPackage({ ...newPackage, images: newPackage.images.filter((_, i) => i !== idx) })} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px' }}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Highlights</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input type="text" value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addHighlight()} placeholder="Add a highlight..." style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }} />
                  <button onClick={addHighlight} style={{ padding: '12px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {newPackage.highlights.map((hl, idx) => (
                    <span key={idx} style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {hl}
                      <button onClick={() => removeHighlight(idx)} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '16px', padding: '0' }}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Includes */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>What's Included</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input type="text" value={includeInput} onChange={(e) => setIncludeInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addInclude()} placeholder="e.g., Hotel, Meals, Transport..." style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }} />
                  <button onClick={addInclude} style={{ padding: '12px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {newPackage.includes.map((inc, idx) => (
                    <span key={idx} style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {inc}
                      <button onClick={() => removeInclude(idx)} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '16px', padding: '0' }}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                <button onClick={handleCreatePackage} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>Create Package</button>
                <button onClick={() => setShowPackageModal(false)} style={{ flex: 1, padding: '14px', background: '#eee', color: '#333', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
