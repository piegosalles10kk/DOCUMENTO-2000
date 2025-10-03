const express = require('express');
const path = require('path');
const connectDB = require('./src/config/dbConnect'); 
const docsRoutes = require('./src/routes/docsRoute');

const PORT = process.env.PORT || 1100;
const HOST = process.env.HOST || '0.0.0.0'; // Permite acesso externo

const app = express();

// 1. CONEXÃO COM O BANCO DE DADOS
connectDB(); 

// 2. MIDDLEWARES
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 3. ARQUIVOS ESTÁTICOS
app.use(express.static(path.join(__dirname, 'public'))); 

// 4. VIEW ENGINE
app.set('views', path.join(__dirname, 'public', 'dynamic')); 
app.set('view engine', 'ejs');

// 5. ROTAS
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api/docs', docsRoutes);

// Rota de renderização do documento (EJS)
app.get('/render/:identifier', async (req, res) => {
    try {
        const Documentation = require('./src/models/Documentation');
        const identifier = req.params.identifier;
        const doc = await Documentation.findOne({ identificador: identifier }); 

        if (!doc) {
            return res.status(404).send(`Documentação ${identifier} não encontrada.`);
        }

        res.render('documento', { documentacao: doc });

    } catch (error) {
        console.error("Erro ao buscar documentação:", error);
        res.status(500).send("Erro interno do servidor.");
    }
});

// 6. INICIALIZAÇÃO
app.listen(PORT, HOST, () => {
    console.log(`✅ Servidor rodando em http://${HOST}:${PORT}`);
    console.log(`📡 Acesso externo disponível`);
});