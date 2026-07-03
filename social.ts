import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// ──────────────────────────────────────────────────────────
// FOLLOW / UNFOLLOW
// ──────────────────────────────────────────────────────────

// POST /api/follow/:targetId
router.post("/follow/:targetId", requireAuth, async (req, res) => {
  const followerId = req.user!.userId;
  const { targetId } = req.params;

  if (followerId === targetId) {
    res.status(400).json({ error: "Kendinizi takip edemezsiniz." });
    return;
  }

  const { data: target } = await supabase
    .from("users").select("id").eq("id", targetId).maybeSingle();
  if (!target) { res.status(404).json({ error: "Kullanıcı bulunamadı." }); return; }

  const { data: existing } = await supabase
    .from("followers").select("id")
    .eq("follower_id", followerId).eq("following_id", targetId).maybeSingle();
  if (existing) { res.status(409).json({ error: "Zaten takip ediyorsunuz." }); return; }

  const { error } = await supabase.from("followers")
    .insert({ follower_id: followerId, following_id: targetId });
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.status(201).json({ message: "Takip edildi." });
});

// DELETE /api/follow/:targetId
router.delete("/follow/:targetId", requireAuth, async (req, res) => {
  const followerId = req.user!.userId;
  const { targetId } = req.params;

  const { error } = await supabase.from("followers")
    .delete().eq("follower_id", followerId).eq("following_id", targetId);
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json({ message: "Takip bırakıldı." });
});

// GET /api/profile/:userId  — herkese açık profil
router.get("/profile/:userId", async (req, res) => {
  const { userId } = req.params;

  const { data: user, error } = await supabase
    .from("users").select("id, email").eq("id", userId).maybeSingle();
  if (error || !user) { res.status(404).json({ error: "Kullanıcı bulunamadı." }); return; }

  const { count: postsCount } = await supabase
    .from("highlights").select("*", { count: "exact", head: true }).eq("user_id", userId);
  const { count: followersCount } = await supabase
    .from("followers").select("*", { count: "exact", head: true }).eq("following_id", userId);
  const { count: followingCount } = await supabase
    .from("followers").select("*", { count: "exact", head: true }).eq("follower_id", userId);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      postsCount: postsCount ?? 0,
      followersCount: followersCount ?? 0,
      followingCount: followingCount ?? 0,
    },
  });
});

// GET /api/is-following/:targetId  — takip durumu kontrolü
router.get("/is-following/:targetId", requireAuth, async (req, res) => {
  const followerId = req.user!.userId;
  const { targetId } = req.params;

  const { data } = await supabase.from("followers")
    .select("id").eq("follower_id", followerId).eq("following_id", targetId).maybeSingle();

  res.json({ isFollowing: !!data });
});

// ──────────────────────────────────────────────────────────
// LIKES
// ──────────────────────────────────────────────────────────

// POST /api/highlights/:id/like
router.post("/highlights/:id/like", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const highlightId = req.params.id;

  const { data: existing } = await supabase.from("likes")
    .select("id").eq("highlight_id", highlightId).eq("user_id", userId).maybeSingle();

  if (existing) {
    // Already liked → unlike
    await supabase.from("likes").delete().eq("id", existing.id);
    const { count } = await supabase.from("likes")
      .select("*", { count: "exact", head: true }).eq("highlight_id", highlightId);
    res.json({ liked: false, count: count ?? 0 });
  } else {
    await supabase.from("likes").insert({ highlight_id: highlightId, user_id: userId });
    const { count } = await supabase.from("likes")
      .select("*", { count: "exact", head: true }).eq("highlight_id", highlightId);
    res.json({ liked: true, count: count ?? 0 });
  }
});

// GET /api/highlights/:id/likes
router.get("/highlights/:id/likes", async (req, res) => {
  const highlightId = req.params.id;
  const { count, error } = await supabase.from("likes")
    .select("*", { count: "exact", head: true }).eq("highlight_id", highlightId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ count: count ?? 0 });
});

// ──────────────────────────────────────────────────────────
// COMMENTS
// ──────────────────────────────────────────────────────────

// GET /api/highlights/:id/comments
router.get("/highlights/:id/comments", async (req, res) => {
  const highlightId = req.params.id;
  const { data, error } = await supabase.from("comments")
    .select("id, user_id, content, created_at, users(email)")
    .eq("highlight_id", highlightId)
    .order("created_at", { ascending: true });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ comments: data ?? [] });
});

// POST /api/highlights/:id/comments
router.post("/highlights/:id/comments", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const highlightId = req.params.id;
  const { content } = req.body as { content?: string };

  if (!content?.trim()) {
    res.status(400).json({ error: "Yorum boş olamaz." });
    return;
  }

  const { data, error } = await supabase.from("comments")
    .insert({ highlight_id: highlightId, user_id: userId, content: content.trim() })
    .select("id, user_id, content, created_at")
    .single();

  if (error || !data) { res.status(500).json({ error: error?.message }); return; }
  res.status(201).json({ comment: data });
});

export default router;
