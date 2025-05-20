import React, { Component } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';
import foto from './logo.png';

const Navigation = ({ connected }) => {
  const location = useLocation();
  
  return (
    <nav className="navigation">
      <div className="nav-brand">
        
           <img src ={foto}
        alt="foto" class="logo"/> 
        <h1>X CRACCKERZ</h1>
      </div>
      
      <ul className="nav-links">
        <li>
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link 
            to="/history" 
            className={location.pathname === '/history' ? 'active' : ''}
          >
            History
          </Link>
        </li>
        <li>
          <Link 
            to="/alerts" 
            className={location.pathname === '/alerts' ? 'active' : ''}
          >
            Alerts
          </Link>
        </li>
      </ul>
      
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        {connected ? 'Connected' : 'Disconnected'}
      </div>
    </nav>
  );
};

export default Navigation;