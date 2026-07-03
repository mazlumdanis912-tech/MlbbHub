import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// POST /api/highlight  (auth required)
router.post("/highlight", requireAuth, async (req, res) => {
  const { content } = req.body as { content?: string };
  const userId = req.user!.userId;

  if (!content?.trim()) {
    res.status(400).json({ error: "İçerik boş olamaz." });
    return;
  }

  const { data, error } = await supabase
    .from("highlights")
    .insert({ user_id: userId, content: content.trim() })
    .select("id, user_id, content, created_at")
    .single();

  if (error || !data) {
    res.status(500).json({ error: "Highlight kaydedilemedi.", detail: error?.message });
    return;
  }

  res.status(201).json({ highlight: data });
});

// GET /api/highlights  — tüm highlight'lar
router.get("/highlights", async (_req, res) => {
  const { data, error } = await supabase
    .from("highlights")
    .select("id, user_id, content, created_at, users(email)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    res.status(500).json({ error: "Highlight'lar alınamadı.", detail: error.message });
    return;
  }

  res.json({ highlights: data ?? [] });
});

// GET /api/highlights/:userId  — kullanıcıya özel
router.get("/highlights/:userId", async (req, res) => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from("highlights")
    .select("id, user_id, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Highlight'lar alınamadı.", detail: error.message });
    return;
  }

  res.json({ highlights: data ?? [] });
});

export default router;
