"use client"

import * as React from "react"
import { ArchiveX, FileInput, File, Inbox, Send, Trash2, Weight, Plus, Settings } from "lucide-react"

import { NavUser } from "@/components/dashboard/nav-user"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { useRouter } from "next/navigation";
import { useUser, useUsers } from "@/hooks/use-user"
import { signOut } from "@/app/actions/auth"

// This is sample data
const data = {
  user: {
    name: "Joseph Bourne",
    email: "joe@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Inbox",
      url: "/dashboard/inbox/messages",
      icon: Inbox,
      isActive: true,
    },
    {
      title: "Documents",
      url: "/dashboard/documents",
      icon: FileInput,
      isActive: false,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: Weight,
      isActive: false,
    },
    {
      title: "settings",
      url: "/dashboard/settings",
      icon: Settings,
      isActive: false,
    },
    // {
    //   title: "Drafts",
    //   url: "/dashboard/inbox/mas",
    //   icon: File,
    //   isActive: false,
    // },
    // {
    //   title: "Sent",
    //   url: "/dashboard/inbox/mis",
    //   icon: Send,
    //   isActive: false,
    // },
    // {
    //   title: "Junk",
    //   url: "#",
    //   icon: ArchiveX,
    //   isActive: false,
    // },
    // {
    //   title: "Trash",
    //   url: "#",
    //   icon: Trash2,
    //   isActive: false,
    // },
    // {
    // title: "All Documents",
    // icon: FileInput,
    // url: "#",
    // isActive: false,
    // },
  ],

}

const files = {
    add:{
        id: 0,
        title: "Add Document",
        icon: Plus,
        url: "#",
    },

    userdocuments: [
        {
            id: 1,
            title: "Project Proposal.docx",
            Weight: "2.3 MB",
        },
        {
            id: 2,
            title: "Meeting Notes.pdf",
            Weight: "1.1 MB",
        },
            {
            id: 3,
            title: "Budget.xlsx",
            Weight: "3.5 MB",
        },
            {
            id: 4,
            title: "Design Mockup.psd",
            Weight: "5.2 MB",
        },
    ]
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0])
  const { setOpen } = useSidebar()
  const router = useRouter();

    const { user, profile, loading } = useUser()
    const [showMenu, setShowMenu] = React.useState(false)
    const [isPending, startTransition] = React.useTransition()
  
    const handleSignOut = () => {
      startTransition(async () => {
        await signOut()
      })
    }

    // React.useEffect(() => {
    //   console.log('[AppSidebar] State:', { loading, userExists: !!user, profileExists: !!profile, userName: profile?.name })
    // }, [loading, user, profile])
  
    if (!user && !loading) return null

  return (
    <Sidebar
      collapsible="icon"
      className="*:data-[sidebar=sidebar]:flex-row bg-background"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r bg-background"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <div>                {/* <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"> */}
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
                  {/* </div> */}
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
                <SidebarMenuItem >
                    <SidebarMenuButton
                    tooltip={{
                        children: files.add.title,
                        hidden: false,
                    }}
                    className="px-2.5 md:px-2 bg-primary text-primary-foreground rounded-lg mb-2 cursor-pointer"
                    >
                    <files.add.icon />
                    <span>{files.add.title}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                {/* {files.userdocuments.map((item) => (
                    <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        tooltip={{
                        children: item.title,
                        hidden: false,
                        }}
                        className="px-2.5 md:px-2"
                    >
                        <Weight />
                        <span>{item.title}</span>
                        <span className="ml-auto text-xs">{item.Weight}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))} */}
                 {/* <SidebarMenuItem>
                    <SidebarMenuButton
                    tooltip={{
                        children: files.addedfiles.title,
                        hidden: false,
                    }}
                    className="px-2.5 md:px-2"
                    >
                    <files.addedfiles.icon />
                    <span>{files.addedfiles.title}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem> */}
                </SidebarMenu>
            </SidebarGroupContent>
            </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item)
                        setOpen(true)
                        router.push(item.url);
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
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
                    avatar: profile.avatar_url || "/avatars/default.jpg" 
                  }} 
                />
              ) : (
                <div>Non connecté</div>
              )}
            </SidebarFooter>
      </Sidebar>

    </Sidebar>
  )
}
