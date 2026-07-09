# ---------- 1-bosqich: dependencies ----------
  FROM node:20-alpine AS deps
  WORKDIR /app
  # Avval faqat package fayllarni ko'chiramiz -> bu qatlam keshlanadi:
  # kod o'zgarsa ham, deps o'zgarmasa npm ci qayta ishlamaydi = tez build
  COPY package*.json ./
  RUN npm ci --omit=dev
  
  # ---------- 2-bosqich: runtime (yakuniy image) ----------
  FROM node:20-alpine
  ENV NODE_ENV=production
  WORKDIR /app
  
  # npm runtime'da ishlatilmaydi — olib tashlaymiz:
  # kichikroq image + kichikroq hujum yuzasi (Trivy topgan CVE ham shu bilan ketadi)
  RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
  
  # 1-bosqichdan faqat tayyor node_modules ni olamiz
  COPY --chown=node:node --from=deps /app/node_modules ./node_modules
  # Keyin kodni ko'chiramiz
  COPY --chown=node:node . .
  
  # Xavfsizlik: root emas! node image'ida tayyor 'node' user bor
  USER node
  
  EXPOSE 3000
  
  # Container o'z-o'zini tekshiradi: /health javob bermasa "unhealthy" bo'ladi
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1
  
  CMD ["node", "src/index.js"]