import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h1 className="sidebar-title">Black Brian PDV</h1>
        <nav className="sidebar-nav">
          <NavLink to="/clientes">Clientes</NavLink>
          <NavLink to="/vendas">Realizar Venda</NavLink>
          <NavLink to="/relatorios">Relatórios</NavLink>
        </nav>
        <button onClick={handleLogout} className="logout-button">Sair</button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}