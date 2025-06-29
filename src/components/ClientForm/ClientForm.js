import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import './ClientForm.css';

export default function ClientForm({ client, onClose, onClientCreated }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '', cpf_cnpj: '', email: '', phone: '',
    address_street: '', address_number: '', address_complement: '',
    address_neighborhood: '', address_zip_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false); // Novo estado para o loading do CEP

  // Ref para focar no campo de número após buscar o CEP
  const numberInputRef = useRef(null); 

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        cpf_cnpj: client.cpf_cnpj || '',
        email: client.email || '',
        phone: client.phone || '',
        address_street: client.address_street || '',
        address_number: client.address_number || '',
        address_complement: client.address_complement || '',
        address_neighborhood: client.address_neighborhood || '',
        address_zip_code: client.address_zip_code || '',
        address_city: client.address_city || '',
        address_state: client.address_state || ''
      });
    } else {
      setFormData({
        name: '', cpf_cnpj: '', email: '', phone: '',
        address_street: '', address_number: '', address_complement: '',
        address_neighborhood: '', address_zip_code: '', address_city: '', address_state: ''
      });
    }
  }, [client]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // Função para buscar o endereço a partir do CEP
  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cep.length !== 8) {
        return; // Faz nada se o CEP não tiver 8 dígitos
    }
    
    setCepLoading(true);
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            alert('CEP não encontrado.');
            return;
        }

        // Preenche o formulário com os dados do CEP
        setFormData(prev => ({
            ...prev,
            address_street: data.logradouro,
            address_neighborhood: data.bairro,
            address_city: data.localidade, // <<< CAMPO NOVO
            address_state: data.uf,
            // ViaCEP não retorna cidade e estado separados, mas para SJDR já está fixo no DB.
        }));

        // Foca no campo de número para o usuário digitar
        numberInputRef.current.focus();

    } catch (error) {
        alert('Não foi possível buscar o CEP.');
    } finally {
        setCepLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      let error;

      if (client) { // Modo Edição
        ({ data: result, error } = await supabase.from('clients').update(formData).eq('id', client.id).select().single());
      } else { // Modo Criação
        ({ data: result, error } = await supabase.from('clients').insert({ ...formData, user_id: user.id }).select().single());
        if(!error && onClientCreated) onClientCreated(result);
      }

      if (error) throw error;
      onClose();
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
          
          <hr className="form-divider" />
          <h3>Endereço</h3>

          <div className="cep-group">
            <label htmlFor="address_zip_code">CEP</label>
            <input 
              id="address_zip_code" 
              type="text" 
              name="address_zip_code" 
              value={formData.address_zip_code} 
              onChange={handleChange}
              onBlur={handleCepBlur} /* Chama a função quando o usuário sai do campo */
              maxLength="9" 
            />
            {cepLoading && <span className="cep-loading">Buscando...</span>}
          </div>
          
          <label>Rua / Logradouro</label>
          <input type="text" name="address_street" value={formData.address_street} onChange={handleChange} readOnly={cepLoading} />
          
          <div className="form-row">
            <div>
              <label>Número</label>
              <input ref={numberInputRef} type="text" name="address_number" value={formData.address_number} onChange={handleChange} />
            </div>
            <div>
              <label>Complemento</label>
              <input type="text" name="address_complement" value={formData.address_complement} onChange={handleChange} />
            </div>
          </div>
          <label>Bairro</label>
          <input type="text" name="address_neighborhood" value={formData.address_neighborhood} onChange={handleChange} readOnly={cepLoading} />
          
          <div className="form-row">
            <div>
                <label>Cidade</label>
                <input type="text" name="address_city" value={formData.address_city} onChange={handleChange} readOnly={cepLoading} />
            </div>
            <div>
                <label>Estado (UF)</label>
                <input type="text" name="address_state" value={formData.address_state} onChange={handleChange} readOnly={cepLoading} maxLength="2" />
            </div>
          </div>
          
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