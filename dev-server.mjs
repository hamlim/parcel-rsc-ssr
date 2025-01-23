import { serve } from "@hono/node-server";
import appFetch from "./dist/server.js";

console.log("Starting server");

console.log(appFetch);

let server = serve({ fetch: appFetch, port: 3001 });
console.log("Server listening on port 3001");

// @TODO: hot reloading doesn't work yet
// Restart the server when it changes.
// if (module.hot) {
//   module.hot.dispose(() => {
//     server.close();
//   });

//   module.hot.accept();
// }
