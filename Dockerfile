# Usa uma imagem oficial do Node.js como base
FROM node:20-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos package.json e package-lock.json para instalar as dependências
# Usar estes dois comandos separadamente aproveita o cache do Docker
COPY package*.json ./
RUN npm install

# Copia o restante dos arquivos do projeto para o diretório de trabalho
# O .dockerignore deve excluir node_modules e outros arquivos desnecessários!
COPY . .

# Expõe a porta que a aplicação Express está configurada para rodar
# (A porta padrão é 1100, conforme seu app.js)
EXPOSE 1100

# Define a variável de ambiente para a porta
ENV PORT 1100

# Comando para iniciar a aplicação
CMD [ "node", "app.js" ]