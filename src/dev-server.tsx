import appFetch from "./server";
import { serve } from "@hono/node-server";

console.log("Starting server");

let server = serve({ fetch: appFetch, port: 3001 });
console.log("Server listening on port 3001");

// @TODO: hot reloading doesn't work yet
// Restart the server when it changes.
if (module.hot) {
  module.hot.dispose(() => {
    server.close();
  });

  module.hot.accept();
}
