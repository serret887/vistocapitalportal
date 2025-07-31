'use client'

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Calculator, FileText, LogOut, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signOut } from "@/lib/auth-client"
import { toast } from "sonner"

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
          url: "/dashboard/clients",
          icon: Users,
            isActive: pathname === "/dashboard/clients",
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
        {
          title: "DSCR Calculator",
          url: "/dashboard/dscr-calculator",
          icon: Calculator,
            isActive: pathname === "/dashboard/dscr-calculator",
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
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      console.log('Starting sign out process...')
      
      // Check if token exists before making the request
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      console.log('Token exists:', !!token)
      
      const { error } = await signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        toast.error('Failed to sign out. Please try again.')
        return
      }

      console.log('Sign out successful, redirecting to login...')
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
      toast.error('An unexpected error occurred during sign out')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SidebarMenuButton 
      onClick={handleSignOut} 
      className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
      disabled={isLoading}
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? "Signing out..." : "Sign Out"}
    </SidebarMenuButton>
  )
}
