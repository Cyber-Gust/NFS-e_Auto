import React, { useState, useEffect } from 'react';
// ALTERAÇÃO 1: Importar os ícones que vamos usar
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import './ClientesPage.css';
import ClientForm from '../../components/ClientForm/ClientForm';

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (!error) {
      setClients(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchClients();
  }, []);

  const handleNewClient = () => {
    setSelectedClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };
  
  // ALTERAÇÃO 2: Criar a nova função para deletar um cliente
  const handleDeleteClient = async (clientId, clientName) => {
    // Adiciona uma confirmação para evitar exclusões acidentais
    const isConfirmed = window.confirm(`Tem certeza que deseja excluir o cliente "${clientName}"? Esta ação não pode ser desfeita.`);
    
    if (isConfirmed) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        alert(`Erro ao excluir o cliente: ${error.message}`);
      } else {
        alert('Cliente excluído com sucesso!');
        // Atualiza a lista de clientes na tela removendo o que foi excluído
        setClients(clients.filter(client => client.id !== clientId));
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    fetchClients();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Clientes</h1>
        <button onClick={handleNewClient} className="page-button-primary">Novo Cliente</button>
      </div>
      <div className="page-card">
        <table className="clients-table">
          <thead>
            <tr>
              <th