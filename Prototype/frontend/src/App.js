import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import History from './components/History';
import Alerts from './components/Alert';
import './App.css';
import axios from 'axios';

// Set up socket.io client
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

function App() {
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [heaterState, setHeaterState] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        // Fetch the most recent temperature reading
        const tempResponse = await fetch(`${API_URL}/api/readings?type=temperature&limit=1`);
        const tempData = await tempResponse.json();
        if (tempData.length > 0) {
          setTemperature(tempData[0].value);
          setHeaterState(tempData[0].heaterState);
        }

        // Fetch the most recent humidity reading
        const humResponse = await fetch(`${API_URL}/api/readings?type=humidity&limit=1`);
        const humData = await humResponse.json();
        if (humData.length > 0) {
          setHumidity(humData[0].value);
        }

        // Fetch recent alerts
        const alertResponse = await fetch(`${API_URL}/api/alerts?resolved=false`);
        const alertData = await alertResponse.json();
        setAlerts(alertData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();

    // Socket.io event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socket.on('temperature', (data) => {
      setTemperature(data.value);
      setHeaterState(data.heater);
    });

    socket.on('humidity', (data) => {
      setHumidity(data.value);
    });

    socket.on('alert', (data) => {
      setAlerts((prevAlerts) => [data, ...prevAlerts]);
    });

    // Clean up on component unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('temperature');
      socket.off('humidity');
      socket.off('alert');
    };
  }, []);

  return (
    <Router>
      <div className="app">
        <Navigation connected={isConnected} />
        <div className="container">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  temperature={temperature}
                  humidity={humidity}
                  heaterState={heaterState}
                  alerts={alerts.slice(0, 3)}
                />
              } 
            />
            <Route path="/history" element={<History />} />
            <Route 
              path="/alerts" 
              element={
                <Alerts 
                  alerts={alerts}
                  setAlerts={setAlerts}
                  apiUrl={API_URL}
                />
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;