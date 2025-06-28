import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMessage('Verifique seu e-mail para o link de acesso!');
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Gestor da Estética</h1>
        <p>Entre com seu e-mail para receber um link de acesso.</p>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Enviando...' : 'Receber Link Mágico'}
          </button>
        </form>
        {message && <p className="login-message">{message}</p>}
      </div>
    </div>
  );
}