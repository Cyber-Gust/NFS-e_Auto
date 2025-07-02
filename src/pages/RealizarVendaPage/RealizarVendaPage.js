import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import ClientForm from '../../components/ClientForm/ClientForm';
import InvoiceViewer from '../../components/InvoiceViewer/InvoiceViewer'; // <<< NOVA IMPORTAÇÃO
import '../../components/ClientForm/ClientForm.css';
import './RealizarVendaPage.css';

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

export default function RealizarVendaPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [showClientModal, setShowClientModal] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [invoiceResult, setInvoiceResult] = useState(null); // <<< NOVO ESTADO PARA O RESULTADO

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
        setLoading(true);
        try {
            const descriptionString = formData.service_description.map(option => option.label).join(', ');
            const dataToSave = { /* ...seus dados do formulário... */ };

            const { data: sale, error } = await supabase
                .from('sales')
                .insert({ /* ...dados da venda... */ })
                .select().single();
            if (error) throw error;
            
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
            const response = await axios.post(`${backendUrl}/api/nfse/emitir`, {
                saleId: sale.id,
                clientId: sale.client_id,
            });

            // <<< LÓGICA ATUALIZADA >>>
            // Em vez de 'alert', guardamos o resultado para mostrar no modal
            setInvoiceResult(response.data.data);
            setFormData(initialFormState); // Limpa o formulário

        } catch(error) {
            alert(`Erro ao emitir a nota: ${error.message}`);
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
                    {/* ...seu formulário continua igual aqui... */}
                    <label>Cliente</label>
                    <div className="client-selector-group">
                        <select name="client_id" value={formData.client_id} onChange={handleChange} required>
                            <option value="" disabled>Selecione um cliente</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setShowClientModal(true)} className="add-client-button">+</button>
                    </div>

                    <label>Serviços Realizados</label>
                    <Select isMulti name="service_description" options={servicosOptions} /* ...outras props... */ />
                    
                    {/* ...resto dos campos do formulário... */}

                    <div className="form-actions">
                        <button type="submit" className="page-button-primary" disabled={loading}>
                            {loading ? 'Processando...' : 'Finalizar Venda e Emitir Nota'}
                        </button>
                    </div>
                </form>
            </div>
            
            {showClientModal && <ClientForm onClose={() => setShowClientModal(false)} onClientCreated={handleClientCreated} />}

            {/* <<< NOVO >>> Renderiza o modal com o resultado da nota */}
            {invoiceResult && (
                <InvoiceViewer 
                    result={invoiceResult} 
                    onClose={() => setInvoiceResult(null)} 
                />
            )}
        </div>
    );
}