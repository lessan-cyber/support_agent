// app/dashboard/layout.tsx
import React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NavSidebar } from "@/components/dashboard/nav-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
        style={{ "--sidebar-width": "40px" } as React.CSSProperties}
        >
      <NavSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}