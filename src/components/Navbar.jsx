import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css'; // Optional: custom styling

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <ul className="nav-list">
        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        {/* <li className={location.pathname === '/' ? 'active' : ''}>
          <Link to="/">🏠 Home</Link>
        </li> */}
        <li className={location.pathname === '/pmoverview' ? 'active' : ''}>
          <Link to="/pmoverview">📊 PM Overview</Link>
        </li>
        <li className={location.pathname === '/usersoverview' ? 'active' : ''}>
          <Link to="/usersoverview"> Users Overview</Link>
        </li>
        <li className={location.pathname === '/projectoverview' ? 'active' : ''}>
          <Link to="/projectoverview"> Projects Overview</Link>
        </li>
        <li className={location.pathname === '/user-rates' ? 'active' : ''}>
          <Link to="/user-rates"> User Rates</Link>
        </li>
        <li className={location.pathname === '/' ? 'active' : ''}>
          <Link to="/">Logout</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;