import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { verifyToken } from "./lib/jwt.js";
import { supabase } from "./lib/supabase.js";
import { logger } from "./lib/logger.js";

const ALLOWED_ORIGINS = [
  /\.repl\.co$/,
  /\.replit\.dev$/,
  /\.replit\.app$/,
  /localhost/,
];

export function setupSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Bağlantı kimlik doğrulama middleware'i
  io.use((socket: Socket, next) => {
    const token =
      (socket.handshake.auth as { token?: string }).token ??
      (socket.handshake.headers.authorization as string | undefined)?.slice(7);

    if (!token) {
      return next(new Error("Token gerekli."));
    }
    try {
      const payload = verifyToken(token);
      (socket as any).userId = payload.userId;
      (socket as any).email = payload.email;
      next();
    } catch {
      next(new Error("Geçersiz token."));
    }
  });

  // Online kullanıcı haritası  userId → Set<socketId>
  const onlineUsers = new Map<string, Set<string>>();

  function broadcastOnline() {
    io.emit("online_users", Array.from(onlineUsers.keys()));
  }

  io.on("connection", (socket: Socket) => {
    const userId: string = (socket as any).userId;
    const email: string = (socket as any).email;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);
    logger.info({ userId, email, connections: onlineUsers.get(userId)!.size }, "Socket bağlantısı kuruldu");

    // Kullanıcıya ait odaya katıl (özel mesajlar için)
    socket.join(`user:${userId}`);

    // Çevrimiçi kullanıcıları yayınla
    broadcastOnline();

    // ── Mesaj gönderme ────────────────────────────────────────────────
    socket.on(
      "send_message",
      async (payload: { receiverId: string; content: string }) => {
        const { receiverId, content } = payload;

        if (!receiverId || !content?.trim()) {
          socket.emit("error", { message: "receiverId ve content zorunludur." });
          return;
        }

        // Mesajı DB'ye kaydet
        const { data: msg, error } = await supabase
          .from("messages")
          .insert({ sender_id: userId, receiver_id: receiverId, content: content.trim() })
          .select("id, sender_id, receiver_id, content, created_at")
          .single();

        if (error || !msg) {
          socket.emit("error", { message: "Mesaj kaydedilemedi." });
          return;
        }

        // Alıcıya ilet (çevrimiçiyse)
        io.to(`user:${receiverId}`).emit("new_message", msg);
        // Gönderene de onayla
        socket.emit("message_sent", msg);

        logger.info({ from: userId, to: receiverId, msgId: msg.id }, "Mesaj iletildi");
      }
    );

    // ── Yazıyor... ────────────────────────────────────────────────────
    socket.on("typing", ({ receiverId }: { receiverId: string }) => {
      io.to(`user:${receiverId}`).emit("user_typing", { senderId: userId });
    });

    socket.on("stop_typing", ({ receiverId }: { receiverId: string }) => {
      io.to(`user:${receiverId}`).emit("user_stop_typing", { senderId: userId });
    });

    // ── Bağlantı kesilme ──────────────────────────────────────────────
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
      broadcastOnline();
      logger.info({ userId, remaining: onlineUsers.get(userId)?.size ?? 0 }, "Socket bağlantısı kesildi");
    });
  });

  return io;
}
