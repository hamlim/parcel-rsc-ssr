import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

// Server dependencies.
import { type Context, Hono } from "hono";
import {
  decodeAction,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "react-server-dom-parcel/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";

import ReactClient, { ReactElement } from "react" with { env: "react-client" };
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server" with {
  env: "react-client",
};
// Client dependencies, used for SSR.
// These must run in the same environment as client components (e.g. same instance of React).
import { createFromReadableStream } from "react-server-dom-parcel/client" with {
  env: "react-client",
};

// Page components. These must have "use server-entry" so they are treated as code splitting entry points.
import { Todos } from "./Todos";

let honoApp = new Hono();

honoApp.use((c, next) => {
  c.header("Access-Control-Allow-Methods", "GET,HEAD,POST");
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Headers", "rsc-action");
  return next();
});

honoApp.use("/*", serveStatic({ root: "./dist" }));

honoApp.get("/", async (c) => {
  return await renderHono(c, <Todos />);
});

honoApp.post("/", async (c) => {
  return await handleHonoAction(c, <Todos />);
});

honoApp.get("/todos/:id", async (c) => {
  return await renderHono(c, <Todos id={Number(c.req.param("id"))} />);
});

honoApp.post("/todos/:id", async (c) => {
  return await handleHonoAction(c, <Todos id={Number(c.req.param("id"))} />);
});
function acceptsHTML(acceptHeader: string | undefined) {
  return (
    acceptHeader === "text/html" ||
    acceptHeader?.includes("text/html") ||
    acceptHeader === "*/*"
  );
}

async function renderHono(
  c: Context,
  component: ReactElement,
  actionResult?: any,
) {
  let root: any = component;
  if (actionResult) {
    root = { result: actionResult, root };
  }
  let stream = renderToReadableStream(root);
  if (acceptsHTML(c.req.header("accept"))) {
    let [s1, s2] = stream.tee();
    let data = createFromReadableStream<ReactElement>(s1);
    function Content() {
      return ReactClient.use(data);
    }

    let htmlStream = await renderHTMLToReadableStream(<Content />);
    let responseStream = htmlStream.pipeThrough(injectRSCPayload(s2));

    // Couldn't find a way to stream a response within hono _and_ set the response header
    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }

  // Couldn't find a way to stream a response within hono _and_ set the response header
  return new Response(stream, {
    headers: {
      "Content-Type": "text/x-component",
    },
  });
}

// Handle server actions.
async function handleHonoAction(c: Context, component: ReactElement) {
  let id = c.req.header("rsc-action-id");

  if (id) {
    let action = await loadServerAction(id);
    let body = c.req.header("content-type")?.includes("multipart/form-data")
      ? await c.req.formData()
      : await c.req.text();
    let args = await decodeReply<any[]>(body);
    let result = action.apply(null, args);
    try {
      await result;
    } catch (x) {
      // We handle the error on the client
    }

    return await renderHono(c, component, result);
  }
  // Form submitted by browser (progressive enhancement).
  let formData = await c.req.formData();
  let action = await decodeAction(formData);
  try {
    await action();
  } catch (err) {
    // TODO render error page?
  }
  return await renderHono(c, component);
}

console.log("Starting server");

let server = serve({ fetch: honoApp.fetch, port: 3001 });
console.log("Server listening on port 3001");

// @TODO: hot reloading doesn't work yet
// Restart the server when it changes.
if (module.hot) {
  module.hot.dispose(() => {
    server.close();
  });

  module.hot.accept();
}
