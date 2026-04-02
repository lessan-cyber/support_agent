// app/dashboard/layout.tsx
import React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NavSidebar } from "@/components/dashboard/nav-sidebar"
import { Toaster } from "@/components/ui/sonner"
import { getUser } from "@/app/actions/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
    redirect('/login')
  }
  return (
    <SidebarProvider
        style={{ "--sidebar-width": "50px" } as React.CSSProperties}
        >
      <NavSidebar user={user} />
      <SidebarInset>
        <Toaster />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}