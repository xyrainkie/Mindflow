FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV PORT=3001
VOLUME ["/data"]
ENV DATABASE_URL="file:/data/dev.db"
EXPOSE 3001
CMD ["node", "dist/index.js"]
