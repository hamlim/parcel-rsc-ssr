import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

// Server dependencies.
import express, {
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from "express";
import { type Context, Hono } from "hono";
import { stream } from "hono/streaming";
import type { StreamingApi } from "hono/utils/stream";
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
const expressApp = express();

honoApp.use((c, next) => {
  c.header("Access-Control-Allow-Methods", "GET,HEAD,POST");
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Headers", "rsc-action");
  return next();
});

expressApp.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "rsc-action");
  next();
});

honoApp.use("/dist/*", serveStatic({ root: "./dist" }));
expressApp.use(express.static("dist"));

honoApp.get("/", async (c) => {
  return stream(c, async (stream) => {
    await renderHono(c, stream, <Todos />);
  });
});

expressApp.get("/", async (req, res) => {
  await renderExpress(req, res, <Todos />);
});

honoApp.post("/", async (c) => {
  return stream(c, async (stream) => {
    await handleHonoAction(c, stream, <Todos />);
  });
});

expressApp.post("/", async (req, res) => {
  await handleExpressAction(req, res, <Todos />);
});

honoApp.get("/todos/:id", async (c) => {
  return stream(c, async (stream) => {
    await renderHono(c, stream, <Todos id={Number(c.req.param("id"))} />);
  });
});

expressApp.get("/todos/:id", async (req, res) => {
  await renderExpress(req, res, <Todos id={Number(req.params.id)} />);
});

honoApp.post("/todos/:id", async (c) => {
  return stream(c, async (stream) => {
    await handleHonoAction(c, stream, <Todos id={Number(c.req.param("id"))} />);
  });
});

expressApp.post("/todos/:id", async (req, res) => {
  await handleExpressAction(req, res, <Todos id={Number(req.params.id)} />);
});

async function renderExpress(
  req: ExpressRequest,
  res: ExpressResponse,
  component: ReactElement,
  actionResult?: any,
) {
  // Render RSC payload.
  let root: any = component;
  if (actionResult) {
    root = { result: actionResult, root };
  }
  let stream = renderToReadableStream(root);
  if (req.accepts("text/html")) {
    res.setHeader("Content-Type", "text/html");

    // Use client react to render the RSC payload to HTML.
    let [s1, s2] = stream.tee();
    let data = createFromReadableStream<ReactElement>(s1);
    function Content() {
      return ReactClient.use(data);
    }

    let htmlStream = await renderHTMLToReadableStream(<Content />);
    let response = htmlStream.pipeThrough(injectRSCPayload(s2));
    Readable.fromWeb(response as NodeReadableStream).pipe(res);
  } else {
    res.set("Content-Type", "text/x-component");
    Readable.fromWeb(stream as NodeReadableStream).pipe(res);
  }
}

async function renderHono(
  c: Context,
  streamingHelper: StreamingApi,
  component: ReactElement,
  actionResult?: any,
) {
  let root: any = component;
  if (actionResult) {
    root = { result: actionResult, root };
  }
  let stream = renderToReadableStream(root);
  if (c.req.header("accept") === "text/html") {
    let [s1, s2] = stream.tee();
    let data = createFromReadableStream<ReactElement>(s1);
    function Content() {
      return ReactClient.use(data);
    }

    let htmlStream = await renderHTMLToReadableStream(<Content />);
    let response = htmlStream.pipeThrough(injectRSCPayload(s2));
    streamingHelper.pipe(response);
  } else {
    c.header("Content-Type", "text/x-component");
    streamingHelper.pipe(stream);
  }
}

// Handle server actions.
async function handleHonoAction(
  c: Context,
  streamingHelper: StreamingApi,
  component: ReactElement,
) {
  let id = c.req.header("rsc-action-id");
  let request = new Request(`http://localhost${c.req.path}`, {
    method: "POST",
    headers: c.req.raw.headers,
    body: c.req.raw.body,
    // @ts-ignore
    duplex: "half",
  });

  if (id) {
    let action = await loadServerAction(id);
    let body =
      c.req.header("content-type") === "multipart/form-data"
        ? await request.formData()
        : await request.text();
    let args = await decodeReply<any[]>(body);
    let result = action.apply(null, args);
    try {
      await result;
    } catch (x) {
      // We handle the error on the client
    }

    await renderHono(c, streamingHelper, component, result);
  } else {
    // Form submitted by browser (progressive enhancement).
    let formData = await request.formData();
    let action = await decodeAction(formData);
    try {
      await action();
    } catch (err) {
      // TODO render error page?
    }
    await renderHono(c, streamingHelper, component);
  }
}

async function handleExpressAction(
  req: ExpressRequest,
  res: ExpressResponse,
  component: ReactElement,
) {
  let id = req.get("rsc-action-id");
  let request = new Request("http://localhost" + req.url, {
    method: "POST",
    headers: req.headers as any,
    body: Readable.toWeb(req) as ReadableStream,
    // @ts-ignore
    duplex: "half",
  });

  if (id) {
    let action = await loadServerAction(id);
    let body = req.is("multipart/form-data")
      ? await request.formData()
      : await request.text();
    let args = await decodeReply<any[]>(body);
    let result = action.apply(null, args);
    try {
      // Wait for any mutations
      await result;
    } catch (x) {
      // We handle the error on the client
    }

    await renderExpress(req, res, component, result);
  } else {
    // Form submitted by browser (progressive enhancement).
    let formData = await request.formData();
    let action = await decodeAction(formData);
    try {
      // Wait for any mutations
      await action();
    } catch (err) {
      // TODO render error page?
    }
    await renderExpress(req, res, component);
  }
}

console.log("Starting server");

let useHono = true;
let server: any;
if (useHono) {
  server = serve({ fetch: honoApp.fetch, port: 3001 });
  console.log("Server listening on port 3001");
} else {
  server = expressApp.listen(3001);
  console.log("Server listening on port 3001");
}

// @TODO: hot reloading doesn't work yet
// Restart the server when it changes.
if (module.hot) {
  module.hot.dispose(() => {
    server.close();
  });

  module.hot.accept();
}
