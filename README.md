# 🚀 Gestor de Estética Automotiva com Emissão de NFS-e

Este é um sistema de gestão completo (SaaS) desenvolvido para otimizar a rotina de uma estética automotiva, com foco na agilidade do cadastro de clientes e na automação da emissão de Notas Fiscais de Serviço Eletrônicas (NFS-e).

A plataforma é totalmente responsiva, permitindo o uso em desktops e dispositivos móveis, e conta com um sistema de autenticação seguro para proteger os dados de cada usuário.

---

## ✨ Funcionalidades Principais

* **Autenticação Segura:** Sistema de login com e-mail e senha gerenciado pelo Supabase.
* **Gestão de Clientes:**
    * Cadastro, listagem e edição de clientes.
    * Preenchimento automático de endereço ao digitar o CEP (via API ViaCEP).
* **Registro de Vendas:**
    * Formulário intuitivo para registrar serviços prestados.
    * Seleção de múltiplos serviços a partir de uma lista pré-definida.
    * Campo de observações para detalhes adicionais (ex: placa do veículo).
* **Emissão Automatizada de NFS-e:**
    * Ao finalizar uma venda, o sistema se comunica automaticamente com o webservice da prefeitura (padrão ABRASF 2.02) para emitir a nota fiscal.
    * Utiliza certificado digital A1 para assinatura segura das requisições.
* **Visualização Imediata da Nota:** Após a emissão, um visualizador exibe o PDF da nota na tela, com opções para compartilhar ou imprimir direto do celular ou desktop.
* **Relatórios de Vendas:** Uma página que exibe o histórico completo de vendas, com status da nota fiscal em tempo real.
* **Design Responsivo:** Interface limpa e moderna que se adapta a qualquer tamanho de tela, com menu lateral no desktop e menu sanduíche no mobile.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com uma stack moderna, focada em escalabilidade e facilidade de manutenção.

* **Frontend:**
    * **React.js:** Biblioteca principal para a construção da interface.
    * **React Router:** Para a gestão das rotas da aplicação.
    * **Axios:** Para realizar as chamadas HTTP para o backend.
    * **CSS Puro:** Para uma estilização limpa, leve e personalizada.

* **Backend (Serverless):**
    * **Vercel Serverless Functions:** Funções Node.js que executam a lógica de backend sob demanda, sem a necessidade de um servidor tradicional.
    * **Node.js:** Ambiente de execução do backend.
    * **Bibliotecas Principais:** `node-soap` para comunicação com o webservice da prefeitura, `xml-crypto` e `node-forge` para a assinatura digital do XML da nota.

* **Banco de Dados e Autenticação:**
    * **Supabase:** Utilizado como nosso "Backend-as-a-Service" para:
        * Banco de dados PostgreSQL.
        * Sistema de autenticação de usuários.
        * Políticas de segurança (Row Level Security) para garantir a privacidade dos dados.

* **Hospedagem:**
    * **Vercel:** Plataforma utilizada para o deploy contínuo tanto do frontend quanto das funções de backend (Serverless Functions).

---

## ⚙️ Configuração e Instalação

Para rodar este projeto localmente, siga os passos abaixo.

### Pré-requisitos

* [Node.js](https://nodejs.org/) (versão 18.x ou superior)
* Conta no [Supabase](https://supabase.com/)
* Conta na [Vercel](https://vercel.com/) conectada ao seu GitHub
* Um Certificado Digital A1 (arquivo `.pfx`)

### 1. Configuração do Backend (Variáveis de Ambiente)

O backend é executado como uma Função Serverless na Vercel. Todas as chaves secretas devem ser configuradas diretamente no painel da Vercel.

Vá para o seu projeto na Vercel, em **Settings > Environment Variables**, e adicione as seguintes variáveis:


Variáveis do Supabase
SUPABASE_URL=A_SUA_URL_DO_SUPABASE
SUPABASE_SERVICE_KEY=A_SUA_CHAVE_SERVICE_ROLE_SECRETA_DO_SUPABASE

Variáveis do Certificado Digital
CERTIFICATE_BASE64=SEU_CERTIFICADO_PFX_CONVERTIDO_PARA_BASE64
CERTIFICATE_PASSWORD=A_SENHA_DO_SEU_CERTIFICADO

Variáveis do Prestador (Sua Empresa)
PRESTADOR_CNPJ=SEU_CNPJ_SEM_PONTOS_E_BARRAS
PRESTADOR_IM=SUA_INSCRICAO_MUNICIPAL


### 2. Configuração do Frontend (Local)

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git](https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git)
    cd SEU_REPOSITORIO
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Crie o arquivo de variáveis de ambiente:** Na raiz do projeto, crie um arquivo chamado `.env` e adicione as chaves públicas do Supabase.
    ```
    REACT_APP_SUPABASE_URL=A_SUA_URL_DO_SUPABASE
    REACT_APP_SUPABASE_ANON_KEY=A_SUA_CHAVE_ANON_PUBLIC_DO_SUPABASE
    ```

4.  **Rode o projeto localmente:**
    ```bash
    npm start
    ```
    A aplicação estará disponível em `http://localhost:3000`.

---

## 🚀 Deploy

O deploy é feito automaticamente pela Vercel. Qualquer `git push` para a branch `main` no GitHub irá acionar um novo build e atualizar o site em produção.

```markdown
