import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// GET /api/messages/:userId  — kullanıcının mesaj geçmişi (auth required)
router.get("/messages/:userId", requireAuth, async (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user!.userId;

  // Yalnızca kendi mesajlarını görüntüleyebilir
  if (userId !== requesterId) {
    res.status(403).json({ error: "Yalnızca kendi mesajlarınızı görüntüleyebilirsiniz." });
    return;
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    res.status(500).json({ error: "Mesajlar alınamadı.", detail: error.message });
    return;
  }

  res.json({ messages: data ?? [] });
});

export default router;
