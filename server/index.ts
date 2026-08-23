import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import "./lib/env.ts";
import { scanRoutes } from "./routes/scan.ts";
import { tryOnRoutes } from "./routes/try-on.ts";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);
app.use(
  "*",
  bodyLimit({
    maxSize: 20 * 1024 * 1024,
    onError: (c) =>
      c.json({ error: "Image is too large. Try a smaller photo." }, 413),
  }),
);

app.use("*", async (c, next) => {
  const started = Date.now();
  await next();
  console.log(
    `${c.req.method} ${c.req.path} -> ${c.res.status} ${Date.now() - started}ms`,
  );
});

app.get("/health", (c) => c.json({ ok: true }));
app.route("/", scanRoutes);
app.route("/", tryOnRoutes);

app.notFound((c) => c.json({ error: "Not found." }, 404));

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error("Unhandled error", err);
  return c.json({ error: "Something went wrong." }, 500);
});

const port = Number(process.env.PORT ?? 3000);
const hostname = "0.0.0.0";

serve({ fetch: app.fetch, hostname, port }, (info) => {
  console.log(`RealityLens API listening on http://${info.address}:${info.port}`);
});
