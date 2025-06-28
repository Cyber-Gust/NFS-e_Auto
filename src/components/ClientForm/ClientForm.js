import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import './ClientForm.css';

export default function ClientForm({ client, onClose }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '', cpf_cnpj: '', email: '', phone: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        cpf_cnpj: client.cpf_cnpj || '',
        email: client.email || '',
        phone: client.phone || ''
      });
    }
  }, [client]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let error;
      if (client) {
        ({ error } = await supabase.from('clients').update(formData).eq('id', client.id));
      } else {
        ({ error } = await supabase.from('clients').insert({ ...formData, user_id: user.id }));
      }
      if (error) throw error;
      onClose(); // Fecha o modal e recarrega a lista
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{client ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <form onSubmit={handleSubmit} className="client-form">
          <label>Nome</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          <label>CPF/CNPJ</label>
          <input type="text" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} />
          <label>Telefone</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} />
          <div className="form-actions">
            <button type="button" onClick={onClose} className="button-secondary">Cancelar</button>
            <button type="submit" className="page-button-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}