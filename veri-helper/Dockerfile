FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends iverilog \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
COPY index.html styles.css app.js server.js ./

ENV NODE_ENV=production
ENV PORT=4173
EXPOSE 4173

CMD ["npm", "start"]
