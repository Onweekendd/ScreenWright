import type { PrismaConfig } from "prisma";
import { env } from "prisma/config";

import "dotenv/config";

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: env("PRISMA_DATABASE_URL")
  }
} satisfies PrismaConfig;
