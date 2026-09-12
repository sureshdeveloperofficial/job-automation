FROM node:20-alpine AS base
RUN npm install -g pnpm@10.28.2 turbo

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN pnpm install --frozen-lockfile
RUN pnpm -F api run prisma:generate
RUN pnpm -F api run build

EXPOSE 1961

ENV PORT=1961
ENV API_PORT=1961
ENV API_HOST=0.0.0.0

CMD ["pnpm", "-F", "api", "run", "start:prod"]
