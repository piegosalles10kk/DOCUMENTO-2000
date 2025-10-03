const express = require('express');
const path = require('path');
const connectDB = require('./src/config/dbConnect'); 
const docsRoutes = require('./src/routes/docsRoute');
const Documentation = require('./src/models/Documentation'); 

const PORT = process.env.PORT || 1100;
const app = express();

// 1. CONEXÃO COM O BANCO DE DADOS
connectDB(); 

// --- Configurações Express ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 2. CONFIGURAÇÃO DE ARQUIVOS ESTÁTICOS
// Serve todos os arquivos dentro da pasta 'public' (index.html, script.js, style.css)
app.use(express.static(path.join(__dirname, 'public'))); 

// 3. CONFIGURAÇÃO DO MOTOR DE TEMPLATE (EJS)
// APONTA PARA A NOVA PASTA: public/dynamic
app.set('views', path.join(__dirname, 'public', 'dynamic')); 
app.set('view engine', 'ejs');


// ==========================================================
// ROTAS PRINCIPAIS
// ==========================================================

// Rota 1: Servir a Aplicação Front-end
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota 2: API CRUD
app.use('/api/docs', docsRoutes);

// Rota 3: Visualização do Documento (EJS - Usa o template agora em public/dynamic)
app.get('/render/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        // NOTA: Você deve garantir que importou corretamente o modelo Documentation
        const doc = await Documentation.findOne({ identificador: identifier }); 

        if (!doc) {
            return res.status(404).send(`Documentação ${identifier} não encontrada.`);
        }

        // Renderiza o template 'documento.ejs'
        res.render('documento', { documentacao: doc });

    } catch (error) {
        console.error("Erro ao buscar documentação para renderização:", error);
        res.status(500).send("Erro interno do servidor durante a renderização.");
    }
});


// 4. INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});