#  Sistema de Documentação Técnica

Sistema completo de gerenciamento de documentação técnica com autenticação, controle de permissões e interface web moderna.

---

##  Sumário

- [Características](#-características)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Inicialização](#-inicialização)
- [Estrutura de Roles](#-estrutura-de-roles)
- [API Endpoints](#-api-endpoints)
- [Estrutura de Documentos](#-estrutura-de-documentos)
- [Docker](#-docker)
- [Segurança](#-segurança)
- [Solução de Problemas](#-solução-de-problemas)

---

##  Características

- ✅ **Sistema de Autenticação JWT** com roles (Admin, Técnico, Visualizador)
- ✅ **Controle de Permissões** baseado em roles
- ✅ **Recuperação de Senha** via email com código temporário
- ✅ **Documentação Modular** com seções e blocos aninhados
- ✅ **Múltiplos Tipos de Conteúdo** (texto, credenciais, código, imagens, mapas de rede)
- ✅ **Interface Web** com renderização EJS
- ✅ **API RESTful** completa
- ✅ **Exportação para PDF** via navegador
- ✅ **Suporte a Docker** para deploy facilitado

---

##  Pré-requisitos

- **Node.js** >= 18.0.0
- **MongoDB** >= 4.4 (local ou remoto)
- **Conta Gmail** (para envio de emails de recuperação)
- **Git** (opcional)

---

##  Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd documenta-bug-refactored
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Renomeie o arquivo `dotenv` para `.env` e preencha:

```env
PORT=1100

# JWT Secret (use um hash forte em produção)
SECRET=$2a$10$MN0/k4OL.7YJuvXW1KjCbOk6F.X10VmKBKJYTJrm5cf.MNP5ta65m

# Configurações de Email (Gmail)
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app

# Configurações da Aplicação
APP_NAME=Documentos 2000
```

#### Como gerar uma senha de aplicativo no Gmail:

1. Acesse [Conta Google > Segurança](https://myaccount.google.com/security)
2. Ative a **Verificação em duas etapas**
3. Vá em **Senhas de app** e gere uma nova
4. Use essa senha no `EMAIL_PASS`

---

##  Configuração

### MongoDB Local

O sistema está pré-configurado para MongoDB local:

```
mongodb://127.0.0.1:27017/infra_docs
```

### MongoDB Remoto (Atlas)

Edite `src/config/dbConnect.js` ou use variável de ambiente:

```bash
export MONGO_URI="mongodb+srv://usuario:senha@cluster.mongodb.net/infra_docs"
```

### Acesso Externo (Rede)

O servidor já está configurado para aceitar conexões externas (`HOST: 0.0.0.0`).

**Liberar porta no Firewall Windows:**

```powershell
New-NetFirewallRule -DisplayName "Documentacao API" -Direction Inbound -LocalPort 1100 -Protocol TCP -Action Allow
```

---

##  Inicialização

### Modo Desenvolvimento (com auto-reload)

```bash
npm run dev
```

### Modo Produção

```bash
npm start
```

### Com PM2 (Recomendado para produção)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start app.js --name "documentacao-api"

# Ver logs em tempo real
pm2 logs documentacao-api

# Reiniciar
pm2 restart documentacao-api

# Parar
pm2 stop documentacao-api

# Configurar para iniciar com o sistema
pm2 startup
pm2 save
```

---

##  Primeiro Acesso - Criar Usuário Inicial

⚠️ **IMPORTANTE**: O banco de dados inicia vazio. Você **DEVE** criar o primeiro usuário administrador via API antes de acessar a interface web.

### Criar Primeiro Admin via Postman/Insomnia

**1. Configure a requisição:**

```http
POST http://localhost:1100/api/users/auth/register
Content-Type: application/json
```

**2. Body (JSON):**

```json
{
  "nome_usuario": "Administrador",
  "email_usuario": "admin@empresa.com",
  "telefone_usuario": 11999999999,
  "data_nascimento_usuario": "1990-01-01",
  "cargo_usuario": "Administrador do Sistema",
  "acessos_usuario": "adm",
  "senha_usuario": "admin123",
  "confirmarSenha": "admin123"
}
```

**3. Resposta esperada:**

```json
{
  "sucesso": true,
  "msg": "Usuário criado com sucesso"
}
```

### Criar Primeiro Admin via cURL

```bash
curl -X POST http://localhost:1100/api/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome_usuario": "Administrador",
    "email_usuario": "admin@empresa.com",
    "telefone_usuario": 11999999999,
    "data_nascimento_usuario": "1990-01-01",
    "cargo_usuario": "Administrador do Sistema",
    "acessos_usuario": "adm",
    "senha_usuario": "admin123",
    "confirmarSenha": "admin123"
  }'
```

### Primeiro Login na Interface

Após criar o usuário administrador:

```bash
# 1. Acesse a interface web
http://localhost:1100/login.html

# 2. Faça login com as credenciais criadas
Email: admin@empresa.com
Senha: admin123

# 3. Você será redirecionado para o dashboard
http://localhost:1100/

# 4. Agora você pode:
- Criar novos usuários pela interface (Gerenciar Usuários)
- Criar documentos
- Gerenciar todo o sistema
```

### Validações Importantes

**Campos obrigatórios ao criar usuário:**
- ✅ `nome_usuario` - Nome completo
- ✅ `email_usuario` - Email único (usado para login)
- ✅ `telefone_usuario` - Número de telefone (somente dígitos)
- ✅ `data_nascimento_usuario` - Formato: YYYY-MM-DD
- ✅ `cargo_usuario` - Cargo/função do usuário
- ✅ `acessos_usuario` - Role: `adm`, `tecnico` ou `visualizador`
- ✅ `senha_usuario` - Mínimo 6 caracteres
- ✅ `confirmarSenha` - Deve ser igual à senha

**Roles disponíveis:**
- `adm` - Administrador (acesso total)
- `tecnico` - Técnico (criar/editar próprios documentos)
- `visualizador` - Apenas visualizar documentos

### Criar Usuários Adicionais

Após o primeiro login, você pode criar novos usuários de duas formas:

**1. Via Interface Web (Recomendado):**
- Dashboard > "Gerenciar Usuários" > "Novo Usuário"

**2. Via API:**
- Use a mesma rota `/api/users/auth/register`
- Não requer autenticação para criar usuários

---

##  Estrutura de Roles

O sistema possui 3 níveis de acesso:

### 🔴 Administrador (`adm`)

- ✅ Criar, editar e excluir qualquer documento
- ✅ Gerenciar usuários
- ✅ Acesso total ao sistema

### 🟡 Técnico (`tecnico`)

- ✅ Criar novos documentos
- ✅ Editar e excluir **apenas seus próprios documentos**
- ✅ Visualizar todos os documentos

### 🟢 Visualizador (`visualizador`)

- ✅ Apenas visualizar documentos
- ❌ Não pode criar, editar ou excluir

---

## 🌐 API Endpoints

### Autenticação (Público)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/users/auth/register` | Criar novo usuário |
| `POST` | `/api/users/auth/login` | Login e obter token JWT |

**Exemplo de Registro:**

```json
POST /api/users/auth/register
{
  "nome_usuario": "João Silva",
  "email_usuario": "joao@exemplo.com",
  "telefone_usuario": 11987654321,
  "data_nascimento_usuario": "1990-01-15",
  "cargo_usuario": "Analista de TI",
  "acessos_usuario": "tecnico",
  "senha_usuario": "senha123",
  "confirmarSenha": "senha123"
}
```

**Exemplo de Login:**

```json
POST /api/users/auth/login
{
  "email_usuario": "joao@exemplo.com",
  "senha_usuario": "senha123"
}
```

**Resposta:**

```json
{
  "sucesso": true,
  "msg": "Autenticação realizada com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "role": "tecnico"
  }
}
```

### Recuperação de Senha (Público)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/users/auth/recover/:email` | Enviar código por email |
| `GET` | `/api/users/auth/verify-code/:email/:codigo` | Verificar código |
| `PUT` | `/api/users/auth/update-password-recovery` | Atualizar senha |

**Fluxo de Recuperação:**

```bash
# 1. Solicitar código
GET /api/users/auth/recover/joao@exemplo.com

# 2. Verificar código
GET /api/users/auth/verify-code/joao@exemplo.com/ABC123

# 3. Redefinir senha
PUT /api/users/auth/update-password-recovery
{
  "email_usuario": "joao@exemplo.com",
  "codigoRecuperarSenha": "ABC123",
  "senha_usuario": "novaSenha123",
  "confirmarSenha": "novaSenha123"
}
```

### Documentos (Requer Autenticação)

**IMPORTANTE:** Todas as requisições devem incluir o header:

```
Authorization: Bearer SEU_TOKEN_JWT
```

| Método | Endpoint | Permissão | Descrição |
|--------|----------|-----------|-----------|
| `GET` | `/api/docs` | Todos | Listar todos os documentos |
| `GET` | `/api/docs/id/:identifier` | Todos | Buscar documento específico |
| `POST` | `/api/docs` | Admin/Técnico | Criar documento |
| `PUT` | `/api/docs/:identifier` | Admin/Criador | Atualizar documento |
| `DELETE` | `/api/docs/:identifier` | Admin/Criador | Excluir documento |

### Usuários (Requer Autenticação)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/users` | Listar todos os usuários |
| `GET` | `/api/users/:id` | Buscar usuário por ID |
| `PUT` | `/api/users/:id` | Atualizar usuário |
| `DELETE` | `/api/users/:id` | Excluir usuário |

### Interface Web

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Dashboard principal (requer autenticação) |
| `GET` | `/render/:identifier` | Renderizar documento em HTML |
| `GET` | `/login.html` | Página de login |
| `GET` | `/user-crud.html` | Gerenciamento de usuários (admin) |

---

##  Frontend - Interface do Usuário

### Arquivos e Funcionalidades

#### 1. **login.html** - Tela de Autenticação

**Funcionalidades:**
- Login com email e senha
- Recuperação de senha via email
- Validação de formulários
- Redirecionamento automático após login

**Fluxo de Login:**
```javascript
// 1. Usuário insere email e senha
// 2. Sistema envia credenciais para /api/users/auth/login
// 3. Backend retorna token JWT
// 4. Token é salvo no localStorage
// 5. Redirecionamento para dashboard (index.html)
```

**Fluxo de Recuperação de Senha:**
```javascript
// 1. Usuário clica em "Esqueci minha senha"
// 2. Insere email cadastrado
// 3. Sistema envia código de 6 caracteres por email
// 4. Usuário insere código recebido
// 5. Sistema valida o código
// 6. Usuário define nova senha
// 7. Senha é atualizada no banco
```

#### 2. **index.html** - Dashboard Principal

**Funcionalidades:**
- **Navbar dinâmica** com informações do usuário
- **Lista de documentos** com pesquisa em tempo real
- **Editor modular** de documentos com:
  - Seções aninhadas (suporte a 3 níveis)
  - 6 tipos de blocos de conteúdo
  - Pré-visualização em tempo real
- **Controle de permissões** baseado em role:
  - Admin: Acesso total + gerenciar usuários
  - Técnico: Criar/editar próprios documentos
  - Visualizador: Apenas visualizar

**Tipos de Blocos Disponíveis:**

| Tipo | Ícone | Uso |
|------|-------|-----|
| `textoBruto` | 📝 | Texto simples e descrições |
| `detalhes` | 📋 | Pares Rótulo:Valor (IP, MAC, etc.) |
| `credenciais` | 🔐 | Senhas e acessos (destaque visual) |
| `blocoCodigo` | 💻 | Scripts e comandos |
| `imagem` | 🖼️ | Diagramas via URL |
| `mapaRede` | 🗺️ | Diagramas ASCII de rede |

#### 3. **user-crud.html** - Gerenciamento de Usuários

**Funcionalidades (Apenas Admin):**
- Listar todos os usuários
- Criar novos usuários
- Editar informações (exceto senha)
- Excluir usuários
- Definir roles (adm/técnico/visualizador)

**Campos do Usuário:**
- Nome completo
- Email (usado para login)
- Telefone
- Data de nascimento
- Cargo/Profissão
- Role (nível de acesso)
- Senha (apenas na criação)

#### 4. **documento.ejs** - Renderização de Documentos

**Funcionalidades:**
- Renderização server-side com EJS
- Layout otimizado para impressão/PDF
- Índice automático das seções
- Suporte a seções aninhadas
- Estilos específicos por tipo de bloco:
  - Credenciais com destaque amarelo
  - Código com fundo escuro
  - Detalhes com formatação tabular

**Como gerar PDF:**
```bash
# Método 1: Pelo navegador
1. Acesse: http://seu-servidor:1100/render/IDENTIFICADOR
2. Clique no botão "🖨️ Imprimir/PDF"
3. Selecione "Salvar como PDF"

# Método 2: Atalho de teclado
1. Abra o documento renderizado
2. Pressione Ctrl + P (Windows/Linux) ou Cmd + P (Mac)
3. Escolha destino como PDF
```

---

##  Sistema de Autenticação Frontend

### Armazenamento do Token

O token JWT é armazenado no `localStorage` após login bem-sucedido:

```javascript
// Salvando token após login
localStorage.setItem('token', response.token);

// Incluindo token nas requisições
fetch('/api/docs', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### Verificação de Autenticação

Todas as páginas protegidas verificam o token no carregamento:

```javascript
// Função checkAuthAndLoadUser() em script.js
// 1. Verifica se o token existe
// 2. Decodifica o payload do JWT
// 3. Valida a expiração (8 horas)
// 4. Redireciona para login se inválido
// 5. Carrega informações do usuário na navbar
```

### Controle de Permissões na Interface

**Elementos condicionais baseados em role:**

```javascript
// Botão "Novo Documento" (oculto para visualizadores)
if (userRole === 'visualizador') {
    btnNewDocument.classList.add('d-none');
}

// Link "Gerenciar Usuários" (apenas admin)
if (userRole === 'adm') {
    adminLink.classList.remove('d-none');
}

// Botões Editar/Excluir na lista (ocultos para visualizadores)
const canEditOrDelete = userRole !== 'visualizador';
```

---

##  Recursos da Interface

### Pesquisa em Tempo Real

Sistema de busca instantânea na lista de documentos:

```javascript
// Pesquisa por:
- Título do documento
- Identificador
- Conteúdo (opcional)

// Comportamento:
- Filtra enquanto digita
- Botão de limpar pesquisa
- Re-renderiza lista filtrada
```

### Editor Modular

**Características:**
- Interface drag-free (sem arrastar)
- Modais para edição de blocos
- Validação de formulários
- Pré-visualização inline
- Salvamento automático do estado

**Hierarquia de Edição:**
```
Documento
  ├─ Título + Identificador
  └─ Seções (Níveis 1-3)
      ├─ Título + Subtítulo
      └─ Blocos de Conteúdo
          ├─ Tipo de Bloco
          ├─ Título do Bloco (opcional)
          ├─ Descrição (opcional)
          └─ Conteúdo específico
```

### Responsividade

Todas as telas são responsivas e adaptadas para:
- 📱 Mobile (< 768px)
- 📱 Tablet (768px - 1024px)
- 💻 Desktop (> 1024px)

---

## 🎯 Guia de Uso Frontend

### Primeiro Acesso

```bash
# 1. Acesse a tela de login
http://seu-servidor:1100/login.html

# 2. Faça login com credenciais de admin
# (Usuário inicial deve ser criado via API)

# 3. Crie o primeiro documento
- Clique em "Novo Documento"
- Preencha Título e Identificador
- Adicione seções e blocos
- Salve o documento
```

### Criar um Documento Completo

```bash
1. Dashboard > "Novo Documento"

2. Preencher Metadados:
   - Título: "Documentação do Servidor SRVAPP01"
   - Identificador: "SRVAPP01-DOC"

3. Adicionar Seção Principal:
   - Título: "Visão Geral"
   - Subtítulo: "Informações do Servidor"

4. Adicionar Bloco de Detalhes:
   - Tipo: Detalhes (Rótulo:Valor)
   - Adicionar pares:
     * IP: 192.168.10.100
     * Sistema: Windows Server 2022
     * CPU: Intel Xeon 8 cores

5. Adicionar Bloco de Credenciais:
   - Tipo: Credenciais de Acesso
   - Título: "Acesso Administrativo"
   - Conteúdo:
     Login: administrador
     Senha: SenhaSegura@2025

6. Adicionar Seção Aninhada:
   - Dentro de "Visão Geral"
   - Título: "Procedimentos de Backup"
   - Adicionar Bloco de Código com script

7. Salvar Documento
```

### Recuperar Senha

```bash
1. Tela de Login > "Esqueci minha senha"

2. Inserir Email Cadastrado:
   seuemail@empresa.com

3. Verificar Email:
   - Código de 6 caracteres enviado
   - Válido por 15 minutos

4. Inserir Código:
   ABC123

5. Definir Nova Senha:
   - Mínimo 6 caracteres
   - Confirmar senha

6. Login com Nova Senha
```

### Gerenciar Usuários (Admin)

```bash
1. Dashboard > Link "Gerenciar Usuários"

2. Criar Novo Usuário:
   - Nome: João Silva
   - Email: joao@empresa.com
   - Telefone: 11987654321
   - Cargo: Analista de Infraestrutura
   - Role: técnico
   - Senha: senha123

3. Editar Usuário Existente:
   - Apenas informações básicas
   - Senha NÃO pode ser alterada (usar recuperação)

4. Excluir Usuário:
   - Confirmar exclusão permanente
```

---

## 📄 Estrutura de Documentos

### Schema Completo

```json
{
  "tituloDocumento": "Nome do Documento",
  "identificador": "IDENTIFICADOR-UNICO",
  "criadoPor": "507f1f77bcf86cd799439011",
  "secoes": [
    {
      "tituloSecao": "Título da Seção",
      "subtituloSecao": "Subtítulo (opcional)",
      "blocos": [
        {
          "tituloBloco": "Nome do Bloco",
          "descricaoBloco": "Descrição do bloco",
          "tipoBloco": "textoBruto",
          "valorBruto": "Conteúdo do bloco"
        }
      ],
      "secoesAninhadas": []
    }
  ]
}
```

### Tipos de Blocos

#### 1. **Texto Bruto** (`textoBruto`)

```json
{
  "tipoBloco": "textoBruto",
  "valorBruto": "Este é um texto explicativo sobre a infraestrutura."
}
```

#### 2. **Detalhes** (`detalhes`)

```json
{
  "tipoBloco": "detalhes",
  "detalhes": [
    {"rotulo": "IP", "valor": "192.168.10.1"},
    {"rotulo": "MAC", "valor": "78:9A:18:30:20:3D"},
    {"rotulo": "Gateway", "valor": "192.168.10.254"}
  ]
}
```

#### 3. **Credenciais** (`credenciais`)

```json
{
  "tipoBloco": "credenciais",
  "valorBruto": "Login: admin\nSenha: ,~~taE3J\\UVwD2nX)w\nURL: https://sistema.exemplo.com"
}
```

#### 4. **Bloco de Código** (`blocoCodigo`)

```json
{
  "tipoBloco": "blocoCodigo",
  "tituloBloco": "Script de Backup",
  "valorBruto": "#!/bin/bash\necho 'Iniciando backup...'\nmongodump --db infra_docs"
}
```

#### 5. **Mapa de Rede** (`mapaRede`)

```json
{
  "tipoBloco": "mapaRede",
  "valorBruto": "Internet\n  |\n[Firewall] - 192.168.10.1\n  |\n[Switch]\n  ├─ Servidor 1\n  └─ Servidor 2"
}
```

#### 6. **Imagem** (`imagem`)

```json
{
  "tipoBloco": "imagem",
  "urlImagem": "https://exemplo.com/diagrama.png",
  "altImagem": "Diagrama de rede",
  "valorBruto": "Legenda da imagem"
}
```

### Exemplo Completo

```json
{
  "tituloDocumento": "Documentação RACK001",
  "identificador": "RACK001-FISICO",
  "secoes": [
    {
      "tituloSecao": "Firewall pfSense",
      "subtituloSecao": "Configuração Principal",
      "blocos": [
        {
          "tipoBloco": "detalhes",
          "detalhes": [
            {"rotulo": "IP", "valor": "192.168.10.1"},
            {"rotulo": "Versão", "valor": "2.7.0"}
          ]
        }
      ],
      "secoesAninhadas": [
        {
          "tituloSecao": "Credenciais de Acesso",
          "blocos": [
            {
              "tipoBloco": "credenciais",
              "valorBruto": "Login: admin\nSenha: senhaSegura123"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🐳 Docker

### Construir e executar

```bash
# Build da imagem
docker build -t doc-system .

# Executar contêiner
docker run -p 1100:1100 \
  -e MONGO_URI="mongodb://host.docker.internal:27017/infra_docs" \
  doc-system
```

### Docker Compose

```bash
# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

---

## 🔒 Segurança

### Recomendações Essenciais

1. **Altere o SECRET do JWT** em produção:
   ```bash
   # Gerar hash bcrypt forte
   node -e "console.log(require('bcrypt').hashSync('sua-frase-secreta', 10))"
   ```

2. **Use HTTPS em produção**:
   - Configure um proxy reverso (Nginx/Apache)
   - Use certificado SSL/TLS válido

3. **Proteja credenciais sensíveis**:
   - Nunca commite o arquivo `.env`
   - Use variáveis de ambiente no servidor

4. **Restrinja acesso à API**:
   - Configure firewall para permitir apenas IPs confiáveis
   - Use VPN para acesso remoto

5. **Faça backups regulares**:
   ```bash
   # Backup MongoDB
   mongodump --db infra_docs --out /backup/$(date +%Y%m%d)
   
   # Restore
   mongorestore --db infra_docs /backup/20250403/infra_docs
   ```

### Política de Senhas

- Mínimo de 6 caracteres
- Código de recuperação expira em 15 minutos
- Token JWT expira em 8 horas

---

## 🛠️ Solução de Problemas

### Erro: "Cannot connect to MongoDB"

```bash
# Verificar se MongoDB está rodando (Windows)
net start MongoDB

# Verificar se MongoDB está rodando (Linux)
sudo systemctl status mongod

# Testar conexão
mongo --eval "db.version()"
```

### Erro: "EADDRINUSE" (porta em uso)

```bash
# Ver processos na porta 1100
netstat -ano | findstr :1100

# Matar processo (Windows)
taskkill /PID <PID> /F

# Ou altere a porta no .env
PORT=3000
```

### Erro ao enviar email de recuperação

1. Verifique se as credenciais do Gmail estão corretas
2. Certifique-se de usar uma **Senha de App**, não a senha normal
3. Verifique se a verificação em duas etapas está ativada

### Token inválido ou expirado

- Faça login novamente para obter um novo token
- Tokens expiram após 8 horas

### Permissão negada ao editar documento

- Verifique se você é o criador do documento (para técnicos)
- Apenas administradores podem editar qualquer documento

---

## 📊 Monitoramento

### Logs do Sistema

```bash
# Com PM2
pm2 logs documentacao-api

# Logs do MongoDB (Windows)
type "C:\Program Files\MongoDB\Server\7.0\log\mongod.log"

# Logs do MongoDB (Linux)
tail -f /var/log/mongodb/mongod.log
```

### Status dos Serviços

```bash
# PM2
pm2 status

# Docker
docker-compose ps

# MongoDB
mongo --eval "db.stats()"
```


---

## 📞 Suporte

- **Documentação MongoDB**: https://docs.mongodb.com/
- **Node.js**: https://nodejs.org/docs/
- **Express**: https://expressjs.com/
- **JWT**: https://jwt.io/

---

**Versão**: 2.0.0  
**Última Atualização**: Outubro 2025  
**Autor**: 10kk
