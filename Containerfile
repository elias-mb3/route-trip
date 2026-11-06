# Ambiente de desenvolvimento do app Holambra (Node + todas as dependências npm)
FROM docker.io/library/node:22-alpine

WORKDIR /app

# Dependências primeiro, para aproveitar o cache de camadas
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5173 4173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
