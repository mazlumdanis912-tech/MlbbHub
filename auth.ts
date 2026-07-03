import { Router } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase.js";
import { signToken } from "../lib/jwt.js";

const router = Router();

// POST /api/register
router.post("/register", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email ve şifre zorunludur." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Şifre en az 6 karakter olmalı." });
    return;
  }

  // Mevcut kullanıcı kontrolü
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existing) {
    res.status(409).json({ error: "Bu email adresi zaten kayıtlı." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from("users")
    .insert({ email: email.toLowerCase(), password_hash: passwordHash })
    .select("id, email")
    .single();

  if (error || !user) {
    res.status(500).json({ error: "Kullanıcı oluşturulamadı.", detail: error?.message });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({ user: { id: user.id, email: user.email }, token });
});

// POST /api/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email ve şifre zorunludur." });
    return;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, password_hash")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error || !user) {
    res.status(401).json({ error: "Email veya şifre hatalı." });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    res.status(401).json({ error: "Email veya şifre hatalı." });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ user: { id: user.id, email: user.email }, token });
});

export default router;
