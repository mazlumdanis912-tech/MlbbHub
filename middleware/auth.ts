import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    (req as any).userId = payload.userId;
    (req as any).email = payload.email;

    next();
  } catch (error) {
    logger.error({ error }, "Auth middleware failed");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
