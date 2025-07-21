'use client'

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Calculator, FileText, LogOut } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

// Partner Portal Navigation Data - Cleaned up to only include working links
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      items: [
        {
          title: "My Clients",
          url: "/dashboard",
          icon: Home,
            isActive: pathname === "/dashboard",
        },
      ],
    },
    {
      title: "Tools",
      url: "#",
      icon: Calculator,
      items: [
        {
          title: "Mortgage Affordability",
          url: "/dashboard/mortgage-affordability",
          icon: Calculator,
            isActive: pathname === "/dashboard/mortgage-affordability",
        },
      ],
    },
    {
      title: "Applications",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "View Applications",
          url: "/dashboard",
          icon: FileText,
            isActive: pathname === "/dashboard",
        },
      ],
    },
  ],
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Image 
            src="/favicons/favicon-32x32.png" 
            alt="Visto Capital" 
            width={32}
            height={32}
            className="h-8 w-8 rounded-md"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Visto Capital</span>
            <span className="text-xs text-sidebar-foreground/70">Partner Portal</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="text-sidebar-foreground/70">{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((subItem) => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton asChild isActive={subItem.isActive}>
                      <Link href={subItem.url} className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary">
                        {subItem.icon && <subItem.icon className="h-4 w-4" />}
                        {subItem.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SignOutButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}

// Client component for sign out functionality
function SignOutButton() {
  const handleSignOut = async () => {
    // Future: Implement sign out functionality
    console.log('Sign out clicked')
  }

  return (
    <SidebarMenuButton onClick={handleSignOut} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
      <LogOut className="h-4 w-4" />
      Sign Out
    </SidebarMenuButton>
  )
}
