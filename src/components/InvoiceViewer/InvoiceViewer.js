// Arquivo: src/components/InvoiceViewer/InvoiceViewer.js
import React from 'react';
import './InvoiceViewer.css';

export default function InvoiceViewer({ result, onClose }) {

    // Função para abrir o PDF em uma nova aba, onde o celular dará as opções de compartilhamento
    const handleSharePrint = () => {
        if (result && result.nfs_link_pdf) {
            window.open(result.nfs_link_pdf, '_blank');
        }
    };

    return (
        <div className="invoice-viewer-overlay">
            <div className="invoice-viewer-content">
                <h2>NFS-e Emitida com Sucesso!</h2>
                <p>Nota Fiscal Nº: {result.nfs_number}</p>

                <div className="pdf-container">
                    <iframe 
                        src={result.nfs_link_pdf} 
                        title="Visualizador de NFS-e" 
                        width="100%" 
                        height="100%"
                    ></iframe>
                </div>

                <div className="invoice-viewer-actions">
                    <button onClick={handleSharePrint} className="button-secondary">
                        Compartilhar / Imprimir
                    </button>
                    <button onClick={onClose} className="page-button-primary">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}