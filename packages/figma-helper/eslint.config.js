import baseConfig from "@screenwright/eslint-config";

export default [...baseConfig, { ignores: ["dist/**", "node_modules/**"] }];
