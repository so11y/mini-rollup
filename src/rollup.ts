import { writeFile } from "fs/promises";
import { Bundle, BundleConfig } from "./bundle";
const rollup = (options: BundleConfig) => {
  const bundle = new Bundle({
    entry: options.entry,
  });

  return bundle.build().then(() => {
    return {
      write: (dest: string) => {
        let { code } = bundle.generate();
        writeFile(dest, code);
      },
    };
  });
};

rollup({
  entry: "./test.js",
}).then((v) => {
  v.write("./test-build.js");
});

