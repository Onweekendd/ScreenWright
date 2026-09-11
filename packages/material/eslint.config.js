import baseConfig from "@screenwright/eslint-config";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  ...baseConfig,
  {
    plugins: {
      "simple-import-sort": simpleImportSort
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [["^@?\\w"], ["^@/"], ["^\\."]]
        }
      ],
      "simple-import-sort/exports": "error"
    }
  },
  {
    ignores: ["dist/**", "node_modules/**", "**/*.d.ts"]
  }
];
