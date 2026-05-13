'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Conversation } from '@/lib/types/chat'
import { getAuthToken } from "@/app/actions/auth"

type ConversationStatus = "open" | "pending_human" | "all"

interface WebSocketMessage {
  type: 'conversations_update' | 'new_message' | 'conversation_status_change'
  data: any
}

export function useChatWebSocket(enabled: boolean = true) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const BACKEND_WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:8000'

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

  // Mapper les données backend vers Conversation
  const mapConversation = (conv: any): Conversation => ({
    ticketId: conv.ticket_id,
    userEmail: conv.user_email || 'Unknown',
    lastMessageContent: conv.last_message_content || 'No messages',
    lastMessageAt: new Date(conv.last_message_at),
    lastMessageSender: conv.last_message_sender as 'user' | 'bot',
    timestamp: getRelativeTime(new Date(conv.last_message_at)),
    status: conv.status as 'open' | 'pending_human',
    messageCount: conv.message_count || 0,
  })

  const connect = useCallback(async () => {
    if (!enabled) return
    
    try {
      const authToken = await getAuthToken()
      if (!authToken) {
        throw new Error('No authentication token available')
      }

      console.log('[useChatWebSocket] Connecting to WebSocket...')
      
      // Créer la connexion WebSocket avec le token dans l'URL
      const wsUrl = `${BACKEND_WS_URL}/api/v1/admin/conversations/ws?token=${authToken}`
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('[useChatWebSocket] Connected')
        setConnected(true)
        setError(null)
        reconnectAttempts.current = 0
        setLoading(false)
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('[useChatWebSocket] Message received:', message.type)

          if (message.type === 'conversations_update') {
            // Mise à jour complète des conversations
            const mapped = message.data.conversations.map(mapConversation)
            setConversations(mapped)
          } 
          else if (message.type === 'new_message') {
            // Nouvelle message - mettre à jour la conversation concernée
            setConversations(prev => 
              prev.map(conv => 
                conv.ticketId === message.data.ticket_id
                  ? {
                      ...conv,
                      lastMessageContent: message.data.content,
                      lastMessageSender: message.data.sender,
                      lastMessageAt: new Date(message.data.timestamp),
                      timestamp: getRelativeTime(new Date(message.data.timestamp)),
                      messageCount: conv.messageCount + 1,
                    }
                  : conv
              )
            )
          }
          else if (message.type === 'conversation_status_change') {
            // Changement de statut
            setConversations(prev =>
              prev.map(conv =>
                conv.ticketId === message.data.ticket_id
                  ? { ...conv, status: message.data.status }
                  : conv
              )
            )
          }
        } catch (err) {
          console.error('[useChatWebSocket] Error parsing message:', err)
        }
      }

      ws.current.onerror = (event) => {
        console.error('[useChatWebSocket] WebSocket error:', event)
        setError('WebSocket connection error')
        setConnected(false)
      }

      ws.current.onclose = () => {
        console.log('[useChatWebSocket] Disconnected')
        setConnected(false)
        
        // Reconnection automatique avec backoff exponentiel
        if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++
          console.log(`[useChatWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`)
          setTimeout(connect, delay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed to reconnect after multiple attempts')
        }
      }
    } catch (err) {
      console.error('[useChatWebSocket] Connection error:', err)
      setError(err instanceof Error ? err.message : 'Connection error')
      setConnected(false)
    }
  }, [enabled])

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    setConnected(false)
  }, [])

  const send = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.error('[useChatWebSocket] WebSocket not connected')
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    conversations,
    loading,
    error,
    connected,
    send,
  }
}
