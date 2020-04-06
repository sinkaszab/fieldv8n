import sucrase from "@rollup/plugin-sucrase";
import resolve from "@rollup/plugin-node-resolve";
import pkg from "./package.json";

export default {
  input: "src/fieldv8n.ts",
  output: [
    { file: pkg.main, format: "cjs", exports: "named" },
    { file: pkg.module, format: "es" },
    {
      name: "fieldv8n",
      file: pkg.browser,
      format: "umd",
      exports: "named",
    },
  ],
  plugins: [
    resolve({
      extensions: [".js", ".ts"],
    }),
    sucrase({
      exclude: ["node_modules/**"],
      transforms: ["typescript"],
    }),
  ],
};
