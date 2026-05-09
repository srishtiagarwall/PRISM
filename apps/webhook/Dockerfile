FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/webhook/ ./apps/webhook/
RUN npm install --workspaces
RUN npm run build -w @prism/webhook
CMD ["node", "apps/webhook/dist/main.js"]
