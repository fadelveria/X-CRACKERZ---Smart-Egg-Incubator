import React, { useState, useEffect } from 'react';
import './Alert.css';

const Alerts = ({ alerts: propAlerts, setAlerts: setPropsAlerts, apiUrl }) => {
  const [localAlerts, setLocalAlerts] = useState([]);
  const [filter, setFilter] = useState('active'); // 'active', 'resolved', 'all'
  const [loading, setLoading] = useState(true);
  
  // Use props if provided, otherwise fetch from API
  const usePropsData = propAlerts && setPropsAlerts;
  const API_URL = apiUrl || process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  useEffect(() => {
    if (usePropsData) {
      // Use alerts from props if provided
      const filtered = filterAlerts(propAlerts, filter);
      setLocalAlerts(filtered);
      setLoading(false);
    } else {
      // Otherwise fetch from API
      fetchAlerts();
    }
  }, [usePropsData, propAlerts, filter]);
  
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let query = '';
      if (filter === 'active') {
        query = '?resolved=false';
      } else if (filter === 'resolved') {
        query = '?resolved=true';
      }
      
      const response = await fetch(`${API_URL}/api/alerts${query}`);
      const data = await response.json();
      setLocalAlerts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };
  
  const filterAlerts = (alerts, filterType) => {
    if (filterType === 'active') {
      return alerts.filter(alert => !alert.resolved);
    } else if (filterType === 'resolved') {
      return alerts.filter(alert => alert.resolved);
    }
    return alerts;
  };
  
  const handleResolveAlert = async (alertId) => {
    try {
      const response = await fetch(`${API_URL}/api/alerts/${alertId}/resolve`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        const updatedAlert = await response.json();
        
        // Update local state
        setLocalAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert._id === alertId ? { ...alert, resolved: true } : alert
          )
        );
        
        // Update parent state if using props
        if (usePropsData) {
          setPropsAlerts(prevAlerts => 
            prevAlerts.map(alert => 
              alert._id === alertId ? { ...alert, resolved: true } : alert
            )
          );
        }
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };
  
  const getSeverityClass = (alert) => {
    const temp = alert.temperature;
    const humidity = alert.humidity;
    
    // Check for severe conditions
    if ((temp > 39.0) || (temp < 36.5) || 
        (humidity > 75) || (humidity < 45)) {
      return 'severe';
    }
    
    // Check for moderate issues
    if ((temp > 38.5) || (temp < 37.0) || 
        (humidity > 70) || (humidity < 50)) {
      return 'moderate';
    }
    
    return 'mild';
  };
  
  return (
    <div className="alerts-page">
      <h1>Incubator Alerts</h1>
      
      <div className="filter-tabs">
        <button 
          className={filter === 'active' ? 'active' : ''} 
          onClick={() => setFilter('active')}
        >
          Active Alerts
        </button>
        <button 
          className={filter === 'resolved' ? 'active' : ''} 
          onClick={() => setFilter('resolved')}
        >
          Resolved Alerts
        </button>
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All Alerts
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading alerts...</div>
      ) : localAlerts.length > 0 ? (
        <div className="alerts-list">
          {localAlerts.map((alert) => (
            <div 
              key={alert._id} 
              className={`alert-card ${getSeverityClass(alert)} ${alert.resolved ? 'resolved' : ''}`}
            >
              <div className="alert-header">
                <span className="alert-time">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
                <span className={`alert-status ${alert.resolved ? 'resolved' : 'active'}`}>
                  {alert.resolved ? 'Resolved' : 'Active'}
                </span>
              </div>
              
              <div className="alert-body">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-details">
                  <div className="detail">
                    <span className="label">Temperature:</span>
                    <span className="value">{alert.temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="detail">
                    <span className="label">Humidity:</span>
                    <span className="value">{alert.humidity.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              {!alert.resolved && (
                <button 
                  className="resolve-btn" 
                  onClick={() => handleResolveAlert(alert._id)}
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-alerts">
          <p>No {filter !== 'all' ? filter : ''} alerts found.</p>
        </div>
      )}
    </div>
  );
};

export default Alerts;