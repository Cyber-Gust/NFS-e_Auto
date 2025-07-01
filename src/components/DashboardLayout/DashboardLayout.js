import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './DashboardLayout.css';

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="dashboard-layout">
        <button className="mobile-menu-button" onClick={() => setIsMobileMenuOpen(true)}>
            <MenuIcon />
        </button>

        {isMobileMenuOpen && <div className="sidebar-overlay" onClick={closeMenu}></div>}

        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="sidebar-content">
                <h1 className="sidebar-title">Black Brian PDV</h1>
                <nav className="sidebar-nav">
                    <NavLink to="/clientes" onClick={closeMenu}>Clientes</NavLink>
                    <NavLink to="/vendas" onClick={closeMenu}>Realizar Venda</NavLink>
                    <NavLink to="/relatorios" onClick={closeMenu}>Relatórios</NavLink>
                </nav>
                <button onClick={handleLogout} className="logout-button">Sair</button>
            </div>
        </aside>

        <main className="main-content">
            <Outlet />
        </main>
    </div>
  );
}