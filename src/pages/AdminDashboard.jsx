import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Building2, Check, X, Clock, Hotel, Car, Map,
  Search, Filter, Eye, AlertTriangle, MapPin, Phone, Mail
} from 'lucide-react';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected business for detail view
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Check if user is admin
      if (parsedUser.role !== 'admin') {
        alert('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }

      fetchAllBusinesses();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch all businesses (admin can see all)
  const fetchAllBusinesses = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      // Fetch from admin endpoint that returns ALL businesses (all statuses)
      const response = await fetch('http://localhost:5000/api/business/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }

      const data = await response.json();
      const allBusinesses = data.data || [];

      setBusinesses(allBusinesses);
      setFilteredBusinesses(allBusinesses);

      // Calculate stats
      const pending = allBusinesses.filter(b => b.status === 'pending').length;
      const approved = allBusinesses.filter(b => b.status === 'approved').length;
      const rejected = allBusinesses.filter(b => b.status === 'rejected').length;

      setStats({
        pending,
        approved,
        rejected,
        total: allBusinesses.length
      });

    } catch (error) {
      console.error('Error fetching businesses:', error);
      alert('Failed to load businesses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...businesses];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(b => b.businessType === typeFilter);
    }

    // Search query
    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.location.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBusinesses(filtered);
  }, [statusFilter, typeFilter, searchQuery, businesses]);

  // Update business status
  const updateBusinessStatus = async (businessId, newStatus, reason = '') => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:5000/api/business/${businessId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: reason
        })
      });

      if (response.ok) {
        alert(`Business ${newStatus} successfully!`);
        setShowDetailModal(false);
        setRejectionReason('');
        fetchAllBusinesses(); // Refresh list
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update business');
      }
    } catch (error) {
      console.error('Error updating business:', error);
      alert('An error occurred');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="status-badge pending"><Clock size={14} /> Pending</span>,
      approved: <span className="status-badge approved"><Check size={14} /> Approved</span>,
      rejected: <span className="status-badge rejected"><X size={14} /> Rejected</span>,
      suspended: <span className="status-badge suspended"><AlertTriangle size={14} /> Suspended</span>
    };
    return badges[status] || status;
  };

  const getTypeIcon = (type) => {
    const icons = {
      hotel: <Hotel size={20} />,
      rental: <Car size={20} />,
      tour: <Map size={20} />
    };
    return icons[type];
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-title">
            <Shield size={32} className="admin-icon" />
            <div>
              <h1>Admin Dashboard</h1>
              <p>Business Verification & Management</p>
            </div>
          </div>
          <button className="btn-back" onClick={() => navigate('/profile')}>
            Back to Profile
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card pending-card">
          <Clock size={24} />
          <div>
            <h3>{stats.pending}</h3>
            <p>Pending Review</p>
          </div>
        </div>
        <div className="stat-card approved-card">
          <Check size={24} />
          <div>
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card rejected-card">
          <X size={24} />
          <div>
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
        <div className="stat-card total-card">
          <Building2 size={24} />
          <div>
            <h3>{stats.total}</h3>
            <p>Total Businesses</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="hotel">Hotels</option>
            <option value="rental">Rentals</option>
            <option value="tour">Tours</option>
          </select>
        </div>
      </div>

      {/* Business List */}
      <div className="business-list">
        {loading ? (
          <p className="loading-message">Loading businesses...</p>
        ) : filteredBusinesses.length === 0 ? (
          <p className="empty-message">No businesses found</p>
        ) : (
          filteredBusinesses.map(business => (
            <div key={business._id} className="business-card-admin">
              <div className="business-header-admin">
                <div className="business-type-icon-admin">
                  {getTypeIcon(business.businessType)}
                </div>
                <div className="business-info-admin">
                  <h3>{business.name}</h3>
                  <p className="business-type-text">{business.businessType.toUpperCase()}</p>
                </div>
                {getStatusBadge(business.status)}
              </div>

              <div className="business-details-admin">
                <p className="detail-item">
                  <MapPin size={16} />
                  {business.location.city}, {business.location.state}
                </p>
                <p className="detail-item">
                  <Phone size={16} />
                  {business.contact.phone}
                </p>
                {business.contact.email && (
                  <p className="detail-item">
                    <Mail size={16} />
                    {business.contact.email}
                  </p>
                )}
              </div>

              <div className="business-actions-admin">
                <button
                  className="btn-view"
                  onClick={() => {
                    setSelectedBusiness(business);
                    setShowDetailModal(true);
                  }}
                >
                  <Eye size={16} />
                  View Details
                </button>

                {business.status === 'pending' && (
                  <>
                    <button
                      className="btn-approve"
                      onClick={() => updateBusinessStatus(business._id, 'approved')}
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => {
                        setSelectedBusiness(business);
                        setShowDetailModal(true);
                      }}
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBusiness && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content-admin" onClick={e => e.stopPropagation()}>
            <div className="modal-header-admin">
              <h2>{selectedBusiness.name}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body-admin">
              {/* Business Details */}
              <div className="detail-section">
                <h3>Business Information</h3>
                <p><strong>Type:</strong> {selectedBusiness.businessType}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedBusiness.status)}</p>
                <p><strong>Price Range:</strong> {selectedBusiness.priceRange}</p>
                <p><strong>Description:</strong> {selectedBusiness.description}</p>
              </div>

              <div className="detail-section">
                <h3>Location</h3>
                <p>{selectedBusiness.location.address}</p>
                <p>{selectedBusiness.location.city}, {selectedBusiness.location.state}</p>
              </div>

              <div className="detail-section">
                <h3>Contact</h3>
                <p><strong>Phone:</strong> {selectedBusiness.contact.phone}</p>
                {selectedBusiness.contact.email && <p><strong>Email:</strong> {selectedBusiness.contact.email}</p>}
                {selectedBusiness.contact.website && <p><strong>Website:</strong> {selectedBusiness.contact.website}</p>}
              </div>

              {/* Admin Actions */}
              {selectedBusiness.status === 'pending' && (
                <div className="admin-actions-section">
                  <h3>Admin Actions</h3>

                  <div className="action-buttons">
                    <button
                      className="btn-approve-large"
                      onClick={() => updateBusinessStatus(selectedBusiness._id, 'approved')}
                    >
                      <Check size={20} />
                      Approve Business
                    </button>
                  </div>

                  <div className="rejection-section">
                    <label>Rejection Reason (optional):</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                      rows={3}
                    />
                    <button
                      className="btn-reject-large"
                      onClick={() => updateBusinessStatus(selectedBusiness._id, 'rejected', rejectionReason)}
                    >
                      <X size={20} />
                      Reject Business
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
