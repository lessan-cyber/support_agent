// components/dashboard/inbox-sidebar.tsx
"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Clock, UserCheck, Inbox } from "lucide-react"

type ConversationStatus = "open" | "pending_human" | "all"

interface Conversation {
  id: string
  userName: string
  userAvatar?: string
  lastMessage: string
  timestamp: string
  status: "open" | "pending_human"
  unreadCount: number
}

// Données d'exemple - À remplacer par vos vraies données
const conversations: Conversation[] = [
  {
    id: "1",
    userName: "Alice Martin",
    lastMessage: "J'ai besoin d'aide avec mon compte",
    timestamp: "2m ago",
    status: "open",
    unreadCount: 2,
  },
  {
    id: "2",
    userName: "Bob Dupont",
    lastMessage: "Merci pour votre aide !",
    timestamp: "15m ago",
    status: "pending_human",
    unreadCount: 0,
  },
  {
    id: "3",
    userName: "Claire Bernard",
    lastMessage: "Comment puis-je réinitialiser...",
    timestamp: "1h ago",
    status: "open",
    unreadCount: 5,
  },
  {
    id: "4",
    userName: "David Moreau",
    lastMessage: "Le paiement ne fonctionne pas",
    timestamp: "2h ago",
    status: "pending_human",
    unreadCount: 1,
  },
]

const statusConfig = {
  open: { label: "Open", icon: Inbox, color: "bg-green-500" },
  pending_human: { label: "Pending Human", icon: UserCheck, color: "bg-orange-500" },
  all: { label: "All", icon: Clock, color: "bg-blue-500" },
}

interface InboxSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onConversationSelect?: (conversationId: string) => void
  selectedConversationId?: string
}

export function InboxSidebar({ 
  onConversationSelect, 
  selectedConversationId,
  ...props 
}: InboxSidebarProps) {
  const [filter, setFilter] = React.useState<ConversationStatus>("all")
  const [search, setSearch] = React.useState("")

  const filteredConversations = conversations.filter((conv) => {
    const matchesFilter = filter === "all" || conv.status === filter
    const matchesSearch = conv.userName.toLowerCase().includes(search.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <Sidebar 
      collapsible="none" 
      className="hidden md:flex border-r w-80"
      {...props}
    >
      <SidebarHeader className="gap-3 border-b p-4">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-base font-semibold">Conversations</h2>
          <Badge variant="secondary" className="text-xs">
            {filteredConversations.length}
          </Badge>
        </div>
        
        {/* Filtre */}
        <Select value={filter} onValueChange={(value) => setFilter(value as ConversationStatus)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter conversations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>All</span>
              </div>
            </SelectItem>
            <SelectItem value="open">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                <span>Open</span>
              </div>
            </SelectItem>
            <SelectItem value="pending_human">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span>Pending Human</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Recherche */}
        <SidebarInput 
          placeholder="Search conversations..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SidebarHeader>

      <SidebarContent className="p-0">
        <ScrollArea className="h-full">
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {filteredConversations.map((conv) => {
                const StatusIcon = statusConfig[conv.status].icon
                const isSelected = selectedConversationId === conv.id
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => onConversationSelect?.(conv.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-4 border-b transition-colors text-left",
                      "hover:bg-accent",
                      isSelected && "bg-accent border-l-4 border-l-primary"
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {conv.userName.charAt(0)}
                      </div>
                      {/* Status indicator */}
                      <div 
                        className={cn(
                          "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                          statusConfig[conv.status].color
                        )} 
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {conv.userName}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {conv.timestamp}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {conv.lastMessage}
                      </p>

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[conv.status].label}
                        </Badge>
                        
                        {conv.unreadCount > 0 && (
                          <Badge 
                            variant="default" 
                            className="text-xs bg-primary"
                          >
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}

              {filteredConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Inbox className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No conversations found</p>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}