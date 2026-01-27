// components/dashboard/nav-sidebar.tsx
"use client"

import * as React from "react"
import { ArchiveX, FileInput, File, Inbox, Send, Trash2, Plus } from "lucide-react"
import { NavUser } from "@/components/dashboard/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
// import { PdfUploader } from "@/components/pdf-uploader"

const navItems = [
  {
    title: "Inbox",
    url: "/dashboard/inbox/messages",
    icon: Inbox,
  },
  {
    title: "Drafts",
    url: "/dashboard/inbox/drafts",
    icon: File,
  },
  {
    title: "Sent",
    url: "/dashboard/inbox/sent",
    icon: Send,
  },
  {
    title: "Junk",
    url: "/dashboard/junk",
    icon: ArchiveX,
  },
  {
    title: "Trash",
    url: "/dashboard/trash",
    icon: Trash2,
  },
  {
    title: "All Documents",
    icon: FileInput,
    url: "/dashboard/documents",
  },
]

export function NavSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, profile, loading } = useUser()

  if (!user && !loading) return null

  return (
    <Sidebar
      collapsible="icon"
      className="w-[calc(var(--sidebar-width-icon)+1px)] border-r bg-background"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
              <div>
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="relative size-8 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-purple-500 to-purple-600 blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-full h-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              {/* Bouton Add Document */}
              <SidebarMenuItem>
                <Dialog>
                  <DialogTrigger asChild>
                    <SidebarMenuButton
                      tooltip={{ children: "Add Document", hidden: false }}
                      className="px-2.5 md:px-2 bg-primary text-primary-foreground rounded-lg mb-2 cursor-pointer"
                    >
                      <Plus />
                      <span>Add Document</span>
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    {/* <PdfUploader /> */}
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>

              {/* Navigation items */}
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={{ children: item.title, hidden: false }}
                    asChild
                    isActive={pathname === item.url}
                    className="px-2.5 md:px-2"
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : profile ? (
          <NavUser
            user={{
              name: profile.name,
              email: profile.email,
              avatar: profile.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Joe",
            }}
          />
        ) : (
          <div>Non connecté</div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}