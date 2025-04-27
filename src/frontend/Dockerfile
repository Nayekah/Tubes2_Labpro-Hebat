FROM node:23-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=2211

RUN npm run build

EXPOSE 2211

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:2211/ || exit 1
  
CMD ["npm", "start"]