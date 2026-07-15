FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build  # <--- C'est ici que 'tsc' est lancé et crée le dossier 'dist'

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production # <--- On installe uniquement les dépendances de prod

COPY --from=builder /app/dist ./dist 

EXPOSE 8000
CMD ["node", "dist/server.js"] # <--- Le serveur pur et performant