FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/webhook/ ./apps/webhook/
COPY apps/worker/ ./apps/worker/
RUN npm install --workspaces
RUN npm run build -w @prism/git-parser -w @prism/dep-mapper -w @prism/github-client -w @prism/agent
RUN npm run build -w @prism/worker
CMD ["node", "apps/worker/dist/main.js"]
