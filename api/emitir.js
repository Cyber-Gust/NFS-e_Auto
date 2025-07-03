import { emitirNotaFiscal } from './_utils/nfseService.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { saleId, clientId } = req.body;

  if (!saleId || !clientId) {
    return res.status(400).json({ success: false, error: 'Dados incompletos para emissão.' });
  }

  try {
    const result = await emitirNotaFiscal(saleId, clientId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Erro na Função Serverless:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
