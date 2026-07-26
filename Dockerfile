# ==========================
# Stage 1 : Build React/Vite
# ==========================
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Activer pnpm
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

# Copier uniquement les fichiers de dépendances
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Build production
RUN pnpm build


# ==========================
# Stage 2 : Serveur Nginx
# ==========================
FROM nginx:alpine

# Configuration Nginx personnalisée
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copier le build React
COPY --from=builder /app/dist /usr/share/nginx/html

# Port HTTP
EXPOSE 80

# Démarrage Nginx
CMD ["nginx", "-g", "daemon off;"]