import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import pkg from "./package.json";

export default [
  // browser-friendly UMD build
  {
    input: "src/fieldv8n.js",
    output: {
      name: "fieldv8n",
      file: pkg.browser,
      format: "umd"
    },
    plugins: [
      resolve(), // so Rollup can find imports
      commonjs(), // so Rollup can convert imports to an ES module
      babel({
        exclude: ["node_modules/**"]
      })
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  {
    input: "src/fieldv8n.js",
    external: ["core-js/stable", "regenerator-runtime/runtime"],
    output: [
      { file: pkg.main, format: "cjs" },
      { file: pkg.module, format: "es" }
    ],
    plugins: [
      babel({
        exclude: ["node_modules/**"]
      })
    ]
  }
];
