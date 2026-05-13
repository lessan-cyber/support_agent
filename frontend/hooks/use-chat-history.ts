'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Conversation, Message, ChatHistoryResponse, ConversationMessagesResponse } from '@/lib/types/chat'
import { getAuthToken} from "@/app/actions/auth"
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000'

type ConversationStatus = "open" | "pending_human" | "all"

// Fonction pour obtenir le temps relatif
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

export function useChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async (filter?: ConversationStatus) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filter && filter !== 'all') {
        params.append('status', filter)
      }

      // Récupérer le token juste avant la requête
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/admin/conversations`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("[useChatHistory] Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`)
      }

      const data: ChatHistoryResponse = await response.json()
      
      // Mapper les données du backend vers le format Conversation
      const mappedConversations = data.conversations.map((conv: any) => ({
        ticketId: conv.ticket_id,
        userEmail: conv.user_email || 'Unknown',
        lastMessageContent: conv.last_message_content || 'No messages',
        lastMessageAt: new Date(conv.last_message_at),
        lastMessageSender: conv.last_message_sender as 'user' | 'bot',
        timestamp: getRelativeTime(new Date(conv.last_message_at)),
        status: conv.status as 'open' | 'pending_human',
        messageCount: conv.message_count || 0,
      }))
      
      setConversations(mappedConversations)
      console.log("[useChatHistory] Fetched conversations:", mappedConversations.length)
      console.log("[useChatHistory] Conversation data:", JSON.stringify(mappedConversations, null, 2))
    } catch (err) {
      console.error('[useChatHistory] Error fetching conversations:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log('[useChatHistory] useEffect: Fetching conversations')
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  }
}

export function useConversationMessages(ticketId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [user, setUser] = useState<{ id: string; name: string; avatar?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!ticketId) {
      setMessages([])
      setUser(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/admin/conversations/${ticketId}/messages/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }

      const data: ConversationMessagesResponse = await response.json()
      console.log('Fetched messages:', data.messages)
      
      // Les messages sont déjà au bon format selon l'interface
      setMessages(data.messages)
      // setUser(data.user)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const sendMessage = async (content: string) => {
    if (!ticketId) return

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/chat/history/${ticketId}/messages/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            content,
            sender: 'admin'
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      const newMessage: Message = await response.json()
      
      setMessages(prev => [...prev, newMessage])

      return newMessage
    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
  }

  return {
    messages,
    user,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages,
  }
}




// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useRouter } from "next/navigation";

// export interface ConversationListItem {
//   ticket_id: string;
//   status: string;
//   user_email: string;
//   created_at: string;
//   message_count: number;
//   last_message_at: string | null;
//   last_message_content: string | null;
//   last_message_sender: string | null;
// }

// export interface ConversationListResponse {
//   conversations: ConversationListItem[];
//   total_count: number;
//   limit: number;
//   offset: number;
// }

// interface ConversationQueryParams {
//   page?: number;
//   limit?: number;
//   client_email?: string;
//   status?: string;
//   start_date?: string;
//   end_date?: string;
// }

// export function useConversationList(params: ConversationQueryParams = {}) {
//   const router = useRouter();
//   const {
//     page = 1,
//     limit = 12,
//     client_email,
//     status,
//     start_date,
//     end_date,
//   } = params;

//   const offset = (page - 1) * limit;

//   const queryParams = new URLSearchParams({
//     limit: String(limit),
//     offset: String(offset),
//     ...(client_email && { client_email }),
//     ...(status && { status }),
//     ...(start_date && { start_date }),
//     ...(end_date && { end_date }),
//   });

//   return useQuery<ConversationListResponse>({
//     queryKey: [
//       "conversations",
//       page,
//       limit,
//       client_email,
//       status,
//       start_date,
//       end_date,
//     ],
//     queryFn: async () => {
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/conversations?${queryParams}`,
//         {
//           method: "GET",
//           credentials: "include",
//           headers: { "Content-Type": "application/json" },
//         }
//       );

//       if (response.status === 401) {
//         router.push("/login");
//         throw new Error("Unauthorized");
//       }

//       if (!response.ok) {
//         throw new Error("Failed to fetch conversations");
//       }

//       return response.json();
//     },
//     staleTime: 2 * 60 * 1000, // 2 minutes
//   });
// }