import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
execSync("bun parcel build");

// After it's built - now we move files to the correct locations

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

// move all files from dist/ to the serverless.func directory
execSync("cp -r dist/* .vercel/output/functions/serverless.func/");

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
let packageJson = JSON.parse(readFileSync("package.json", "utf8"));

// write the dependencies to a nested package.json file
writeFileSync(
  ".vercel/output/functions/serverless.func/package.json",
  JSON.stringify({
    dependencies: {
      ...packageJson.dependencies,
    },
  }),
);

// generate node_modules

execSync("bun i", {
  cwd: ".vercel/output/functions/serverless.func",
});
