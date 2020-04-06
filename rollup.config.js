import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/fieldv8n.ts",
  output: {
    dir: "dist",
    format: "cjs",
  },
  plugins: [typescript()],
};
