import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import '../LoginPage/LoginPage.css'; // Reutiliza o mesmo estilo da página de login

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) throw error;
      alert('Cadastro realizado com sucesso! Você será redirecionado para a tela de login.');
      navigate('/login');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Crie sua Conta</h1>
        <p>É rápido e fácil.</p>
        <form onSubmit={handleSignUp} className="login-form">
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Crie uma senha forte (mín. 6 caracteres)"
            minLength="6"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Conta'}
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}
        <p className="signup-link">
          Já tem uma conta? <Link to="/login">Faça login</Link>
        </p>
      </div>
    </div>
  );
}