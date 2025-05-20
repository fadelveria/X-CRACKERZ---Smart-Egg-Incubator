import React from 'react';
import { Link } from 'react-router-dom';
import Chart from './Chart';
import './Dashboard.css';

const Dashboard = ({ temperature, humidity, heaterState, alerts }) => {
  // Helper functions to determine status
  const getTemperatureStatus = (temp) => {
    if (!temp) return { status: 'unknown', message: 'No data' };
    
    if (temp < 37.3) return { status: 'low', message: 'Too Low' };
    if (temp > 38.0) return { status: 'high', message: 'Too High' };
    return { status: 'normal', message: 'Normal' };
  };
  
  const getHumidityStatus = (hum) => {
    if (!hum) return { status: 'unknown', message: 'No data' };
    
    if (hum < 55.0) return { status: 'low', message: 'Too Low' };
    if (hum > 65.0) return { status: 'high', message: 'Too High' };
    return { status: 'normal', message: 'Normal' };
  };
  
  const tempStatus = getTemperatureStatus(temperature);
  const humStatus = getHumidityStatus(humidity);
  
  return (
    <div className="dashboard">
      <h1>Smart Egg Incubator Dashboard</h1>
      
      <div className="stats-container">
        <div className={`stat-card temperature ${tempStatus.status}`}>
          <h2>Temperature</h2>
          <div className="reading">{temperature ? `${temperature.toFixed(1)}°C` : 'N/A'}</div>
          <div className="status">Status: {tempStatus.message}</div>
          {heaterState && <div className="heater-indicator">Heater: ON</div>}
        </div>
        
        <div className={`stat-card humidity ${humStatus.status}`}>
          <h2>Humidity</h2>
          <div className="reading">{humidity ? `${humidity.toFixed(1)}%` : 'N/A'}</div>
          <div className="status">Status: {humStatus.message}</div>
        </div>
      </div>
      
      <div className="chart-container">
        <Chart />
      </div>
      
      <div className="alerts-section">
        <div className="section-header">
          <h2>Recent Alerts</h2>
          <Link to="/alerts" className="view-all">View All</Link>
        </div>
        
        {alerts.length > 0 ? (
          <ul className="alerts-list">
            {alerts.map((alert) => (
              <li key={alert._id} className="alert-item">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-alerts">No recent alerts</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;