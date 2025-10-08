const mongoose = require('mongoose');

// --- 1. Sub-Schema: Detalhes de Conteúdo (DetalheSchema) ---
const DetalheSchema = new mongoose.Schema({
    rotulo: { type: String, required: true },
    valor: { type: String, required: true },
}, { _id: false });

// --- 2. Sub-Schema: Bloco de Conteúdo (BlocoConteudoSchema) ---
const BlocoConteudoSchema = new mongoose.Schema({
    
    tituloBloco: { type: String },    // Título opcional para o bloco (ex: "Configuração SSH")
    descricaoBloco: { type: String }, // Descrição opcional (ex: "Use este código para...")

    tipoBloco: { 
        type: String,
        enum: ['textoBruto', 'detalhes', 'credenciais', 'blocoCodigo', 'imagem', 'mapaRede'],
        required: true // OBRIGATÓRIO
    },

    // Campos de Conteúdo
    valorBruto: { type: String }, // Usado para texto geral, credenciais, código, mapa de rede (o conteúdo em si)
    
    // Usado APENAS para o tipo 'detalhes'
    detalhes: {
        type: [DetalheSchema],
        required: false 
    }, 
    
    // Usado APENAS para o tipo 'imagem'
    urlImagem: { type: String },
    altImagem: { type: String }

}, { _id: false });


// --- 3. Sub-Schema: Seção Modular (RECURSIVA) ---
const SecaoSchema = new mongoose.Schema(); // Definido para recursividade

SecaoSchema.add({
    tituloSecao: { type: String, required: true }, // OBRIGATÓRIO
    subtituloSecao: { type: String },            // Opcional

    blocos: {
        type: [BlocoConteudoSchema],
        required: true, // Uma seção deve ter pelo menos um bloco
        default: []
    },

    secoesAninhadas: [SecaoSchema] 
});

// Configurações do SecaoSchema
SecaoSchema.set('toObject', { virtuals: true });
SecaoSchema.set('toJSON', { virtuals: true });
SecaoSchema.set('_id', false); 

// --- 4. Schema Principal: Documentação ---
const DocumentacaoSchema = new mongoose.Schema({
    // Metadados
    tituloDocumento: { 
        type: String, 
        required: true, 
        default: "Documentação Técnica Padrão" 
    },
    identificador: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    ultimaAtualizacao: { 
        type: Date, 
        default: Date.now 
    },
    
    // Array de Seções Modulares
    secoes: [SecaoSchema]
}, { timestamps: true }); 

module.exports = mongoose.model('Documentacao', DocumentacaoSchema);