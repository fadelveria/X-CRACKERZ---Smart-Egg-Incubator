import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Chart.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Chart = () => {
  const [timeRange, setTimeRange] = useState('hour'); // 'hour', 'day', 'week'
  const [temperatureData, setTemperatureData] = useState([]);
  const [humidityData, setHumidityData] = useState([]);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Calculate limit based on time range
        let limit;
        switch(timeRange) {
          case 'hour':
            limit = 60; // Last 60 readings (assuming 1 per minute)
            break;
          case 'day':
            limit = 24 * 60; // Last 24 hours
            break;
          case 'week':
            limit = 7 * 24 * 12; // Last week (12 readings per hour)
            break;
          default:
            limit = 60;
        }
        
        // Fetch temperature data
        const tempResponse = await fetch(`${API_URL}/api/readings?type=temperature&limit=${limit}`);
        const tempData = await tempResponse.json();
        setTemperatureData(tempData.reverse()); // Reverse to get chronological order
        
        // Fetch humidity data
        const humResponse = await fetch(`${API_URL}/api/readings?type=humidity&limit=${limit}`);
        const humData = await humResponse.json();
        setHumidityData(humData.reverse()); // Reverse to get chronological order
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };
    
    fetchData();
    
    // Set up interval to fetch data periodically
    const interval = setInterval(fetchData, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [timeRange, API_URL]);
  
  // Process data for the chart
  const labels = temperatureData.map(reading => {
    const date = new Date(reading.timestamp);
    
    // Format the time based on the selected range
    if (timeRange === 'hour') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === 'day') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  });
  
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatureData.map(reading => reading.value),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Humidity (%)',
        data: humidityData.map(reading => reading.value),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y1',
      },
    ],
  };
  
  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: 'Temperature and Humidity Over Time',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
        min: 35,
        max: 40,
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Humidity (%)',
        },
        min: 40,
        max: 80,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };
  
  return (
    <div className="chart-wrapper">
      <div className="chart-controls">
        <button 
          className={timeRange === 'hour' ? 'active' : ''} 
          onClick={() => setTimeRange('hour')}
        >
          Last Hour
        </button>
        <button 
          className={timeRange === 'day' ? 'active' : ''} 
          onClick={() => setTimeRange('day')}
        >
          Last 24 Hours
        </button>
        <button 
          className={timeRange === 'week' ? 'active' : ''} 
          onClick={() => setTimeRange('week')}
        >
          Last Week
        </button>
      </div>
      
      <div className="chart">
        {temperatureData.length > 0 && humidityData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="loading-chart">Loading chart data...</div>
        )}
      </div>
    </div>
  );
};

export default Chart;