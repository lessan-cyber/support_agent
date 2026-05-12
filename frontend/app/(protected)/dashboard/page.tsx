'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/use-user'
import { useChatHistory } from '@/hooks/use-chat-history'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TicketsPanel } from '@/components/dashboard/tickets-panel'
import { LiveConversation } from '@/components/dashboard/live-conversation'

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const { conversations, loading: chatLoading, error } = useChatHistory()
  const [selectedTicketId, setSelectedTicketId] = useState<string>()

  const loading = userLoading || chatLoading

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-lg">
          <p className="font-semibold">Erreur</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 m-4">
      {/* Header */}
      <DashboardHeader 
        user={user as { email?: string; user_metadata?: { name?: string } }}
        conversations={conversations}
      />

      {/* Stats Cards */}
      <StatsCards conversations={conversations} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Tickets Panel */}
          <TicketsPanel
            conversations={conversations}
            selectedTicketId={selectedTicketId}
            onSelectTicket={setSelectedTicketId}
            limit={10}
          />
        </div>

        <div>
          {/* Live Conversation */}
          <LiveConversation ticketId={selectedTicketId} />
        </div>
      </div>
    </div>
  )
}