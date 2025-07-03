import soap from 'node-soap';
import { createClient } from '@supabase/supabase-js';
import { SignedXml } from 'xml-crypto';
import * as forge from 'node-forge';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

javascript

Recolher

Encapsular

Executar

Copiar
function signXml(xml, tag) {
  try {
    const pfxBase64 = process.env.CERTIFICATE_BASE64;
    const password = process.env.CERTIFICATE_PASSWORD;

    // Validações das variáveis de ambiente
    if (!pfxBase64) {
      throw new Error("Variável de ambiente CERTIFICATE_BASE64 não está definida no Vercel.");
    }
    if (!password) {
      throw new Error("Variável de ambiente CERTIFICATE_PASSWORD não está definida no Vercel.");
    }

    // Log para verificar o início do processo de assinatura
    console.log("Iniciando assinatura XML. Tag:", tag);
    console.log("Tamanho do CERTIFICATE_BASE64:", pfxBase64.length);
    console.log("CERTIFICATE_PASSWORD definida:", !!password);

    // Conversão do Base64 para buffer
    let pfxBuffer;
    try {
      pfxBuffer = Buffer.from(pfxBase64, 'base64');
    } catch (err) {
      console.error("Erro ao decodificar CERTIFICATE_BASE64:", err);
      throw new Error("Falha ao decodificar o certificado Base64. Verifique se o conteúdo está correto.");
    }

    // Conversão do buffer para ASN.1
    let p12Asn1;
    try {
      p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
    } catch (err) {
      console.error("Erro ao converter buffer para ASN.1:", err);
      throw new Error("Formato inválido do arquivo PFX. Verifique se o certificado está correto.");
    }

    // Extração do PFX com a senha
    let p12;
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch (err) {
      console.error("Erro ao processar PFX com a senha:", err);
      throw new Error("Falha ao processar o arquivo PFX. Verifique se a senha está correta.");
    }

    // Extração da chave privada e certificado
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
      throw new Error("Chave privada ou certificado não encontrados dentro do arquivo PFX. Verifique se o arquivo ou a senha estão corretos.");
    }

    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    const certPem = forge.pki.certificateToPem(certificate);
    const certClean = certPem.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s/g, '');

    // Configuração da assinatura XML
    const sig = new SignedXml();
    sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
    sig.canonicalizationAlgorithm = "http://www.w3.org/2001/10/xml-exc-c14n#";
    sig.digestAlgorithm = "http://www.w3.org/2001/04/xmlenc#sha256";

    // Logs para depuração
    console.log("Tag usada no addReference:", tag);
    console.log("XML antes da assinatura (limpo):", xml.trim());
    console.log("Configuração do SignedXml:", {
      signatureAlgorithm: sig.signatureAlgorithm,
      canonicalizationAlgorithm: sig.canonicalizationAlgorithm,
      digestAlgorithm: sig.digestAlgorithm
    });

    // Limpar o XML de espaços em branco extras
    const cleanedXml = xml.trim();

    // Usar objeto de configuração para addReference
    sig.addReference({
      xpath: `//*[local-name(.)='${tag}']`,
      transforms: [
        "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
        "http://www.w3.org/2001/10/xml-exc-c14n#"
      ],
      digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256"
    });

    sig.signingKey = privateKeyPem;
    sig.keyInfoProvider = {
      getKeyInfo: () => `<X509Data><X509Certificate>${certClean}</X509Certificate></X509Data>`
    };

    console.log("Iniciando computeSignature...");
    sig.computeSignature(cleanedXml);
    const signedXml = sig.getSignedXml();
    console.log("XML assinado:", signedXml);

    return signedXml;
  } catch (err) {
    console.error("Erro ao assinar o XML:", err);
    throw new Error("Falha na assinatura digital. Verifique o certificado e a senha.");
  }
}

export async function emitirNotaFiscal(saleId, clientId) {
  await supabase.from('sales').update({ status: 'Processando' }).eq('id', saleId);

  try {
    const { data: saleData, error: saleError } = await supabase.from('sales').select('*').eq('id', saleId).single();
    if (saleError) throw new Error(`Venda não encontrada: ${saleError.message}`);

    const { data: clientData, error: clientError } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (clientError) throw new Error(`Cliente não encontrado: ${clientError.message}`);

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
              <IdentificacaoRps>
                <Numero>${rpsNumber}</Numero>
                <Serie>API</Serie>
                <Tipo>1</Tipo>
              </IdentificacaoRps>
              <DataEmissao>${isoDate}</DataEmissao>
              <Status>1</Status>
            </Rps>
            <Competencia>${isoDate.slice(0,10)}</Competencia>
            <Servico>
              <Valores>
                <ValorServicos>${value}</ValorServicos>
                <ValorDeducoes>0.00</ValorDeducoes>
                <ValorPis>0.00</ValorPis>
                <ValorCofins>0.00</ValorCofins>
                <ValorInss>0.00</ValorInss>
                <ValorIr>0.00</ValorIr>
                <ValorCsll>0.00</ValorCsll>
                <IssRetido>2</IssRetido>
                <ValorIss>0.00</ValorIss>
                <OutrasRetencoes>0.00</OutrasRetencoes>
                <BaseCalculo>${value}</BaseCalculo>
                <Aliquota>${aliquota}</Aliquota>
                <ValorLiquidoNfse>${valorLiquido}</ValorLiquidoNfse>
              </Valores>
              <ItemListaServico>14.01</ItemListaServico>
              <CodigoTributacaoMunicipio>140101</CodigoTributacaoMunicipio>
              <Discriminacao>${saleData.service_description}</Discriminacao>
              <CodigoMunicipio>3162500</CodigoMunicipio>
            </Servico>
            <Prestador>
              <Cnpj>${process.env.PRESTADOR_CNPJ}</Cnpj>
              <InscricaoMunicipal>${process.env.PRESTADOR_IM}</InscricaoMunicipal>
            </Prestador>
            <Tomador>
              <IdentificacaoTomador>
                <CpfCnpj><Cnpj>${clientData.cpf_cnpj}</Cnpj></CpfCnpj>
              </IdentificacaoTomador>
              <RazaoSocial>${clientData.name}</RazaoSocial>
              <Endereco>
                <Endereco>${clientData.address_street}</Endereco>
                <Numero>${clientData.address_number}</Numero>
                <Complemento>${clientData.address_complement || ''}</Complemento>
                <Bairro>${clientData.address_neighborhood}</Bairro>
                <CodigoMunicipio>3162500</CodigoMunicipio>
                <Uf>${clientData.address_state}</Uf>
                <Cep>${clientData.address_zip_code}</Cep>
              </Endereco>
              <Contato>
                <Telefone>${clientData.phone || ''}</Telefone>
                <Email>${clientData.email || ''}</Email>
              </Contato>
            </Tomador>
            <OptanteSimplesNacional>1</OptanteSimplesNacional>
            <IncentivoFiscal>2</IncentivoFiscal>
          </InfDeclaracaoPrestacaoServico>
        </Rps>
      </GerarNfseEnvio>`;
      
    console.log("XML gerado antes da assinatura:", xmlRps);
    const signedXml = signXml(xmlRps, 'InfDeclaracaoPrestacaoServico');
    
    const url = `https://saojoaodelrei.nfiss.com.br/?WSDL`;
    const soapClient = await soap.createClientAsync(url);
    
    const soapHeader = `<nfseCabecMsg xmlns="http://www.abrasf.org.br/nfse.xsd"><cabecalho versao="2.02"><versaoDados>2.02</versaoDados></cabecalho></nfseCabecMsg>`;
    soapClient.addSoapHeader(soapHeader);
    
    const result = await soapClient.GerarNfseAsync({ nfseDadosMsg: signedXml });

    const responseData = result[0];
    
    if (responseData.ListaNfse) {
      const compNfse = responseData.ListaNfse.CompNfse;
      const nfse = compNfse.Nfse.InfNfse;
      const pdfLink = compNfse.Nfse.OutrasInformacoes;

      const updateData = {
        status: 'Emitida',
        nfs_number: nfse.Numero,
        verification_code: nfse.CodigoVerificacao,
        issue_date: nfse.DataEmissao,
        rps_number: rpsNumber,
        nfs_link_pdf: pdfLink,
        error_message: null
      };
      
      await supabase.from('sales').update(updateData).eq('id', saleId);
      
      return { success: true, ...updateData };

    } else if (responseData.ListaMensagemRetorno) {
      const errorMessage = responseData.ListaMensagemRetorno.MensagemRetorno.map(m => `(${m.Codigo}) ${m.Mensagem}`).join('; ');
      await supabase.from('sales').update({ status: 'Erro', error_message: errorMessage }).eq('id', saleId);
      throw new Error(errorMessage);
    } else {
      throw new Error("Resposta inesperada do webservice da prefeitura.");
    }
    
  } catch (error) {
    await supabase.from('sales').update({ status: 'Erro', error_message: error.message }).eq('id', saleId);
    throw error;
  }
}