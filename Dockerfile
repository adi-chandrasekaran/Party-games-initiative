FROM node:22-bookworm-slim AS build

WORKDIR /app
RUN corepack enable
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile
RUN pnpm --dir apps/hub run build

FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV PLATFORM_SERVER_PORT=8080
ENV HOST=0.0.0.0
RUN corepack enable
COPY --from=build /app /app
EXPOSE 8080
CMD ["pnpm", "--dir", "apps/platform-server", "run", "start"]
