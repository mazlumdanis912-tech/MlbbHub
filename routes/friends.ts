import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Add friend
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: "friendId is required" });
    }

    const { error } = await supabase.from("friendships").insert({
      user_id: userId,
      friend_id: friendId,
      status: "pending",
    });

    if (error) {
      logger.error({ error }, "Failed to add friend");
      return res.status(400).json({ error: "Failed to add friend" });
    }

    logger.info({ userId, friendId }, "Friend request sent");
    res.json({ message: "Friend request sent" });
  } catch (error) {
    logger.error({ error }, "Add friend endpoint error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get friends list
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const { data, error } = await supabase
      .from("friendships")
      .select("friend_id, status")
      .eq("user_id", userId)
      .eq("status", "accepted");

    if (error) {
      logger.error({ error }, "Failed to fetch friends");
      return res.status(400).json({ error: "Failed to fetch friends" });
    }

    res.json({ friends: data });
  } catch (error) {
    logger.error({ error }, "Get friends endpoint error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
