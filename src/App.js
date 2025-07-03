import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { AuthProvider } from './contexts/AuthContext.js';

// Importando as páginas
import LoginPage from './pages/LoginPage/LoginPage.js';
import SignUpPage from './pages/SignUpPage/SignUpPage.js';
import DashboardLayout from './components/DashboardLayout/DashboardLayout.js';
import ClientesPage from './pages/ClientesPage/ClientesPage.js';
import RealizarVendaPage from './pages/RealizarVendaPage/RealizarVendaPage.js';
import RelatoriosPage from './pages/RelatoriosPage/RelatoriosPage.js';

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
