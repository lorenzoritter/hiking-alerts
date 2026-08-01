FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY worker/package.json worker/package.json
RUN npm ci --ignore-scripts

COPY . .

# Prisma Client generation needs a datasource URL, but this build-only value
# must not become a runtime environment variable in the image.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm run worker:build

CMD ["npm", "run", "worker:start"]
