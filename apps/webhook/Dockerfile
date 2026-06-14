FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/webhook/ ./apps/webhook/
RUN npm install --workspaces
RUN npm run build --workspaces --if-present
CMD ["node", "apps/webhook/dist/main.js"]
