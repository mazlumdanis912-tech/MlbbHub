import { Router } from "express";
import authRouter from "./auth.js";
import friendsRouter from "./friends.js";
import messagesRouter from "./messages.js";
import highlightsRouter from "./highlights.js";

const router = Router();

// Health check
router.get("/healthz", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Route handlers
router.use("/auth", authRouter);
router.use("/friends", friendsRouter);
router.use("/messages", messagesRouter);
router.use("/highlights", highlightsRouter);

export default router;
