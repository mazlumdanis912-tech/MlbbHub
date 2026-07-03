import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Create highlight
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, description, gameStats } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const { data, error } = await supabase
      .from("highlights")
      .insert({
        user_id: userId,
        title,
        description,
        game_stats: gameStats,
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, "Failed to create highlight");
      return res.status(400).json({ error: "Failed to create highlight" });
    }

    logger.info({ userId, highlightId: data.id }, "Highlight created");
    res.status(201).json(data);
  } catch (error) {
    logger.error({ error }, "Create highlight endpoint error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get highlights
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const { data, error } = await supabase
      .from("highlights")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({ error }, "Failed to fetch highlights");
      return res.status(400).json({ error: "Failed to fetch highlights" });
    }

    res.json({ highlights: data });
  } catch (error) {
    logger.error({ error }, "Get highlights endpoint error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
