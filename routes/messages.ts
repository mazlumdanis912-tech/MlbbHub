import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Get conversation messages
router.get("/:userId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const otherUserId = req.params.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error({ error }, "Failed to fetch messages");
      return res.status(400).json({ error: "Failed to fetch messages" });
    }

    res.json({ messages: data.reverse() });
  } catch (error) {
    logger.error({ error }, "Get messages endpoint error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
