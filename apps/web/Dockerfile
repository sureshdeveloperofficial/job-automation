FROM node:20-alpine AS base
RUN npm install -g pnpm@10.28.2 turbo

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN pnpm install --frozen-lockfile
RUN pnpm -F web run build

EXPOSE 1962

ENV PORT=1962
ENV NEXT_PUBLIC_API_URL=http://localhost:1961/api/v1

CMD ["pnpm", "-F", "web", "run", "start"]
