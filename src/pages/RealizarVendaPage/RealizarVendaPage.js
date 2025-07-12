import React, { useState, useEffect } from 'react';
import Select from 'react-select'; // Componente Select para pesquisa
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../contexts/AuthContext.js';
import axios from 'axios';
import ClientForm from '../../components/ClientForm/ClientForm.js';
import InvoiceViewer from '../../components/InvoiceViewer/InvoiceViewer.js';
import '../../components/ClientForm/ClientForm.css';
import './RealizarVendaPage.css';
import { useLocation } from 'react-router-dom'; // Importar useLocation

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

const initialFormState = {
    client_id: '',
    service_description: [], 
    value: '',
    payment_method: '',
    installments: 1,
    observations: ''
};

const RENDER_BACKEND_URL = process.env.REACT_APP_RENDER_BACKEND_URL;
console.log("URL do Backend Render que o frontend está usando:", RENDER_BACKEND_URL);


export default function RealizarVendaPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [showClientModal, setShowClientModal] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [invoiceResult, setInvoiceResult] = useState(null);
    const location = useLocation(); // Hook para acessar o estado de navegação

    async function fetchClients() {
        const { data } = await supabase.from('clients').select('id, name').order('name');
        setClients(data || []);
    }

    useEffect(() => {
        fetchClients();
        // Lógica para pré-selecionar cliente se vier do estado de navegação
        if (location.state && location.state.clientId) {
            setFormData(prev => ({ ...prev, client_id: location.state.clientId }));
        }
    }, [location.state]); // Dependência para re-executar quando o estado de navegação muda

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handler para o Select (react-select)
    const handleClientSelectChange = (selectedOption) => {
        setFormData(prev => ({ ...prev, client_id: selectedOption ? selectedOption.value : '' }));
    };

    const handleMultiSelectChange = (selectedOptions) => {
        setFormData(prev => ({ ...prev, service_description: selectedOptions || [] }));
    };
    
    const handleClientCreated = (newClient) => {
        fetchClients();
        setFormData(prev => ({ ...prev, client_id: newClient.id }));
        setShowClientModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.service_description.length === 0) {
            alert("Por favor, selecione pelo menos um serviço.");
            return;
        }
        if (!formData.client_id) {
            alert("Por favor, selecione um cliente.");
            return;
        }

        setLoading(true);
        setInvoiceResult(null);
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
            
            if (!RENDER_BACKEND_URL) {
                throw new Error("A variável de ambiente RENDER_BACKEND_URL não está configurada no frontend.");
            }

            const response = await axios.post(`${RENDER_BACKEND_URL}/api/emitir`, {
                saleId: sale.id,
                clientId: sale.client_id,
            });

            if (response.data && response.data.success) {
                setInvoiceResult(response.data.data);
            } else {
                throw new Error(response.data.error || 'Ocorreu um erro na emissão.');
            }
            
            setFormData(initialFormState);
        } catch(error) {
            alert(`Erro: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Mapeia a lista de clientes para o formato que react-select espera
    const clientOptions = clients.map(client => ({ value: client.id, label: client.name }));
    // Encontra o cliente selecionado para o Select
    const selectedClientOption = clientOptions.find(option => option.value === formData.client_id);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Realizar Venda</h1>
            </div>
            <div className="page-card">
                <form onSubmit={handleSubmit} className="client-form sale-form">
                    <label>Cliente</label>
                    <div className="client-selector-group">
                        <Select
                            name="client_id"
                            options={clientOptions}
                            value={selectedClientOption} // Define o valor selecionado
                            onChange={handleClientSelectChange} // Novo handler
                            placeholder="Selecione ou pesquise um cliente..."
                            isClearable={true} // Permite limpar a seleção
                            isSearchable={true} // Habilita a pesquisa
                            required
                        />
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
                        required
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
            
            {showClientModal && <ClientForm onClose={() => setShowClientModal(false)} onClientCreated={handleClientCreated} />}

            {invoiceResult && (
                <InvoiceViewer 
                    result={invoiceResult} 
                    onClose={() => setInvoiceResult(null)} 
                />
            )}
        </div>
    );
}
