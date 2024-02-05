import typeScriptPlugin from "rollup-plugin-typescript2";
import path from "path";

const defineBuild = (options) => {
  return {
    input: options.input,
    plugins: [
      // typeScriptPlugin({
      //   check: false,
      //   tsconfig: path.resolve(__dirname, "./tsconfig.json"),
      //   tsconfigOverride: {
      //     sourcemap: true,
      //   },
      // }),
    ],
    watch: {
      include: "src/**",
      exclude: "node_modules/**",
    },

    output: [
      {
        dir: "dist",
        entryFileNames: "[name].js",
        // assetFileNames: "assets/[name]-[hash].[ext]",
        // chunkFileNames: "assets/[name]-[hash].js",
        // dir: "dist",
        // entryFileNames: "main.js",
        // exports: "auto",
        // format: "esm",
        // generatedCode: "es2015",
        // inlineDynamicImports: false,
        // name: undefined,
        // sourcemap: false,
      },
    ],
  };
};

export default {
  input: "./ttt.js",
  output: {
    dir: "dist",
    fileName: "xx.js",
  },
  plugins: [
    {
      buildStart() {
        this.emitFile({
          type: "prebuilt-chunk",
          fileName: `xx3.js`,
          code: "export default 111",
        });
      },
      renderChunk(code, chunk, options, meta) {
        console.log(code, chunk, options, meta, "---");
      },
      generateBundle(_, bundle) {
        console.log(bundle);
      },
    },
  ],
};
// defineBuild({
//   input: "./ttt.js",
//   file: "./dist/ttt.js",
//   format: "esm",
// }),
// defineBuild({
//   input: "./index.js",
//   file: "index.js",
// }),
// defineBuild({
//   input: "./test.js",
//   file: "./ttt/index.js",
//   format: "esm",
// }),
