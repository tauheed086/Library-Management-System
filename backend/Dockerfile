FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --include=dev

COPY . .

ENV DATABASE_URL="postgresql://user:password@localhost:5432/lms?schema=public"

RUN npx --no-install prisma generate

RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx --no-install prisma db push && npm start"]
