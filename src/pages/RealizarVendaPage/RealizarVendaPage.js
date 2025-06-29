import React, { useState, useEffect } from 'react';
import Select from 'react-select'; // Importa o react-select
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import ClientForm from '../../components/ClientForm/ClientForm'; // Importa o formulário de cliente
import '../../components/ClientForm/ClientForm.css';
import './RealizarVendaPage.css'; // Importa o CSS da página

// Sua lista de serviços
const servicosOptions = [
  { value: 'Cristalização', label: 'Cristalização' },
  { value: 'Vitrificação', label: 'Vitrificação' },
  { value: 'Limpeza Protetora', label: 'Limpeza Protetora' },
  { value: 'Higienização Interna', label: 'Higienização Interna' },
  { value: 'Tratamento de Venda', label: 'Tratamento de Venda' },
  { value: 'Polimento de Farol', label: 'Polimento de Farol' },
  { value: 'Tratamento do Motor', label: 'Tratamento do Motor' },
  { value: 'Tratamento do Banco', label: 'Tratamento do Banco' },
  { value: 'Tratamento dos Vidros', label: 'Tratamento dos Vidros' },
  { value: 'Martelinho de Ouro', label: 'Martelinho de Ouro' },
  { value: 'Insulfilm', label: 'Insulfilm' }
];

export default function RealizarVendaPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [showClientModal, setShowClientModal] = useState(false); // NOVO: Estado para o modal
    const [formData, setFormData] = useState({
        client_id: '',
        service_description: [], 
        value: '',
        payment_method: '',
        installments: 1,
        observations: ''
    });
    const [loading, setLoading] = useState(false);

    // Função para buscar clientes
    async function fetchClients() {
        const { data } = await supabase.from('clients').select('id, name').order('name');
        setClients(data || []);
    }

    useEffect(() => {
        fetchClients();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMultiSelectChange = (selectedOptions) => {
        setFormData(prev => ({ ...prev, service_description: selectedOptions || [] }));
    };
    
    // NOVO: Função para lidar com o cliente recém-criado
    const handleClientCreated = (newClient) => {
        fetchClients(); // Atualiza a lista de clientes
        setFormData(prev => ({ ...prev, client_id: newClient.id })); // Seleciona o novo cliente
        setShowClientModal(false); // Fecha o modal
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.service_description.length === 0) {
            alert("Por favor, selecione pelo menos um serviço.");
            return;
        }
        setLoading(true);
        try {
            const descriptionString = formData.service_description.map(option => option.label).join(', ');

            const dataToSave = {
                client_id: formData.client_id,
                service_description: descriptionString,
                value: formData.value,
                payment_method: formData.payment_method,
                installments: formData.installments,
                observations: formData.observations
            };

            const { data: sale, error } = await supabase
                .from('sales')
                .insert({ ...dataToSave, user_id: user.id, status: 'Pendente' })
                .select()
                .single();
            if (error) throw error;
            
            alert('Venda registrada! Enviando para emissão da NFS-e...');

            const backendUrl = process.env.REACT_APP_BACKEND_URL;
            await axios.post(`${backendUrl}/api/nfse/emitir`, {
                saleId: sale.id,
                clientId: sale.client_id,
            });

            alert('NFS-e enviada para processamento!');
            setFormData({ client_id: '', service_description: [], value: '', payment_method: '', installments: 1, observations: '' });
        } catch(error) {
            alert(`Erro: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Realizar Venda</h1>
            </div>
            <div className="page-card">
                <form onSubmit={handleSubmit} className="client-form sale-form">
                    <label>Cliente</label>
                    <div className="client-selector-group">
                        <select name="client_id" value={formData.client_id} onChange={handleChange} required>
                            <option value="" disabled>Selecione um cliente</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setShowClientModal(true)} className="add-client-button">+</button>
                    </div>

                    <label>Serviços Realizados</label>
                    <Select
                        isMulti
                        name="service_description"
                        options={servicosOptions}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder="Selecione os serviços..."
                        value={formData.service_description}
                        onChange={handleMultiSelectChange}
                    />
                    
                    <label>Valor (R$)</label>
                    <input type="number" step="0.01" name="value" value={formData.value} onChange={handleChange} required />
                    
                    <label>Forma de Pagamento</label>
                    <select name="payment_method" value={formData.payment_method} onChange={handleChange} required>
                        <option value="" disabled>Selecione</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Pix">Pix</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                    </select>

                    <label>Observações</label>
                    <textarea 
                        name="observations" 
                        value={formData.observations} 
                        onChange={handleChange} 
                        placeholder="Detalhes adicionais, placa do carro, etc..."
                        rows="3"
                    />

                    <div className="form-actions">
                        <button type="submit" className="page-button-primary" disabled={loading}>
                            {loading ? 'Processando...' : 'Finalizar Venda e Emitir Nota'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Renderiza o modal de formulário do cliente se showClientModal for true */}
            {showClientModal && <ClientForm onClose={() => setShowClientModal(false)} onClientCreated={handleClientCreated} />}
        </div>
    );
}