import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { signToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "Email, password, and username are required" });
    }

    // Create user in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      logger.error({ error: authError }, "Registration failed");
      return res.status(400).json({ error: authError?.message || "Registration failed" });
    }

    // Store user profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email,
      username,
    });

    if (profileError) {
      logger.error({ error: profileError }, "Profile creation failed");
      return res.status(400).json({ error: "Failed to create profile" });
    }

    const token = signToken({ userId: authData.user.id, email });
    logger.info({ userId: authData.user.id }, "User registered successfully");

    res.json({ token, user: { id: authData.user.id, email, username } });
  } catch (error) {
    logger.error({ error }, "Register endpoint error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.admin.getUserByEmail(email);

    if (error || !data.user) {
      logger.warn({ email }, "Login failed - user not found");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Note: In production, verify password properly
    const token = signToken({ userId: data.user.id, email });
    logger.info({ userId: data.user.id }, "User logged in successfully");

    res.json({ token, user: { id: data.user.id, email } });
  } catch (error) {
    logger.error({ error }, "Login endpoint error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
