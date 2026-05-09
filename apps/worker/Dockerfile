FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/
RUN npm install --workspaces
RUN npm run build -w @prism/worker
CMD ["node", "apps/worker/dist/main.js"]
