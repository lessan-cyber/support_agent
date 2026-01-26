// components/dashboard/chat-view.tsx
"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Clock, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender: "user" | "bot" | "admin"
  timestamp: Date
  userName?: string
}

interface ChatViewProps {
  conversationId?: string
  conversationUser?: {
    name: string
    avatar?: string
  }
}

export function ChatView({ conversationId, conversationUser }: ChatViewProps) {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "1",
      content: "Bonjour, j'ai besoin d'aide avec mon compte",
      sender: "user",
      timestamp: new Date(Date.now() - 3600000),
      userName: "Alice Martin"
    },
    {
      id: "2",
      content: "Bonjour ! Je serais ravi de vous aider. Pouvez-vous me décrire votre problème plus en détail ?",
      sender: "bot",
      timestamp: new Date(Date.now() - 3500000),
    },
    {
      id: "3",
      content: "Je n'arrive pas à me connecter, j'ai oublié mon mot de passe",
      sender: "user",
      timestamp: new Date(Date.now() - 3400000),
      userName: "Alice Martin"
    },
    {
      id: "4",
      content: "Je comprends. Pour réinitialiser votre mot de passe, vous pouvez cliquer sur 'Mot de passe oublié' sur la page de connexion.",
      sender: "bot",
      timestamp: new Date(Date.now() - 3300000),
    },
    {
      id: "5",
      content: "Je ne reçois pas l'email de réinitialisation",
      sender: "user",
      timestamp: new Date(Date.now() - 3200000),
      userName: "Alice Martin"
    },
  ])
  
  const [inputValue, setInputValue] = React.useState("")
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "admin",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <Inbox className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
        <p className="text-sm">Select a conversation from the sidebar to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={conversationUser?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-purple-600 text-white">
              {conversationUser?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{conversationUser?.name || "Unknown User"}</h2>
            <p className="text-xs text-muted-foreground">Active conversation</p>
          </div>
        </div>
        
        <Badge variant="outline" className="gap-1">
          <Clock className="w-3 h-3" />
          Open
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => {
            const isUser = message.sender === "user"
            const isBot = message.sender === "bot"
            const isAdmin = message.sender === "admin"

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isAdmin && "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {isBot ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={cn(
                        isAdmin 
                          ? "bg-gradient-to-br from-green-500 to-teal-600" 
                          : "bg-gradient-to-br from-cyan-400 to-purple-600",
                        "text-white"
                      )}>
                        {isAdmin ? "A" : (message.userName?.charAt(0) || "U")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Message bubble */}
                <div className={cn(
                  "flex flex-col gap-1 max-w-[70%]",
                  isAdmin && "items-end"
                )}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isBot && <span className="font-medium">Bot Assistant</span>}
                    {isUser && <span className="font-medium">{message.userName}</span>}
                    {isAdmin && <span className="font-medium">You (Admin)</span>}
                    <span>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm",
                      isBot && "bg-muted",
                      isUser && "bg-secondary",
                      isAdmin && "bg-primary text-primary-foreground"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-4 bg-background">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Textarea
            placeholder="Type your message as admin..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[60px] max-h-[120px] resize-none"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  )
}