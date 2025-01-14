import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { build } from "rolldown";

execSync("bun parcel build");

// After it's built - now we move files to the correct locations

if (existsSync(".vercel/output")) {
  execSync("rm -rf .vercel/output");
}

// make the necessary directories
execSync("mkdir -p .vercel/output/static");

writeFileSync(
  ".vercel/output/config.json",
  JSON.stringify({
    version: 3,
  }),
);

// move built files from dist to the static folder
execSync("cp -r dist/* .vercel/output/static/");

// make the necessary serverless directories
execSync("mkdir -p .vercel/output/functions/serverless.func");

let legacy = false;

// move all files from dist/ to the serverless.func directory
if (legacy) {
  execSync("cp -r dist/* .vercel/output/functions/serverless.func/");
} else {
  await build({
    input: "dist/server.js",
    platform: "node",

    output: {
      file: ".vercel/output/functions/serverless.func/server.js",
    },
  });
}

writeFileSync(
  ".vercel/output/functions/serverless.func/.vc-config.json",
  JSON.stringify({
    runtime: "nodejs22.x",
    handler: "server.js",
    maxDuration: 10,
    launcherType: "Nodejs",
    supportsResponseStreaming: true,
  }),
);

// get dependencies from package.json
// let packageJson = JSON.parse(readFileSync("package.json", "utf8"));

// write the dependencies to a nested package.json file
// writeFileSync(
//   ".vercel/output/functions/serverless.func/package.json",
//   JSON.stringify({
//     dependencies: {
//       // Hmmm - there has to be a better way for
//     },
//   }),
// );

// generate node_modules

// execSync("bun i", {
//   cwd: ".vercel/output/functions/serverless.func",
// });
