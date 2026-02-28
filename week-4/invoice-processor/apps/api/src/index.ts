import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { invoicesRoutes } from "./routes/invoices";
import { getUploadsDir } from "./lib/file-utils";
import fs from "fs/promises";

const app = new Hono();
const UPLOADS_DIR = getUploadsDir();

app.use("*", cors());

app.route("/invoices", invoicesRoutes);

app.get("/uploads/:filename", async (c) => {
  const filename = c.req.param("filename");
  if (!filename || filename.includes("..")) {
    return c.json({ error: "Invalid filename" }, 400);
  }
  const filePath = path.join(UPLOADS_DIR, filename);
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return c.json({ error: "Not found" }, 404);
    }
    const content = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".pdf": "application/pdf",
    };
    const contentType = mimeTypes[ext] ?? "application/octet-stream";
    return new Response(content, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return c.json({ error: "File not found" }, 404);
  }
});

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT) || 3001;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API running at http://localhost:${info.port}`);
});
