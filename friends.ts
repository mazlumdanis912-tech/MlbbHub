import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// POST /api/addFriend  (auth required)
router.post("/addFriend", requireAuth, async (req, res) => {
  const { friendId } = req.body as { friendId?: string };
  const userId = req.user!.userId;

  if (!friendId) {
    res.status(400).json({ error: "friendId zorunludur." });
    return;
  }
  if (friendId === userId) {
    res.status(400).json({ error: "Kendinizi arkadaş ekleyemezsiniz." });
    return;
  }

  // Arkadaş var mı?
  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", friendId)
    .maybeSingle();

  if (!targetUser) {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
    return;
  }

  // Zaten arkadaşlar mı?
  const { data: existing } = await supabase
    .from("friends")
    .select("id")
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .maybeSingle();

  if (existing) {
    res.status(409).json({ error: "Bu kullanıcı zaten arkadaş listenizde." });
    return;
  }

  // Çift yönlü arkadaşlık ekle
  const { error } = await supabase
    .from("friends")
    .insert([
      { user_id: userId, friend_id: friendId },
      { user_id: friendId, friend_id: userId },
    ]);

  if (error) {
    res.status(500).json({ error: "Arkadaş eklenemedi.", detail: error.message });
    return;
  }

  res.status(201).json({ message: "Arkadaş başarıyla eklendi." });
});

// GET /api/friends/:userId  (auth required — only own list)
router.get("/friends/:userId", requireAuth, async (req, res) => {
  const { userId } = req.params;

  if (userId !== req.user!.userId) {
    res.status(403).json({ error: "Yalnızca kendi arkadaş listenizi görüntüleyebilirsiniz." });
    return;
  }

  const { data, error } = await supabase
    .from("friends")
    .select("friend_id, users!friends_friend_id_fkey(id, email)")
    .eq("user_id", userId);

  if (error) {
    res.status(500).json({ error: "Arkadaşlar alınamadı.", detail: error.message });
    return;
  }

  const friends = (data ?? []).map((row: any) => ({
    id: row.friend_id,
    email: row.users?.email,
  }));

  res.json({ friends });
});

export default router;
