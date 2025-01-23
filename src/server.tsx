import { serveStatic } from "@hono/node-server/serve-static";

// Server dependencies.
import { Hono } from "hono";
// import type { stream } from "hono/streaming";
// import {
//   decodeAction,
//   decodeReply,
//   loadServerAction,
//   renderToReadableStream,
// } from "react-server-dom-parcel/server.edge";
// import { injectRSCPayload } from "rsc-html-stream/server";

import { callAction, renderRequest } from "@parcel/rsc/server";

// import ReactClient, { ReactElement } from "react" with { env: "react-client" };
import type { ReactElement } from "react";
// import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server" with {
//   env: "react-client",
// };
// Client dependencies, used for SSR.
// These must run in the same environment as client components (e.g. same instance of React).
// import { createFromReadableStream } from "react-server-dom-parcel/client" with {
//   env: "react-client",
// };

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

// type API = {
//   context: Context;
//   stream: Parameters<Parameters<typeof stream>[1]>[0];
// };

// honoApp.get("/", async (c) => {
//   if (c.req.header("accept")?.includes("text/x-component")) {
//     c.header("Content-Type", "text/x-component");
//   } else {
//     c.header("Content-Type", "text/html");
//   }
//   return stream(c, async (stream) => {
//     let api: API = { context: c, stream };
//     await renderHono(api, <Todos />);
//   });
// });

honoApp.get("/", async (c) => {
  return await renderRequest(c.req.raw, <Todos />);
});

// honoApp.post("/", async (c) => {
//   if (c.req.header("accept")?.includes("text/x-component")) {
//     c.header("Content-Type", "text/x-component");
//   } else {
//     c.header("Content-Type", "text/html");
//   }
//   return stream(c, async (stream) => {
//     let api: API = { context: c, stream };
//     await handleHonoAction(api, <Todos />);
//   });
// });

honoApp.post("/", async (c) => {
  let id = c.req.header("rsc-action-id");
  let { result } = await callAction(c.req.raw, <Todos />);
  let root: ReactElement | { result: any; root: ReactElement } = <Todos />;
  if (id) {
    root = { result, root };
  }
  return await renderRequest(c.req.raw, root);
});

// honoApp.get("/todos/:id", async (c) => {
//   if (c.req.header("accept")?.includes("text/x-component")) {
//     c.header("Content-Type", "text/x-component");
//   } else {
//     c.header("Content-Type", "text/html");
//   }
//   return stream(c, async (stream) => {
//     let api: API = { context: c, stream };
//     await renderHono(api, <Todos id={Number(c.req.param("id"))} />);
//   });
// });

honoApp.get("/todos/:id", async (c) => {
  return await renderRequest(
    c.req.raw,
    <Todos id={Number(c.req.param("id"))} />,
  );
});

// honoApp.post("/todos/:id", async (c) => {
//   if (c.req.header("accept")?.includes("text/x-component")) {
//     c.header("Content-Type", "text/x-component");
//   } else {
//     c.header("Content-Type", "text/html");
//   }
//   return stream(c, async (stream) => {
//     let api: API = { context: c, stream };
//     await handleHonoAction(api, <Todos id={Number(c.req.param("id"))} />);
//   });
// });

honoApp.post("/todos/:id", async (c) => {
  let id = c.req.header("rsc-action-id");
  let { result } = await callAction(
    c.req.raw,
    <Todos id={Number(c.req.param("id"))} />,
  );
  let root: ReactElement | { result: any; root: ReactElement } = (
    <Todos id={Number(c.req.param("id"))} />
  );
  if (id) {
    root = { result, root };
  }
  return await renderRequest(c.req.raw, root);
});

// function acceptsHTML(acceptHeader: string | undefined) {
//   return (
//     acceptHeader === "text/html" ||
//     acceptHeader?.includes("text/html") ||
//     acceptHeader === "*/*"
//   );
// }

// async function renderHono(
//   api: API,
//   component: ReactElement,
//   actionResult?: any,
// ): Promise<void> {
//   let { context, stream: streamingAPI } = api;
//   let root: any = component;
//   if (actionResult) {
//     root = { result: actionResult, root };
//   }
//   let stream = renderToReadableStream(root);
//   if (acceptsHTML(context.req.header("accept"))) {
//     let [s1, s2] = stream.tee();
//     let data = createFromReadableStream<ReactElement>(s1);
//     function Content() {
//       return ReactClient.use(data);
//     }

//     let htmlStream = await renderHTMLToReadableStream(<Content />);
//     let responseStream = htmlStream.pipeThrough(injectRSCPayload(s2));

//     // context.header("Content-Type", "text/html");
//     await streamingAPI.pipe(responseStream);
//   } else {
//     // context.header("Content-Type", "text/x-component");
//     await streamingAPI.pipe(stream);
//   }
// }

// // Handle server actions.
// async function handleHonoAction(
//   api: API,
//   component: ReactElement,
// ): Promise<void> {
//   let id = api.context.req.header("rsc-action-id");

//   if (id) {
//     let action = await loadServerAction(id);
//     let body = api.context.req
//       .header("content-type")
//       ?.includes("multipart/form-data")
//       ? await api.context.req.formData()
//       : await api.context.req.text();
//     let args = await decodeReply<any[]>(body);
//     let result = action.apply(null, args);
//     try {
//       await result;
//     } catch (x) {
//       // We handle the error on the client
//     }

//     await renderHono(api, component, result);
//   } else {
//     // Form submitted by browser (progressive enhancement).
//     let formData = await api.context.req.formData();
//     let action = await decodeAction(formData);
//     try {
//       await action();
//     } catch (err) {
//       // TODO render error page?
//     }
//     await renderHono(api, component);
//   }
// }

// let handler = honoApp.fetch;
// // @ts-ignore
// globalThis.handler = handler;

// export default handler;
