// Prisma v7 no longer loads .env files automatically, so we load them
// explicitly here. See prisma/README or the project README for local setup.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
