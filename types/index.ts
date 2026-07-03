export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  title: string;
  description: string;
  game_stats: Record<string, any>;
  created_at: string;
}
