// types/chat.ts
export interface Message {
  id: string
  content: string
  sender_type: "user" | "bot" | "admin"
  created_at: string
}

export interface Conversation {
  ticketId: string
  // userName: string
  userAvatar?: string
  lastMessageAt: Date
  lastMessageContent: string
  lastMessageSender: "user" | "bot" | "admin"
  timestamp: string
  status: "open" | "pending_human"
  messageCount: number
  userEmail: string
}

export interface ChatHistoryResponse {
  conversations: Conversation[]
  total: number
}

export interface ConversationMessagesResponse {
  ticket_id: string
  status: "open" | "pending_human"
  user_email: string
  messages: Message[]
  
}