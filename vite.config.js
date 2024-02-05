import { resolve } from "node:path";


export default {
  build: {
    // lib: {
    //   entry: resolve("./main.js"),
    //   formats:"esm",
    //   fileName: "main.js",
    // },
    rollupOptions: {
      input: resolve("./ttt.js"),
      output: {
        dir: "dist",
        format: "esm",
        entryFileNames: "ttt.js",
      },
    },
  },
};
