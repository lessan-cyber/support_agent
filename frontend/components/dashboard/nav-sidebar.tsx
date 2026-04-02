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
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog"
import { PdfUploader } from "@/components/pdf-uploader"

// user interface
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    id: string
    email?: string | null
    user_metadata?: Record<string, any>
  } | null
}

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

export function NavSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  

  // Générer une couleur basée sur la première lettre du nom
    const getAvatarColor = (name: string) => {
      if (!name) return 'bg-gray-400'
      const firstLetter = name.charAt(0).toUpperCase()
      const charCode = firstLetter.charCodeAt(0)
      const colors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-green-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-purple-500',
        'bg-pink-500',
      ]
      return colors[charCode % colors.length]
    }

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
                    <div className="absolute inset-0 bg-linear-to-br from-cyan-400 via-purple-500 to-purple-600 blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-full h-full bg-linear-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
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
                    <DialogHeader title="Upload Document" />
                    <PdfUploader />
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
      {user ? (
        <NavUser
          user={{
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            avatar: user.user_metadata?.name || user.email?.split('@')[0] || 'U',
            avatarColor: getAvatarColor(user.user_metadata?.name || user.email?.split('@')[0] || 'U'),
          } as any}
        />
      ) : (
        <div>Non connecté</div>
      )}
    </SidebarFooter>
    </Sidebar>
  )
}