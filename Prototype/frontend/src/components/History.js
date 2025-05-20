import React, { useState, useEffect } from 'react';
import './History.css';

const History = () => {
  const [readings, setReadings] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'temperature', 'humidity'
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const ITEMS_PER_PAGE = 20;
  
  useEffect(() => {
    const fetchReadings = async () => {
      setLoading(true);
      try {
        let query = `limit=${ITEMS_PER_PAGE}&skip=${(page - 1) * ITEMS_PER_PAGE}`;
        if (filter !== 'all') {
          query += `&type=${filter}`;
        }
        
        const response = await fetch(`${API_URL}/api/readings?${query}`);
        const data = await response.json();
        
        if (page === 1) {
          setReadings(data);
        } else {
          setReadings(prevReadings => [...prevReadings, ...data]);
        }
        
        setHasMore(data.length === ITEMS_PER_PAGE);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching readings:', error);
        setLoading(false);
      }
    };
    
    fetchReadings();
  }, [filter, page, API_URL]);
  
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page when changing filter
  };
  
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };
  
  return (
    <div className="history">
      <h1>Reading History</h1>
      
      <div className="filter-controls">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => handleFilterChange('all')}
        >
          All Readings
        </button>
        <button 
          className={filter === 'temperature' ? 'active' : ''} 
          onClick={() => handleFilterChange('temperature')}
        >
          Temperature Only
        </button>
        <button 
          className={filter === 'humidity' ? 'active' : ''} 
          onClick={() => handleFilterChange('humidity')}
        >
          Humidity Only
        </button>
      </div>
      
      <div className="readings-table-container">
        <table className="readings-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Value</th>
              <th>Heater Status</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr key={reading._id}>
                <td>{new Date(reading.timestamp).toLocaleString()}</td>
                <td className={`reading-type ${reading.type}`}>
                  {reading.type.charAt(0).toUpperCase() + reading.type.slice(1)}
                </td>
                <td>{reading.value.toFixed(1)} {reading.unit}</td>
                <td>
                  {reading.type === 'temperature' ? 
                    (reading.heaterState ? 'ON' : 'OFF') : 
                    'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {loading && <div className="loading">Loading...</div>}
      
      {!loading && hasMore && (
        <button className="load-more-btn" onClick={loadMore}>
          Load More
        </button>
      )}
      
      {!loading && readings.length === 0 && (
        <div className="no-data">No readings found</div>
      )}
    </div>
  );
};

export default History;