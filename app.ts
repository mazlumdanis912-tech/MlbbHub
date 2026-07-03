import { MobileLegendsApp } from "./lib/tournaments";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const ALLOWED_ORIGINS = [
  /\.repl\.co$/,
  /\.replit\.dev$/,
  /\.replit\.app$/,
  /localhost/,
  /127\.0\.0\.1/,
];

const app: Express = express();
const mobileLegendsApp = new MobileLegendsApp();
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return cb(null, true);
      const allowed = ALLOWED_ORIGINS.some((r) => r.test(origin));
      cb(null, allowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/api/tournaments", async (req, res) => {
  try {
    const data = await mobileLegendsApp.fetchTournamentInfo();
    res.json({ tournaments: data });
  } catch (error) {
    console.error("Hata detayı:", error);
    res.status(500).send("Mobile Legends Hub: Liquipedia’dan turnuva bilgileri alınamadı.");
  }
});
app.use("/api", router);

// Global error handler
app.use((err: Error, _req: import("express").Request, res: import("express").Response, _next: import("express").NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Sunucu hatası. Lütfen tekrar deneyin." });
});

export default app;
