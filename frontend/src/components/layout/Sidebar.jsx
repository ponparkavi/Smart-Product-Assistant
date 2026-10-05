import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Box, FileText, Wrench, Shield, AlertTriangle, MapPin, History } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/products" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <Box size={20} />
              <span>Appliance Vault</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/documents" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <FileText size={20} />
              <span>Documents</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/maintenance" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <Wrench size={20} />
              <span>Maintenance</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/warranty" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <Shield size={20} />
              <span>Warranty</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/claims" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <AlertTriangle size={20} />
              <span>Claims</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/service-centers" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <MapPin size={20} />
              <span>Service Centers</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/service-history" className={({isActive}) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <History size={20} />
              <span>Service History</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
