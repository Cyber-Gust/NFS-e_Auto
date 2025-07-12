import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaFileInvoiceDollar } from 'react-icons/fa'; // Importar novo ícone
import { supabase } from '../../supabaseClient.js';
import './ClientesPage.css';
import ClientForm from '../../components/ClientForm/ClientForm.js';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc', 'all'

  const navigate = useNavigate(); // Inicializar useNavigate

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
    if (!error) {
      setClients(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchClients();
  }, []);

  const sortClients = (order) => {
    let sortedClients = [...clients]; 

    if (order === 'asc') {
      sortedClients.sort((a, b) => a.name.localeCompare(b.name));
      setSortOrder('asc');
    } else if (order === 'desc') {
      sortedClients.sort((a, b) => b.name.localeCompare(a.name));
      setSortOrder('desc');
    } else { 
      fetchClients(); 
      setSortOrder('all');
      return; 
    }
    setClients(sortedClients);
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };
  
  const handleDeleteClient = async (clientId, clientName) => {
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
        setClients(clients.filter(client => client.id !== clientId));
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    fetchClients(); 
  };

  // NOVA FUNÇÃO: Redirecionar para a página de vendas com o cliente selecionado
  const handleEmitirNota = (clientId) => {
    navigate('/realizar-venda', { state: { clientId } });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Clientes</h1>
        <button onClick={handleNewClient} className="page-button-primary">Novo Cliente</button>
      </div>
      <div className="sort-buttons-container">
        <button 
          onClick={() => sortClients('asc')} 
          className={`sort-button ${sortOrder === 'asc' ? 'active' : ''}`}
        >
          A-Z
        </button>
        <button 
          onClick={() => sortClients('desc')} 
          className={`sort-button ${sortOrder === 'desc' ? 'active' : ''}`}
        >
          Z-A
        </button>
        <button 
          onClick={() => sortClients('all')} 
          className={`sort-button ${sortOrder === 'all' ? 'active' : ''}`}
        >
          Todos
        </button>
      </div>

      <div className="page-card">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4">Carregando...</td></tr>
            ) : (
              clients.map(client => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.phone}</td>
                  <td>{client.email}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleEditClient(client)} 
                        className="action-button"
                        title="Editar Cliente"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(client.id, client.name)} 
                        className="action-button delete"
                        title="Excluir Cliente"
                      >
                        <FaTrashAlt />
                      </button>
                      {/* NOVO BOTÃO: Emitir Nota */}
                      <button 
                        onClick={() => handleEmitirNota(client.id)} 
                        className="action-button emitir-nota"
                        title="Emitir Nota para este Cliente"
                      >
                        <FaFileInvoiceDollar />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && <ClientForm client={selectedClient} onClose={handleCloseModal} />}
    </div>
  );
}
