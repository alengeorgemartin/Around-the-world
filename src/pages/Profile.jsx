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
    daysPlanned: 0
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
  const [editingBusiness, setEditingBusiness] = useState(null);

  // Profile Photo Upload State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);


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
  const [travelGoals, setTravelGoals] = useState(() => {
    const saved = localStorage.getItem('travelGoals');
    return saved ? JSON.parse(saved) : [
      { id: 1, goal: 'Visit 10 countries', current: 0, target: 10, category: 'Countries' },
      { id: 2, goal: 'Plan 20 trips', current: 0, target: 20, category: 'Trips' }
    ];
  });
  const [newGoalCategory, setNewGoalCategory] = useState('Trips');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Fetch actual trips and compute stats
      const fetchTripsAndStats = async () => {
        try {
          const res = await api.get('/my-trips');
          const trips = res.data.data || [];
          
          let totalDays = 0;
          const uniqueCities = new Set();
          const uniqueCountries = new Set();
          
          trips.forEach(trip => {
             totalDays += parseInt(trip.days) || 0;
             if (trip.location) {
                const parts = trip.location.split(',').map(s => s.trim());
                if (parts.length > 0) uniqueCities.add(parts[0]);
                if (parts.length > 1) uniqueCountries.add(parts[parts.length - 1]);
                else if (parts.length === 1) uniqueCountries.add(parts[0]);
             }
          });
          
          const targetStats = {
            tripsPlanned: trips.length,
            citiesVisited: uniqueCities.size,
            countriesExplored: uniqueCountries.size,
            daysPlanned: totalDays
          };
          
          setTravelGoals(prevGoals => {
            const updatedGoals = prevGoals.map(goal => {
              let currentVal = 0;
              if (goal.category === 'Trips') currentVal = targetStats.tripsPlanned;
              else if (goal.category === 'Cities') currentVal = targetStats.citiesVisited;
              else if (goal.category === 'Countries') currentVal = targetStats.countriesExplored;
              else if (goal.category === 'Days') currentVal = targetStats.daysPlanned;
              return { ...goal, current: currentVal };
            });
            localStorage.setItem('travelGoals', JSON.stringify(updatedGoals));
            return updatedGoals;
          });
          
          if (!statsAnimated.current) {
            statsAnimated.current = true;
            animateStats(targetStats);
          } else {
            setStats(targetStats);
          }
        } catch (error) {
          console.error('Error fetching trips for stats:', error);
        }
      };

      fetchTripsAndStats();
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
        daysPlanned: Math.floor(targetStats.daysPlanned * progress)
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

  const addTravelGoal = () => {
    if (newGoalTarget && !isNaN(newGoalTarget)) {
      let goalText = '';
      if (newGoalCategory === 'Trips') goalText = `Plan ${newGoalTarget} trips`;
      else if (newGoalCategory === 'Cities') goalText = `Visit ${newGoalTarget} cities`;
      else if (newGoalCategory === 'Countries') goalText = `Explore ${newGoalTarget} countries`;
      else if (newGoalCategory === 'Days') goalText = `Plan ${newGoalTarget} travel days`;

      let currentVal = 0;
      if (newGoalCategory === 'Trips') currentVal = stats.tripsPlanned;
      else if (newGoalCategory === 'Cities') currentVal = stats.citiesVisited;
      else if (newGoalCategory === 'Countries') currentVal = stats.countriesExplored;
      else if (newGoalCategory === 'Days') currentVal = stats.daysPlanned;

      const newGoal = {
        id: Date.now(),
        goal: goalText,
        current: currentVal,
        target: parseInt(newGoalTarget),
        category: newGoalCategory
      };

      const updatedGoals = [...travelGoals, newGoal];
      setTravelGoals(updatedGoals);
      localStorage.setItem('travelGoals', JSON.stringify(updatedGoals));
      setNewGoalTarget('');
    }
  };

  const removeTravelGoal = (id) => {
    const updatedGoals = travelGoals.filter(goal => goal.id !== id);
    setTravelGoals(updatedGoals);
    localStorage.setItem('travelGoals', JSON.stringify(updatedGoals));
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
      if (editingBusiness) {
        const response = await api.put(`/business/${editingBusiness._id}`, formData);
        if (response.data.success) {
          alert('Business updated successfully!');
          setShowBusinessModal(false);
          setEditingBusiness(null);
          // Refresh businesses list
          const refreshResponse = await api.get('/business/my-businesses');
          setBusinesses(refreshResponse.data.data || []);
        }
      } else {
        const response = await api.post('/business/register', formData);
        if (response.data.success) {
          alert('Business registered successfully! Pending admin approval.');
          setShowBusinessModal(false);
          // Refresh businesses list
          const refreshResponse = await api.get('/business/my-businesses');
          setBusinesses(refreshResponse.data.data || []);
        }
      }
    } catch (error) {
      console.error('Error submitting business:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEditBusiness = (business) => {
    setEditingBusiness(business);
    setShowBusinessModal(true);
  };

  const handleDeleteBusiness = async (businessId) => {
    if (window.confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
      try {
        const response = await api.delete(`/business/${businessId}`);
        if (response.data.success) {
          alert("Business deleted successfully.");
          setBusinesses(prev => prev.filter(b => b._id !== businessId));
        }
      } catch (error) {
        console.error("Error deleting business:", error);
        alert(error.response?.data?.message || "Failed to delete business.");
      }
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       alert("Please upload an image file");
       return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    setUploadingPhoto(true);
    try {
      const response = await api.post('/upload/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Update user state
        const updatedUser = { ...user, profilePhoto: response.data.profilePhoto };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('Profile photo updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };



  if (!user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      {/* Modern Header */}
      <div className="profile-header-section">
        <div className="profile-user-card">
          <div 
            className="avatar-large" 
            style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingPhoto ? (
               <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '12px', fontWeight: 'bold', zIndex: 2 }}>
                  Uploading...
               </div>
            ) : null}
            
            {user.profilePhoto ? (
              <img 
                src={`http://localhost:5000${user.profilePhoto}`} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <User size={50} />
            )}
            
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '5px', textAlign: 'center', opacity: 0, transition: 'opacity 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                 onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                 onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
            >
               <Camera size={16} color="white" />
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handlePhotoUpload}
            />
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
              <Calendar size={28} />
            </div>
            <div className="stat-content">
              <h3>{stats.daysPlanned}</h3>
              <p>Days Planned</p>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        {['overview', 'preferences', 'businesses', 'bookings'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && <Compass size={18} />}
            {tab === 'preferences' && <Heart size={18} />}
            {tab === 'businesses' && <Building2 size={18} />}
            {tab === 'bookings' && <CalendarCheck size={18} />}
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
                  <div key={goal.id} className="goal-item" style={{ position: 'relative' }}>
                    <div className="goal-header">
                      <h3>{goal.goal}</h3>
                      <span className="goal-progress">{goal.current}/{goal.target}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <button className="remove-btn" onClick={() => removeTravelGoal(goal.id)} style={{ position: 'absolute', top: '10px', right: '0px', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                
                <div className="add-goal-item" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <select 
                    value={newGoalCategory} 
                    onChange={(e) => setNewGoalCategory(e.target.value)}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="Trips">Trips</option>
                    <option value="Cities">Cities</option>
                    <option value="Countries">Countries</option>
                    <option value="Days">Days</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Target number..."
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTravelGoal()}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                  <button onClick={addTravelGoal} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    <Plus size={20} />
                  </button>
                </div>
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
                  onClick={() => {
                    setEditingBusiness(null);
                    setShowBusinessModal(true);
                  }}
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
                        <button className="btn-edit" style={{ color: 'white' }} onClick={() => handleEditBusiness(business)}>
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button className="btn-delete" style={{ color: 'white' }} onClick={() => handleDeleteBusiness(business._id)}>
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


      </div>

      {/* Business Registration Modal */}
      <BusinessRegistrationModal
        isOpen={showBusinessModal}
        onClose={() => {
          setShowBusinessModal(false);
          setEditingBusiness(null);
        }}
        onSubmit={handleBusinessSubmit}
        initialData={editingBusiness}
      />


    </div>
  );
};

export default Profile;
