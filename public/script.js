// VARIÁVEIS GLOBAIS
const API_BASE_URL = '/api/docs'; 
let currentDocIdentifier = null; // O identificador do documento sendo editado (Ex: RACK001)

// ==========================================================
// 1. FUNÇÕES DE INICIALIZAÇÃO
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    fetchDocuments();
    
    // Adiciona funcionalidade de arrastar e soltar (SortableJS) às seções do formulário
    // (Mantido, mas lembre-se que o código atual só lida com o 1º nível)
    const sectionsContainer = document.getElementById('sections-container');
    if (sectionsContainer) {
        new Sortable(sectionsContainer, {
            handle: '.drag-handle', 
            animation: 150
        });
    }

    // Adiciona o evento de clique na aba de visualização
    document.getElementById('visualizar-tab').addEventListener('click', () => {
        // Se a guia de visualização for clicada, renderize o documento que está ativo na tabela.
        // Se nenhum estiver ativo, ele exibirá a mensagem padrão.
        const activeIdentifier = localStorage.getItem('activeDocIdentifier');
        if (activeIdentifier) {
             fetchDocumentForRender(activeIdentifier);
        }
    });
});

// ==========================================================
// 2. COMUNICAÇÃO COM API (CRUD)
// ==========================================================

// A. LER: Busca todos os documentos e preenche a tabela
async function fetchDocuments() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error('Falha na resposta da API.');
        
        const data = await response.json();
        
        if (data.sucesso && data.dados && data.dados.length > 0) {
            renderDocumentList(data.dados);
        } else {
            document.getElementById('docs-table-body').innerHTML = '<tr><td colspan="4">Nenhuma documentação encontrada.</td></tr>';
        }

    } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        showAlert('Erro ao carregar a lista de documentos. Verifique a conexão com o servidor Express.', 'danger');
    }
}

// B. LER UM: Busca um documento específico para EDIÇÃO
async function fetchDocumentForEdit(identifier) {
    try {
        // NOTA: Para edição por identificador, sua API precisa de uma rota GET que use o IDENTIFICADOR.
        // Se sua API usa o _id, esta URL pode falhar. Assumindo que a API aceita o identificador:
        const response = await fetch(`${API_BASE_URL}/id/${identifier}`); // Assumindo uma rota GET /api/docs/id/:identificador
        const data = await response.json();
        
        if (data.sucesso) {
            currentDocIdentifier = identifier;
            fillEditForm(data.dados);
            showEditForm(identifier);
        } else {
            showAlert(data.mensagem || 'Documento não encontrado.', 'danger');
        }

    } catch (error) {
        console.error('Erro ao buscar documento para edição:', error);
        showAlert('Erro ao buscar documento para edição. Certifique-se de que a rota GET /api/docs/id/:identificador existe.', 'danger');
    }
}

// B-EXTRA. LER UM: Busca documento para RENDERIZAÇÃO
async function fetchDocumentForRender(identifier) {
    localStorage.setItem('activeDocIdentifier', identifier); // Salva o doc ativo
    const renderContainer = document.getElementById('doc-content');
    renderContainer.innerHTML = `<p class="text-center text-info">Carregando ${identifier}...</p>`;

    try {
        // NOTA: Para buscar um documento inteiro (com todas as seções e subseções) para renderização
        const response = await fetch(`${API_BASE_URL}/id/${identifier}`); 
        const data = await response.json();
        
        if (data.sucesso) {
            renderFullDocument(data.dados);
            
            // Ativa a aba de Visualização
            const visualizeTab = new bootstrap.Tab(document.getElementById('visualizar-tab'));
            visualizeTab.show();

        } else {
            renderContainer.innerHTML = `<p class="alert alert-danger">Falha ao carregar documento: ${data.mensagem || 'Erro desconhecido.'}</p>`;
        }

    } catch (error) {
        console.error('Erro ao buscar documento para visualização:', error);
        renderContainer.innerHTML = `<p class="alert alert-danger">Erro de conexão ao renderizar documento.</p>`;
    }
}

// C. SALVAR/CRIAR
async function saveDocument() {
    const identifier = document.getElementById('identificador').value.trim();
    const isNew = currentDocIdentifier === 'new';
    
    const method = isNew ? 'POST' : 'PUT';
    // Assumindo que PUT usa o identificador na URL: /api/docs/:identificador
    const url = isNew ? API_BASE_URL : `${API_BASE_URL}/${identifier}`;

    // 1. Coleta os dados do formulário e as seções
    try {
        const docData = {
            tituloDocumento: document.getElementById('tituloDocumento').value,
            identificador: identifier,
            // AQUI O PROBLEMA DO CÓDIGO ANTERIOR: O collectSectionsData() NÃO TRAZ SEÇÕES ANINHADAS.
            // Para manter a complexidade do CRUD baixa, assumimos que ele só edita o primeiro nível
            secoes: collectSectionsData() 
        };
        
        if (!docData.tituloDocumento || !docData.identificador) {
            showAlert("Título e Identificador são obrigatórios.", 'warning');
            return;
        }

        // 2. Envia para a API
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(docData)
        });

        const data = await response.json();

        if (data.sucesso) {
            showAlert(`Documentação ${isNew ? 'criada' : 'atualizada'} com sucesso!`, 'success');
            cancelEdit(); 
            fetchDocuments(); 
        } else {
            showAlert(`Falha ao salvar: ${data.mensagem || 'Erro desconhecido.'}`, 'danger');
        }

    } catch (error) {
        console.error('Erro ao salvar documento:', error);
        showAlert('Erro de conexão ao tentar salvar o documento.', 'danger');
    }
}

// D. DELETAR
async function deleteDocument() {
    if (!currentDocIdentifier || currentDocIdentifier === 'new') return;
    
    if (!confirm(`Tem certeza que deseja DELETAR o documento ${currentDocIdentifier}? Esta ação é irreversível.`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${currentDocIdentifier}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.sucesso) {
            showAlert(`Documentação ${currentDocIdentifier} deletada com sucesso.`, 'success');
            cancelEdit();
            fetchDocuments();
            // Limpa a visualização e o documento ativo
            document.getElementById('doc-content').innerHTML = '<p class="text-center text-muted">Documento deletado.</p>';
            localStorage.removeItem('activeDocIdentifier');
        } else {
            showAlert(`Falha ao deletar: ${data.mensagem || 'Erro desconhecido.'}`, 'danger');
        }

    } catch (error) {
        console.error('Erro ao deletar documento:', error);
        showAlert('Erro de conexão ao tentar deletar o documento.', 'danger');
    }
}

// ==========================================================
// 3. FUNÇÕES DE RENDERIZAÇÃO E INTERFACE (CRUD)
// ==========================================================

// A. Renderiza a tabela principal
function renderDocumentList(docs) {
    const tbody = document.getElementById('docs-table-body');
    tbody.innerHTML = '';

    docs.forEach(doc => {
        const row = tbody.insertRow();
        const lastUpdated = new Date(doc.ultimaAtualizacao).toLocaleString('pt-BR');

        row.insertCell(0).textContent = doc.identificador;
        row.insertCell(1).textContent = doc.tituloDocumento;
        row.insertCell(2).textContent = lastUpdated;
        
        const actionsCell = row.insertCell(3);
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-sm btn-info text-white me-2';
        viewBtn.textContent = 'Visualizar';
        // Usa a nova função para carregar e mudar para a aba de visualização
        viewBtn.onclick = () => fetchDocumentForRender(doc.identificador); 

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-warning';
        editBtn.textContent = 'Editar';
        editBtn.onclick = () => fetchDocumentForEdit(doc.identificador);

        actionsCell.appendChild(viewBtn);
        actionsCell.appendChild(editBtn);
    });
}

// C. Preenche o formulário para edição
function fillEditForm(doc) {
    document.getElementById('tituloDocumento').value = doc.tituloDocumento;
    document.getElementById('identificador').value = doc.identificador;
    
    // O formulário de seções modularizado só pode lidar com o primeiro nível de seções
    renderSectionsForm(doc.secoes || []);
}

// D. Renderiza o Formularia Modular de Seções (Apenas Nível 1)
function renderSectionsForm(secoes) {
    const container = document.getElementById('sections-container');
    container.innerHTML = ''; 
    
    secoes.forEach((s, index) => {
        // Cria e anexa a estrutura HTML da seção
        const sectionDiv = createSectionDiv(s, index);
        container.appendChild(sectionDiv);
    });
    
    // Adiciona o botão de adicionar nova seção
    container.insertAdjacentHTML('beforeend', '<button type="button" class="btn btn-outline-primary mt-3" onclick="addEmptySection()">+ Adicionar Nova Seção</button>');
}

// E. Cria a estrutura HTML de uma única seção para o formulário
function createSectionDiv(s, index) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section-item border p-3 mb-3 bg-white shadow-sm';
    sectionDiv.setAttribute('data-index', index);
    
    // Adiciona um campo TEXTAREA para o JSON de Subseções.
    // Isso é feito para que as subseções não se percam, mas elas se tornam JSON manual.
    const subsecoesJSON = JSON.stringify(s.secoesAninhadas || [], null, 2);

    // O restante do seu HTML modularizado (mantido, com adição do campo de texto bruto)
    sectionDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0 text-primary">Seção #${index + 1} - ${s.tituloSecao}</h5>
            <div>
                <span class="drag-handle me-3 text-muted" title="Arrastar">☰</span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeSection(this)">Remover</button>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Título Principal</label>
                <input type="text" class="form-control section-title" value="${s.tituloSecao}" required>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Subtítulo</label>
                <input type="text" class="form-control section-subtitle" value="${s.subtituloSecao || ''}">
            </div>
            <div class="col-12 mb-3">
                <label class="form-label">Tipo de Conteúdo</label>
                <select class="form-select section-type" onchange="toggleContentFields(this)">
                    <option value="infoGeral" ${s.tipoConteudo === 'infoGeral' ? 'selected' : ''}>Informação Geral (Lista de Pares)</option>
                    <option value="credenciais" ${s.tipoConteudo === 'credenciais' ? 'selected' : ''}>Credenciais (Caixa de Destaque)</option>
                    <option value="imagem" ${s.tipoConteudo === 'imagem' ? 'selected' : ''}>Imagem (URL)</option>
                    <option value="mapaRede" ${s.tipoConteudo === 'mapaRede' ? 'selected' : ''}>Mapa de Rede/Texto Formatado</option>
                    <option value="blocoCodigo" ${s.tipoConteudo === 'blocoCodigo' ? 'selected' : ''}>Bloco de Código/Texto Bruto</option>
                </select>
            </div>
        </div>
        
        <div class="section-content-fields mt-2 p-3 border rounded">
            ${generateContentFields(s)}
        </div>
        
        <h6 class="mt-4">Subseções Aninhadas (JSON)</h6>
        <textarea class="form-control section-nested-json" rows="5" placeholder="Cole aqui o JSON array para as subseções aninhadas.">${subsecoesJSON}</textarea>
        <div class="form-text text-danger">⚠️ Edição complexa! O JSON de subseções aninhadas deve ser mantido manualmente.</div>
        
        <hr class="mt-4" />
    `;
    return sectionDiv;
}

// F. Função auxiliar para gerar campos de conteúdo específicos
function generateContentFields(section) {
    let html = '';
    const tipo = section.tipoConteudo;
    const conteudo = section.conteudo || {};

    if (tipo === 'imagem') {
        html = `
            <label class="form-label">URL da Imagem</label>
            <input type="url" class="form-control content-url-image" value="${conteudo.urlImagem || ''}" placeholder="Ex: https://img.exemplo.com/diagrama.png">
            <label class="form-label mt-2">Texto Alternativo (Alt)</label>
            <input type="text" class="form-control content-alt-image" value="${conteudo.altImagem || ''}">
            <label class="form-label mt-2">Texto Bruto Adicional</label>
            <textarea class="form-control content-raw-text" rows="3">${conteudo.textoBruto || ''}</textarea>
        `;
    } else if (tipo === 'mapaRede' || tipo === 'blocoCodigo' || tipo === 'credenciais') {
        // CREDENCIAIS, MAPA e BLOCO DE CÓDIGO são todos baseados em texto bruto
        html = `
            <label class="form-label">${tipo === 'credenciais' ? 'Credenciais (Texto Bruto/Formatado)' : 'Texto Bruto/Código (Mantém quebras de linha e espaços)'}</label>
            <textarea class="form-control content-raw-text" rows="5">${conteudo.textoBruto || ''}</textarea>
            ${tipo === 'credenciais' ? '<div class="form-text text-info">Use quebras de linha para formatar.</div>' : ''}
        `;
        // Credenciais não têm lista de detalhes, apenas textoBruto
    } else if (tipo === 'infoGeral') {
         // INFO GERAL pode ter texto bruto E lista de detalhes
        html = `
            <label class="form-label">Texto Bruto/Descrição</label>
            <textarea class="form-control content-raw-text" rows="3">${conteudo.textoBruto || ''}</textarea>

            <h6 class="mt-3">Pares Rótulo: Valor (Detalhamento)</h6>
            <div class="content-details-container">`;
        
        // Garante que pelo menos um campo vazio seja exibido para novos detalhes
        const detalhes = (conteudo.detalhes && conteudo.detalhes.length > 0) ? conteudo.detalhes : [{ rotulo: '', valor: '' }];

        detalhes.forEach(detail => {
            html += generateDetailRow(detail.rotulo, detail.valor);
        });
        
        html += `</div><button type="button" class="btn btn-sm btn-secondary mt-2" onclick="addDetailRow(this)">+ Adicionar Detalhe</button>`;
    }
    return html;
}

// G. Adiciona um novo par Rótulo/Valor e H. Adicionar seção vazia (Mantidos)
function addDetailRow(buttonElement) {
    const container = buttonElement.previousElementSibling;
    container.insertAdjacentHTML('beforeend', generateDetailRow('', ''));
}

function generateDetailRow(rotulo, valor) {
    return `
        <div class="row mb-2 detail-row">
            <div class="col-5">
                <input type="text" class="form-control detail-label" value="${rotulo}" placeholder="Rótulo (Ex: IP Principal)">
            </div>
            <div class="col-6">
                <input type="text" class="form-control detail-value" value="${valor}" placeholder="Valor (Ex: 192.168.10.201)">
            </div>
            <div class="col-1 p-0">
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.detail-row').remove()">x</button>
            </div>
        </div>
    `;
}

function addEmptySection() {
    const newSectionData = {
        tituloSecao: 'Nova Seção (Clique para Editar)',
        subtituloSecao: '',
        tipoConteudo: 'infoGeral',
        conteudo: { textoBruto: '', detalhes: [{ rotulo: '', valor: '' }] }
    };
    
    // Coleta os dados atuais, adiciona o novo e redesenha o formulário inteiro.
    renderSectionsForm([...collectSectionsData(), newSectionData]); 
}

// I. Alternar campos de conteúdo quando o tipo muda (Ajustado)
function toggleContentFields(selectElement) {
    const sectionItem = selectElement.closest('.section-item');
    const contentContainer = sectionItem.querySelector('.section-content-fields');
    const newType = selectElement.value;
    
    // Cria uma seção de manequim (dummy) com o novo tipo para gerar o HTML de edição correto
    const dummySection = { tipoConteudo: newType, conteudo: {} };
    contentContainer.innerHTML = generateContentFields(dummySection);
}

// J. Remove uma seção do formulário (Ajustado)
function removeSection(buttonElement) {
    if (confirm("Deseja realmente remover esta seção?")) {
        // Coleta os dados, remove o item e redesenha para atualizar os índices visuais
        const sectionsData = collectSectionsData();
        const indexToRemove = Array.from(buttonElement.closest('#sections-container').children).indexOf(buttonElement.closest('.section-item'));
        sectionsData.splice(indexToRemove, 1);
        renderSectionsForm(sectionsData);
    }
}


// K. Coleta os dados de TODAS as seções do formulário para salvar no DB (AJUSTADO PARA INCLUIR TEXTO BRUTO E JSON ANINHADO)
function collectSectionsData() {
    const sections = [];
    document.querySelectorAll('#sections-container > .section-item').forEach(sectionDiv => {
        const tituloSecao = sectionDiv.querySelector('.section-title').value;
        const subtituloSecao = sectionDiv.querySelector('.section-subtitle').value;
        const tipoConteudo = sectionDiv.querySelector('.section-type').value;
        const nestedJsonText = sectionDiv.querySelector('.section-nested-json').value;

        if (!tituloSecao.trim()) return; 

        const sectionData = {
            tituloSecao,
            subtituloSecao: subtituloSecao || undefined,
            tipoConteudo,
            conteudo: {}
        };

        const content = sectionData.conteudo;
        
        // Coleta o conteúdo baseado no tipo
        if (tipoConteudo === 'imagem') {
            content.urlImagem = sectionDiv.querySelector('.content-url-image').value || undefined;
            content.altImagem = sectionDiv.querySelector('.content-alt-image').value || undefined;
            content.textoBruto = sectionDiv.querySelector('.content-raw-text').value || undefined;
        } else if (tipoConteudo === 'mapaRede' || tipoConteudo === 'blocoCodigo' || tipoConteudo === 'credenciais' || tipoConteudo === 'infoGeral') {
            content.textoBruto = sectionDiv.querySelector('.content-raw-text').value || undefined;
        }
        
        // Coleta os detalhes (apenas para infoGeral)
        if (tipoConteudo === 'infoGeral') {
             content.detalhes = [];
             sectionDiv.querySelectorAll('.detail-row').forEach(row => {
                const rotulo = row.querySelector('.detail-label').value;
                const valor = row.querySelector('.detail-value').value;
                if (rotulo && valor) { 
                    content.detalhes.push({ rotulo, valor });
                }
            });
             if (content.detalhes.length === 0) content.detalhes = undefined;
        }

        // Tenta processar o JSON aninhado
        if (nestedJsonText.trim()) {
            try {
                const nestedSections = JSON.parse(nestedJsonText);
                if (Array.isArray(nestedSections) && nestedSections.length > 0) {
                     sectionData.secoesAninhadas = nestedSections;
                }
            } catch (e) {
                showAlert(`Erro de JSON na seção "${tituloSecao}". O conteúdo aninhado será ignorado.`, 'danger');
                console.error("Erro de JSON em subseções:", e);
            }
        }
        
        sections.push(sectionData);
    });
    return sections;
}


// L. Exibir/Ocultar Formulário (Mantido)
function showEditForm(identifier) {
    const formContainer = document.getElementById('document-form-container');
    const deleteBtn = formContainer.querySelector('#delete-btn');
    const identifierInput = document.getElementById('identificador');
    const formActionLabel = document.getElementById('form-action-label');

    formContainer.style.display = 'block';
    document.getElementById('document-list').style.display = 'none';

    if (identifier === 'new') {
        currentDocIdentifier = 'new';
        formActionLabel.textContent = 'Criar';
        document.getElementById('form-identifier-display').textContent = 'NOVO DOCUMENTO';
        document.getElementById('doc-form').reset();
        deleteBtn.style.display = 'none';
        identifierInput.disabled = false;
        renderSectionsForm([]); 
    } else {
        currentDocIdentifier = identifier;
        formActionLabel.textContent = 'Editar';
        document.getElementById('form-identifier-display').textContent = identifier;
        deleteBtn.style.display = 'inline-block';
        identifierInput.disabled = true; 
    }
}

// M. Cancelar Edição (Mantido)
function cancelEdit() {
    document.getElementById('document-form-container').style.display = 'none';
    document.getElementById('document-list').style.display = 'block';
    document.getElementById('identificador').disabled = false; 
    currentDocIdentifier = null;
    document.getElementById('doc-form').reset();
    fetchDocuments(); 
    localStorage.removeItem('activeDocIdentifier');
}

// N. Exibir Mensagens de Alerta
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-messages');
    alertContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}


// ==========================================================
// 4. FUNÇÕES DE RENDERIZAÇÃO COMPLEXA (VISUALIZAÇÃO)
// ==========================================================

// Função Principal de Renderização para a aba "Visualizar"
function renderFullDocument(doc) {
    const docContent = document.getElementById('doc-content');
    docContent.innerHTML = ''; // Limpa o conteúdo

    let mainHtml = `<h1>${doc.tituloDocumento}</h1>`;
    mainHtml += `<p class="lead text-muted">Identificador: ${doc.identificador}</p>`;
    mainHtml += '<hr>';
    
    // Inicia a renderização recursiva
    if (doc.secoes && doc.secoes.length > 0) {
        mainHtml += renderSecoes(doc.secoes, 1);
    } else {
        mainHtml += '<p class="text-center text-muted">O documento não possui seções.</p>';
    }
    
    const ultimaAtualizacao = doc.ultimaAtualizacao ? new Date(doc.ultimaAtualizacao).toLocaleString('pt-BR') : 'N/A';
    mainHtml += `<p class="update-info text-end mt-5">Última Atualização: ${ultimaAtualizacao}</p>`;

    docContent.innerHTML = mainHtml;
}

/**
 * Renderiza o conteúdo de uma seção com base no seu tipo.
 */
function renderConteudo(tipo, conteudo) {
    let contentHtml = '';

    if (!conteudo || Object.keys(conteudo).length === 0) {
        return '';
    }
    
    // Adiciona texto bruto se existir (usado por infoGeral, imagem e como descrição)
    if (conteudo.textoBruto && tipo !== 'credenciais' && tipo !== 'mapaRede' && tipo !== 'blocoCodigo') {
         contentHtml += `<p>${conteudo.textoBruto.replace(/\n/g, '<br>')}</p>`;
    }


    switch(tipo) {
        case 'credenciais':
            if (conteudo.textoBruto) {
                // Credenciais são apenas texto bruto formatado em bloco
                contentHtml += `
                    <div class="alert alert-warning credenciais-box">
                        <strong>Credenciais:</strong>
                        <pre>${conteudo.textoBruto}</pre>
                    </div>`;
            }
            break;
            
        case 'mapaRede':
        case 'blocoCodigo':
            // Bloco de texto ou código (preserva espaços)
            if (conteudo.textoBruto) {
                contentHtml += `
                    <div class="code-block">
                        <pre>${conteudo.textoBruto}</pre>
                    </div>`;
            }
            break;

        case 'imagem':
            if (conteudo.urlImagem) {
                contentHtml += `
                    <div class="text-center my-4">
                        <img src="${conteudo.urlImagem}" alt="${conteudo.altImagem || 'Imagem da documentação'}" class="img-fluid" style="max-height: 400px; border: 1px solid #ccc;">
                        <p class="text-muted mt-2">${conteudo.altImagem || 'Imagem'}</p>
                    </div>
                `;
            }
            break;

        case 'infoGeral':
            // Renderiza lista de detalhes
            if (conteudo.detalhes && conteudo.detalhes.length > 0) {
                contentHtml += '<ul class="list-unstyled">';
                conteudo.detalhes.forEach(detalhe => {
                    contentHtml += `<li><strong>${detalhe.rotulo}:</strong> ${detalhe.valor}</li>`;
                });
                contentHtml += '</ul>';
            }
            break;

        default:
            contentHtml += `<p class="text-danger">Tipo de conteúdo <strong>${tipo}</strong> sem renderização definida.</p>`;
    }

    return contentHtml;
}

/**
 * Renderiza recursivamente todas as seções e subseções (A CHAVE DO PROBLEMA ORIGINAL).
 * @param {Array} secoes - Array de objetos de seção.
 * @param {number} nivel - Nível de aninhamento (1 para H2, 2 para H3, etc.)
 * @returns {string} HTML renderizado.
 */
function renderSecoes(secoes, nivel = 1) {
    let html = '';
    
    // Tag de cabeçalho: H2 para nível 1, H3 para nível 2, etc.
    const tag = `h${Math.min(nivel + 1, 6)}`; 
    
    secoes.forEach(secao => {
        // 1. Título e Subtítulo
        const tituloCompleto = secao.subtituloSecao 
            ? `${secao.tituloSecao} <small class="text-muted">(${secao.subtituloSecao})</small>`
            : secao.tituloSecao;
            
        html += `<${tag} class="mt-4 mb-3 text-break">${tituloCompleto}</${tag}>`;
        html += '<hr class="mb-3">';

        // 2. Conteúdo da Seção
        if (secao.conteudo) {
            html += renderConteudo(secao.tipoConteudo, secao.conteudo);
        }

        // 3. SEÇÕES ANINHADAS (RECUSÃO)
        if (secao.secoesAninhadas && secao.secoesAninhadas.length > 0) {
            // Chama a si mesma, aumentando o nível do cabeçalho
            html += renderSecoes(secao.secoesAninhadas, nivel + 1); 
        }
    });
    return html;
}