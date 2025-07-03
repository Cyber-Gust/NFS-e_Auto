// Usamos 'require' para importar a nossa lógica
const { emitirNotaFiscal } = require('./_utils/nfseService.cjs');

// Usamos 'module.exports' para exportar a função handler
module.exports = async (req, res) => {
  // Permite que seu frontend na Vercel chame esta API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responde a requisições 'OPTIONS' que o navegador faz antes do POST
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Garante que só aceitamos o método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { saleId, clientId } = req.body;

  if (!saleId || !clientId) {
    return res.status(400).json({ success: false, error: 'Dados incompletos para emissão.' });
  }

  try {
    const result = await emitirNotaFiscal(saleId, clientId);
    // Envia a resposta de sucesso de volta para o frontend
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Erro na Função Serverless:', error.message);
    // Envia a resposta de erro de volta para o frontend
    return res.status(500).json({ success: false, error: error.message });
  }
};