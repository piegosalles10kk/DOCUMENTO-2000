const mongoose = require('mongoose');

// --- 1. Sub-Schema: Detalhes de Conteúdo (DetalheSchema) ---
// Usado para pares Rótulo:Valor dentro de um bloco.
const DetalheSchema = new mongoose.Schema({
    rotulo: { type: String, required: true },
    valor: { type: String, required: true },
}, { _id: false });

// --- NOVO SUB-SCHEMA: BlocoConteudoSchema ---
// Este schema define um único componente de conteúdo que pode ser adicionado
// várias vezes dentro de uma Seção.
const BlocoConteudoSchema = new mongoose.Schema({
    
    // =======================================================
    // NOVOS CAMPOS PARA O SUBTÍTULO/DESCRIÇÃO DO CONTEÚDO
    // =======================================================
    tituloBloco: { type: String },    // Título opcional para o bloco (ex: "Configuração SSH")
    descricaoBloco: { type: String }, // Descrição opcional (ex: "Use este código para...")
    // =======================================================

    // Tipo de Conteúdo (Instrui como o Front-end deve renderizar/editar)
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
    // Propriedades Básicas (Metadados da Seção)
    tituloSecao: { type: String, required: true }, // OBRIGATÓRIO
    subtituloSecao: { type: String },            // Opcional

    // NOVO ARRAY DE BLOCOS: Permite múltiplos tipos de conteúdo!
    blocos: {
        type: [BlocoConteudoSchema],
        required: true, // Uma seção deve ter pelo menos um bloco
        default: []
    },

    // CAMPO RECURSIVO: Opcional
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