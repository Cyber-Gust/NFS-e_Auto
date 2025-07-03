import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import './RelatoriosPage.css';

export default function RelatoriosPage() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSales() {
            setLoading(true);
            const { data } = await supabase
                .from('sales')
                .select('*, clients(name)')
                .order('created_at', { ascending: false });
            setSales(data || []);
            setLoading(false);
        }
        fetchSales();
    }, []);

    const getStatusClass = (status) => {
        return `status-${status.toLowerCase()}`;
    }

    return (
        <div className="page-container">
            <div className="page-header"><h1>Relatórios de Vendas</h1></div>
            <div className="page-card">
                <table className="clients-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Cliente</th>
                            <th>Valor</th>
                            <th>Status NFS-e</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5">Carregando...</td></tr>
                        ) : (
                            sales.map(sale => (
                                <tr key={sale.id}>
                                    <td>{new Date(sale.created_at).toLocaleDateString('pt-BR')}</td>
                                    <td>{sale.clients?.name || 'N/A'}</td>
                                    <td>{parseFloat(sale.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(sale.status)}`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td>
                                        {/* <<< LÓGICA ATUALIZADA >>> */}
                                        {/* Mostra o botão apenas se a nota foi emitida e o link existe */}
                                        {sale.status === 'Emitida' && sale.nfs_link_pdf && (
                                            <a href={sale.nfs_link_pdf} target="_blank" rel="noopener noreferrer" className="view-invoice-button">
                                                Ver Nota
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}