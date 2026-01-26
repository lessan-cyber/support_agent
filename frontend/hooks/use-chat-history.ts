'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Conversation, Message, ChatHistoryResponse, ConversationMessagesResponse } from '@/lib/types/chat'

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000'

type ConversationStatus = "open" | "pending_human" | "all"

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

      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/chat/history?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            // Ajoutez votre token d'authentification si nécessaire
            // 'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`)
      }

      const data: ChatHistoryResponse = await response.json()
      setConversations(data.conversations)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  }
}

export function useConversationMessages(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [user, setUser] = useState<{ id: string; name: string; avatar?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([])
      setUser(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/chat/history/${conversationId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            // Ajoutez votre token d'authentification si nécessaire
            // 'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }

      const data: ConversationMessagesResponse = await response.json()
      
      // Convertir les timestamps en objets Date
      const formattedMessages = data.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
      
      setMessages(formattedMessages)
      setUser(data.user)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const sendMessage = async (content: string) => {
    if (!conversationId) return

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/chat/history/${conversationId}/messages`,
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
      
      setMessages(prev => [...prev, {
        ...newMessage,
        timestamp: new Date(newMessage.timestamp)
      }])

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