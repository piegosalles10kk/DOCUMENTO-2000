const mongoose = require('mongoose');

// --- 1. Sub-Schema: Detalhes de Conteúdo (para listas, credenciais, etc.) ---
// Estes campos SÃO obrigatórios, mas só se o array 'detalhes' for fornecido.
const DetalheSchema = new mongoose.Schema({
    rotulo: { type: String, required: true }, // Ex: "Endereço IP"
    valor: { type: String, required: true },  // Ex: "192.168.10.1"
});

// Definindo o SecaoSchema para permitir recursão
// Usar uma referência direta permite que o schema seja definido abaixo
const SecaoSchema = new mongoose.Schema();

// --- 2. Sub-Schema: Seção Modular (RECURSIVA) ---
SecaoSchema.add({
    // Propriedades Básicas
    tituloSecao: { type: String, required: true }, // OBRIGATÓRIO: Ex: "Firewall pfSense"
    subtituloSecao: { type: String },            // Opcional

    // Tipo de Conteúdo (Instrui como o Front-end deve renderizar/editar)
    tipoConteudo: {
        type: String,
        enum: ['infoGeral', 'credenciais', 'listaDetalhada', 'blocoCodigo', 'imagem', 'mapaRede'],
        required: true // OBRIGATÓRIO
    },

    // Objeto de Conteúdo Variável (Não é requerido, mas se fornecido, seus campos são validados)
    conteudo: {
        // Usado para 'credenciais' e 'infoGeral'. É um array opcional.
        detalhes: {
            type: [DetalheSchema],
            // AQUI ESTÁ A CHAVE: Se 'detalhes' for fornecido, deve ser um array. 
            // Se não for fornecido, não será validado, resolvendo o problema.
            required: false 
        }, 
        
        // Usado para 'listaDetalhada' e 'blocoCodigo'. É um campo opcional.
        textoBruto: { type: String },
        
        // Usado para 'imagem'
        urlImagem: { type: String },
        altImagem: { type: String }
    },

    // CAMPO RECURSIVO: Opcional
    secoesAninhadas: [SecaoSchema] 
});

// Configurações e opções do SecaoSchema (importante para subdocumentos)
SecaoSchema.set('toObject', { virtuals: true });
SecaoSchema.set('toJSON', { virtuals: true });
SecaoSchema.set('_id', false); // Para evitar IDs automáticos em subdocumentos, se preferir

// --- 3. Schema Principal: Documentação ---
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
    }, // OBRIGATÓRIO: Ex: "RACK001"
    
    ultimaAtualizacao: { 
        type: Date, 
        default: Date.now 
    },
    
    // Array de Seções Modulares (O Mongoose fará a validação em cascata)
    secoes: [SecaoSchema]
}, { timestamps: true }); // Adiciona createdAt e updatedAt

module.exports = mongoose.model('Documentacao', DocumentacaoSchema);