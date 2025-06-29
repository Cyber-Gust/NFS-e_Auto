import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { AuthProvider } from './contexts/AuthContext';

// Importando as páginas
import LoginPage from './pages/LoginPage/LoginPage';
import SignUpPage from './pages/SignUpPage/SignUpPage';
import DashboardLayout from './components/DashboardLayout/DashboardLayout';
import ClientesPage from './pages/ClientesPage/ClientesPage';
import RealizarVendaPage from './pages/RealizarVendaPage/RealizarVendaPage';
import RelatoriosPage from './pages/RelatoriosPage/RelatoriosPage';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return session ? children : <Navigate to="/login" />;
};


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          <Route 
            path="/" 
            element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
          >
            {/* As rotas aninhadas agora aparecem dentro do DashboardLayout */}
            <Route index element={<Navigate to="/clientes" replace />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="vendas" element={<RealizarVendaPage />} />
            <Route path="relatorios" element={<RelatoriosPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
