import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getGenerators, loadSchemaContext } = require("@prisma/internals");

const schemaContext = await loadSchemaContext({
  schemaPathFromArg: "prisma/schema.prisma",
  ignoreEnvVarErrors: true,
});

const generators = await getGenerators({
  schemaContext,
  registry: {
    "prisma-client-js": {
      type: "rpc",
      generatorPath: require.resolve("@prisma/client/generator-build/index.js"),
      isNode: true,
    },
  },
  // engineType="client" uses the packaged WASM query compiler and does not
  // require Prisma's downloadable Rust query engine.
  skipDownload: true,
  noEngine: false,
});

try {
  for (const generator of generators) await generator.generate();
} finally {
  for (const generator of generators) generator.stop();
}

console.log("Generated Prisma Client without downloadable binary engines.");
