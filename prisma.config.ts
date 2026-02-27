// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// 检测当前环境
const NODE_ENV = process.env.NODE_ENV || 'development';

// 根据环境选择数据库连接URL
const databaseUrl = NODE_ENV === 'production' ? env("PROD_DATABASE_URL") : env("DATABASE_URL");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: "prisma/migrations",
  },
});