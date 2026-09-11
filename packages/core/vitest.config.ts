import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // core 无 DOM 依赖，node 环境即可，亦可证明其框架无关
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
