import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");
const port = Number(process.env.PORT || 4173);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return MIME_TYPES[extension] || "application/octet-stream";
}

async function serveFile(response, filePath) {
  const content = await fs.readFile(filePath);
  response.writeHead(200, {
    "Content-Type": getContentType(filePath),
    "Cache-Control": "public, max-age=300",
  });
  response.end(content);
}

function sendNotFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const safeRelativePath = path
      .normalize(pathname)
      .replace(/^([.][.][/\\])+/, "");
    const requestedPath = path.join(distDir, safeRelativePath);

    const rootResolved = path.resolve(distDir);
    const fileResolved = path.resolve(requestedPath);
    if (!fileResolved.startsWith(rootResolved)) {
      sendNotFound(response);
      return;
    }

    let stat;
    try {
      stat = await fs.stat(fileResolved);
    } catch {
      stat = null;
    }

    if (stat?.isFile()) {
      await serveFile(response, fileResolved);
      return;
    }

    if (stat?.isDirectory()) {
      const indexPath = path.join(fileResolved, "index.html");
      try {
        await serveFile(response, indexPath);
        return;
      } catch {}
    }

    const fallbackIndex = path.join(distDir, "index.html");
    try {
      await serveFile(response, fallbackIndex);
      return;
    } catch {
      sendNotFound(response);
    }
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal server error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Static server listening on port ${port}`);
});
