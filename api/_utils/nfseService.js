import soap from 'node-soap';
import { createClient } from '@supabase/supabase-js';
import { SignedXml } from 'xml-crypto';
import * as forge from 'node-forge';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function signXml(xml, tag) {
  try {
    console.log("==> 1. Iniciando função signXml. Tag:", tag);
    const pfxBase64 = process.env.CERTIFICATE_BASE64;
    const password = process.env.CERTIFICATE_PASSWORD;

    if (!pfxBase64 || !password) {
      throw new Error("Certificado ou senha não configurados nas variáveis de ambiente.");
    }
    console.log("==> 2. Variáveis de certificado e senha encontradas. Tamanho do Base64:", pfxBase64.length);

    const pfxBuffer = Buffer.from(pfxBase64, 'base64');
    console.log("==> 3. Buffer do certificado criado com sucesso.");
    
    let p12Asn1;
    try {
        // Esta é a linha que estava a falhar. Vamos ver se o forge.asn1 existe.
        if (!forge.asn1) throw new Error("forge.asn1 está indefinido!");
        p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
        console.log("==> 4. Buffer convertido para ASN.1 com sucesso.");
    } catch (e) {
        console.error("### ERRO CRÍTICO ao converter buffer para ASN.1:", e);
        throw new Error("Formato inválido do arquivo PFX ou erro na biblioteca forge.");
    }

    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    console.log("==> 5. Arquivo PFX decodificado com sucesso.");

    let privateKey;
    let certificate;

    p12.safeContents.forEach(safeContents => {
        safeContents.safeBags.forEach(bag => {
            if (bag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
                privateKey = bag.key;
            } else if (bag.type === forge.pki.oids.certBag) {
                certificate = bag.cert;
            }
        });
    });

    if (!privateKey || !certificate) {
        throw new Error("Chave privada ou certificado não encontrados dentro do arquivo PFX.");
    }
    console.log("==> 6. Chave privada e certificado extraídos.");
    
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    const certPem = forge.pki.certificateToPem(certificate);
    const certClean = certPem.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s/g, '');
    
    const sig = new SignedXml();
    sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
    sig.canonicalizationAlgorithm = "http://www.w3.org/2001/10/xml-exc-c14n#";
    
    sig.addReference(
      `//*[local-name(.)='${tag}']`,
      ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/2001/10/xml-exc-c14n#"],
      "http://www.w3.org/2001/04/xmlenc#sha256"
    );
    sig.signingKey = privateKeyPem;
    sig.keyInfoProvider = {
      getKeyInfo: () => `<X509Data><X509Certificate>${certClean}</X509Certificate></X509Data>`
    };
    
    console.log("==> 7. Iniciando computação da assinatura...");
    sig.computeSignature(xml);
    const signedXml = sig.getSignedXml();
    console.log("==> 8. Assinatura computada com sucesso.");
    
    return signedXml;
  } catch (err) {
    console.error("### ERRO CRÍTICO na função signXml: ", err);
    throw new Error("Falha na assinatura digital. Verifique o certificado e a senha.");
  }
}

export async function emitirNotaFiscal(saleId, clientId) {
  console.log(`Iniciando emitirNotaFiscal com saleId: ${saleId} clientId: ${clientId}`);
  await supabase.from('sales').update({ status: 'Processando' }).eq('id', saleId);

  try {
    const { data: saleData, error: saleError } = await supabase.from('sales').select('*').eq('id', saleId).single();
    if (saleError) throw new Error(`Venda não encontrada: ${saleError.message}`);

    const { data: clientData, error: clientError } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (clientError) throw new Error(`Cliente não encontrado: ${clientError.message}`);
    console.log("Dados da venda e do cliente obtidos com sucesso.");

    const rpsNumber = Date.now();
    const now = new Date();
    const isoDate = now.toISOString();
    const value = parseFloat(saleData.value).toFixed(2);
    const aliquota = 0.02;
    const valorIss = (value * aliquota).toFixed(2);
    const valorLiquido = value;

    const xmlRps = `
      <GerarNfseEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
        <Rps>
          <InfDeclaracaoPrestacaoServico Id="rps${rpsNumber}">
            <Rps>
              <IdentificacaoRps><Numero>${rpsNumber}</Numero><Serie>API</Serie><Tipo>1</Tipo></IdentificacaoRps>
              <DataEmissao>${isoDate}</DataEmissao>
              <Status>1</Status>
            </Rps>
            <Competencia>${isoDate.slice(0,10)}</Competencia>
            <Servico>
              <Valores><ValorServicos>${value}</ValorServicos><ValorDeducoes>0.00</ValorDeducoes><ValorPis>0.00</ValorPis><ValorCofins>0.00</ValorCofins><ValorInss>0.00</ValorInss><ValorIr>0.00</ValorIr><ValorCsll>0.00</ValorCsll><IssRetido>2</IssRetido><ValorIss>0.00</ValorIss><OutrasRetencoes>0.00</OutrasRetencoes><BaseCalculo>${value}</BaseCalculo><Aliquota>${aliquota}</Aliquota><ValorLiquidoNfse>${valorLiquido}</ValorLiquidoNfse></Valores>
              <ItemListaServico>14.01</ItemListaServico>
              <CodigoTributacaoMunicipio>140101</CodigoTributacaoMunicipio>
              <Discriminacao>${saleData.service_description}</Discriminacao>
              <CodigoMunicipio>3162500</CodigoMunicipio>
            </Servico>
            <Prestador><Cnpj>${process.env.PRESTADOR_CNPJ}</Cnpj><InscricaoMunicipal>${process.env.PRESTADOR_IM}</InscricaoMunicipal></Prestador>
            <Tomador>
              <IdentificacaoTomador><CpfCnpj><Cnpj>${clientData.cpf_cnpj}</Cnpj></CpfCnpj></IdentificacaoTomador>
              <RazaoSocial>${clientData.name}</RazaoSocial>
              <Endereco><Endereco>${clientData.address_street}</Endereco><Numero>${clientData.address_number}</Numero><Complemento>${clientData.address_complement || ''}</Complemento><Bairro>${clientData.address_neighborhood}</Bairro><CodigoMunicipio>3162500</CodigoMunicipio><Uf>${clientData.address_state}</Uf><Cep>${clientData.address_zip_code}</Cep></Endereco>
              <Contato><Telefone>${clientData.phone || ''}</Telefone><Email>${clientData.email || ''}</Email></Contato>
            </Tomador>
            <OptanteSimplesNacional>1</OptanteSimplesNacional>
            <IncentivoFiscal>2</IncentivoFiscal>
          </InfDeclaracaoPrestacaoServico>
        </Rps>
      </GerarNfseEnvio>`;
      
    const signedXml = signXml(xmlRps, 'InfDeclaracaoPrestacaoServico');
    
    console.log("Enviando XML assinado para o webservice...");
    const url = `https://saojoaodelrei.nfiss.com.br/?WSDL`;
    const soapClient = await soap.createClientAsync(url);
    
    const soapHeader = `<nfseCabecMsg xmlns="http://www.abrasf.org.br/nfse.xsd"><cabecalho versao="2.02"><versaoDados>2.02</versaoDados></cabecalho></nfseCabecMsg>`;
    soapClient.addSoapHeader(soapHeader);
    
    const result = await soapClient.GerarNfseAsync({ nfseDadosMsg: signedXml });

    const responseData = result[0];
    console.log("Resposta recebida do webservice:", JSON.stringify(responseData, null, 2));
    
    if (responseData.ListaNfse) {
      const compNfse = responseData.ListaNfse.CompNfse;
      const nfse = compNfse.Nfse.InfNfse;
      const pdfLink = compNfse.Nfse.OutrasInformacoes;

      const updateData = { status: 'Emitida', nfs_number: nfse.Numero, verification_code: nfse.CodigoVerificacao, issue_date: nfse.DataEmissao, rps_number: rpsNumber, nfs_link_pdf: pdfLink, error_message: null };
      
      await supabase.from('sales').update(updateData).eq('id', saleId);
      console.log("Nota emitida e status atualizado no Supabase.");
      
      return { success: true, ...updateData };

    } else if (responseData.ListaMensagemRetorno) {
      const errorMessage = responseData.ListaMensagemRetorno.MensagemRetorno.map(m => `(${m.Codigo}) ${m.Mensagem}`).join('; ');
      await supabase.from('sales').update({ status: 'Erro', error_message: errorMessage }).eq('id', saleId);
      throw new Error(errorMessage);
    } else {
      throw new Error("Resposta inesperada do webservice da prefeitura.");
    }
    
  } catch (error) {
    console.error("Erro em emitirNotaFiscal:", error);
    await supabase.from('sales').update({ status: 'Erro', error_message: error.message }).eq('id', saleId);
    throw error;
  }
}
