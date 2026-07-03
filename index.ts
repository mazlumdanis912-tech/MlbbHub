import { createServer } from "http";
import app from "./app.js";
import { setupSocket } from "./socket.js";
import { logger } from "./lib/logger.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
const io = setupSocket(httpServer);

httpServer.listen(port, () => {
  const domain = process.env["REPLIT_DEV_DOMAIN"] ?? `localhost:${port}`;
  logger.info({ port, url: `https://${domain}` }, "🚀 MLBB Hub API Server başlatıldı");
  logger.info("Socket.io hazır — gerçek zamanlı mesajlaşma aktif");
  logger.info("Endpoints: /api/register  /api/login  /api/addFriend  /api/friends/:id  /api/highlight  /api/highlights  /api/messages/:id  /api/healthz");
});

export { io };
